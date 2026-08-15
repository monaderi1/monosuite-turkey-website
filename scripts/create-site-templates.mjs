import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  CONTENT_ATTRIBUTE,
  classes,
  elementText,
  elements,
  jsContextAt,
  normaliseText,
  parseHtml,
  preferredTags,
  rendererFor,
  replaceRanges,
  routeOutputPath
} from "./lib/site-build.mjs";

const snapshot = JSON.parse(await readFile(resolve("content/website-content.snapshot.json"), "utf8"));
const templateRoot = resolve("site/templates");
const manifest = { schemaVersion: 1, routes: [], scripts: [], htmlBindings: [], jsBindings: [] };

function token(name) {
  return `{{CYOBIK:${name}}}`;
}

function metadataReplacements(source, route, lang) {
  const replacements = [];
  const titlePattern = /<title>[\s\S]*?<\/title>/i;
  const titleMatch = titlePattern.exec(source);
  if (!titleMatch) throw new Error(`${route.sourcePage.title}: title element not found`);
  replacements.push({
    start: titleMatch.index + titleMatch[0].indexOf(">") + 1,
    end: titleMatch.index + titleMatch[0].lastIndexOf("<"),
    value: token("META_TITLE")
  });

  const metaPattern = /<meta\b[^>]*\bname=["']description["'][^>]*>/i;
  const metaMatch = metaPattern.exec(source);
  if (!metaMatch) throw new Error(`${route.sourcePage.title}: meta description not found`);
  const contentMatch = /\bcontent=(["'])([\s\S]*?)\1/i.exec(metaMatch[0]);
  if (!contentMatch) throw new Error(`${route.sourcePage.title}: meta description content not found`);
  const contentStart = metaMatch.index + contentMatch.index + contentMatch[0].indexOf(contentMatch[2]);
  replacements.push({ start: contentStart, end: contentStart + contentMatch[2].length, value: token("META_DESCRIPTION") });

  const links = [...source.matchAll(/<link\b[^>]*>/gi)];
  for (const link of links) {
    const rel = /\brel=(["'])(.*?)\1/i.exec(link[0])?.[2];
    if (rel !== "canonical" && rel !== "alternate") continue;
    const href = /\bhref=(["'])(.*?)\1/i.exec(link[0]);
    if (!href) continue;
    const hrefStart = link.index + href.index + href[0].indexOf(href[2]);
    let value = token("CANONICAL");
    if (rel === "alternate") {
      const hreflang = /\bhreflang=(["'])(.*?)\1/i.exec(link[0])?.[2];
      if (hreflang === "en") value = token("ALTERNATE_EN");
      else if (hreflang === "tr") value = token("ALTERNATE_TR");
      else continue;
    }
    replacements.push({ start: hrefStart, end: hrefStart + href[2].length, value });
  }

  return replacements;
}

function assignHtmlBindings(source, routeKey, route, lang) {
  const document = parseHtml(source);
  const candidates = elements(document).filter(node => {
    if (["html", "head", "body", "main", "section", "article", "header", "footer", "script", "style"].includes(node.tagName)) return false;
    return elementText(node);
  });
  const used = new Set();
  const replacements = metadataReplacements(source, route, lang);
  let lastOffset = 0;

  for (const [contentId, entry] of Object.entries(route.content)) {
    if (entry.implementation !== "Route HTML") continue;
    const expected = normaliseText(entry[lang]);
    const tags = preferredTags(entry.locationRole);
    const matches = candidates.filter(node => !used.has(node) && elementText(node).includes(expected));
    if (!matches.length) throw new Error(`${routeKey}.${lang}: no element matches ${contentId} (${expected})`);

    const scored = matches.map(node => {
      const tagRank = tags.indexOf(node.tagName);
      const exactBonus = elementText(node) === expected ? -100 : 0;
      const eyebrowBonus = entry.locationRole.toLowerCase().includes("eyebrow") && classes(node).has("eyebrow") ? -50 : 0;
      const orderPenalty = node.sourceCodeLocation.startOffset >= lastOffset ? 0 : 100000;
      const span = node.sourceCodeLocation.endOffset - node.sourceCodeLocation.startOffset;
      return { node, score: orderPenalty + (tagRank === -1 ? 1000 : tagRank * 10) + eyebrowBonus + exactBonus + span / 100000 };
    }).sort((a, b) => a.score - b.score || a.node.sourceCodeLocation.startOffset - b.node.sourceCodeLocation.startOffset);

    const node = scored[0].node;
    used.add(node);
    lastOffset = node.sourceCodeLocation.startOffset;
    const insertAt = node.sourceCodeLocation.startTag.endOffset - 1;
    replacements.push({ start: insertAt, end: insertAt, value: ` ${CONTENT_ATTRIBUTE}="${contentId}"` });
    const fullBaseline = elementText(node);
    const baselineOffset = fullBaseline.indexOf(expected);
    manifest.htmlBindings.push({
      routeKey,
      lang,
      contentId,
      baseline: entry[lang],
      elementBaseline: fullBaseline,
      prefix: fullBaseline.slice(0, baselineOffset),
      suffix: fullBaseline.slice(baselineOffset + expected.length),
      renderer: rendererFor(node),
      tagName: node.tagName
    });
  }

  return replaceRanges(source, replacements);
}

function targetForShared(contentId) {
  return contentId.startsWith("SHARED.FORM.") ? "assets/site.js" : "assets/layout.js";
}

function regionFor(source, file, contentId) {
  if (file === "assets/layout.js") {
    const navStart = source.indexOf("const platformItems");
    const homeStart = source.indexOf("if (page === 'home')");
    const footerStart = source.indexOf("const footer");
    if (contentId.startsWith("HOME.")) return [homeStart, footerStart];
    if (contentId.startsWith("SHARED.FOOTER.")) return [footerStart, source.length];
    return [navStart, homeStart];
  }
  const formStart = source.indexOf("const leadForm");
  const homeStart = source.indexOf("if (pageBody.dataset.page === 'home')");
  if (contentId.startsWith("HOME.")) return [homeStart, source.length];
  return [formStart, homeStart];
}

function jsEntries(file) {
  const output = [];
  for (const route of Object.values(snapshot.routes)) {
    for (const [contentId, entry] of Object.entries(route.content)) {
      if (entry.implementation !== file) continue;
      if (entry.en === entry.tr) output.push({ contentId, lang: "both", value: entry.en, scope: "route", routeKey: "home" });
      else for (const lang of ["en", "tr"]) output.push({ contentId, lang, value: entry[lang], scope: "route", routeKey: "home" });
    }
  }
  for (const [contentId, entry] of Object.entries(snapshot.shared.content)) {
    if (targetForShared(contentId) !== file) continue;
    if (entry.en === entry.tr) output.push({ contentId, lang: "both", value: entry.en, scope: "shared" });
    else for (const lang of ["en", "tr"]) output.push({ contentId, lang, value: entry[lang], scope: "shared" });
  }
  return output;
}

function createScriptTemplate(source, file) {
  const replacements = [];
  const occupied = [];
  for (const entry of jsEntries(file).sort((a, b) => b.value.length - a.value.length)) {
    const [start, end] = regionFor(source, file, entry.contentId);
    if (start < 0 || end < 0 || end <= start) throw new Error(`${file}: region not found for ${entry.contentId}`);
    const positions = [];
    let index = source.indexOf(entry.value, start);
    while (index !== -1 && index < end) {
      const before = source[index - 1] || "";
      const after = source[index + entry.value.length] || "";
      const standalone = !/[\p{L}\p{N}_]/u.test(before) && !/[\p{L}\p{N}_]/u.test(after);
      if (standalone && !occupied.some(range => index < range.end && index + entry.value.length > range.start)) positions.push(index);
      index = source.indexOf(entry.value, index + Math.max(1, entry.value.length));
    }
    if (!positions.length) throw new Error(`${file}: value not found for ${entry.contentId}.${entry.lang}: ${entry.value}`);
    const position = positions[0];
    const context = jsContextAt(source, position);
    if (!["single", "double", "template"].includes(context)) {
      throw new Error(`${file}: ${entry.contentId}.${entry.lang} is not inside a supported JavaScript string`);
    }
    const tokenValue = `__CYOBIK_${manifest.jsBindings.length.toString().padStart(4, "0")}__`;
    occupied.push({ start: position, end: position + entry.value.length });
    replacements.push({ start: position, end: position + entry.value.length, value: tokenValue });
    manifest.jsBindings.push({ file, token: tokenValue, context, ...entry });
  }
  return replaceRanges(source, replacements);
}

await mkdir(resolve(templateRoot, "routes"), { recursive: true });
await mkdir(resolve(templateRoot, "assets"), { recursive: true });

for (const [routeKey, route] of Object.entries(snapshot.routes)) {
  for (const lang of ["en", "tr"]) {
    const output = routeOutputPath(route.route[lang]);
    const source = await readFile(resolve(output), "utf8");
    const template = assignHtmlBindings(source, routeKey, route, lang);
    const templatePath = `site/templates/routes/${routeKey}.${lang}.html`;
    await writeFile(resolve(templatePath), template, "utf8");
    manifest.routes.push({ routeKey, lang, template: templatePath, output });
  }
}

for (const file of ["assets/layout.js", "assets/site.js"]) {
  const source = await readFile(resolve(file), "utf8");
  const template = createScriptTemplate(source, file);
  const templatePath = `site/templates/${file}`;
  await writeFile(resolve(templatePath), template, "utf8");
  manifest.scripts.push({ template: templatePath, output: file });
}

await writeFile(resolve(templateRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Created ${manifest.routes.length} route templates and ${manifest.scripts.length} script templates.`);
console.log(`Bound ${manifest.htmlBindings.length} HTML values and ${manifest.jsBindings.length} JavaScript values.`);
