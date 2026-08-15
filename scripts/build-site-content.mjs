import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  CONTENT_ATTRIBUTE,
  attr,
  elementText,
  elements,
  encodeJs,
  escapeHtmlAttribute,
  escapeHtmlText,
  normaliseText,
  parseHtml,
  replaceRanges,
  routeOutputPath,
  textNodes
} from "./lib/site-build.mjs";

const checkOnly = process.argv.includes("--check");
const snapshot = JSON.parse(await readFile(resolve("content/website-content.snapshot.json"), "utf8"));
const manifest = JSON.parse(await readFile(resolve("site/templates/manifest.json"), "utf8"));
const baseUrl = "https://cyobik.com";
const generated = [];

function validateManifestCoverage() {
  const covered = new Map();
  const register = binding => {
    const scope = binding.scope || "route";
    const owner = scope === "shared" ? "shared" : binding.routeKey;
    const languages = binding.lang === "both" ? ["en", "tr"] : [binding.lang];
    for (const lang of languages) {
      const key = `${scope}:${owner}:${binding.contentId}:${lang}`;
      covered.set(key, (covered.get(key) || 0) + 1);
    }
  };
  manifest.htmlBindings.forEach(register);
  manifest.jsBindings.forEach(register);

  const expected = [];
  for (const [routeKey, route] of Object.entries(snapshot.routes)) {
    for (const contentId of Object.keys(route.content)) {
      expected.push(`route:${routeKey}:${contentId}:en`, `route:${routeKey}:${contentId}:tr`);
    }
  }
  for (const contentId of Object.keys(snapshot.shared.content)) {
    expected.push(`shared:shared:${contentId}:en`, `shared:shared:${contentId}:tr`);
  }

  const missing = expected.filter(key => !covered.has(key));
  const duplicates = [...covered].filter(([, count]) => count !== 1).map(([key, count]) => `${key} (${count})`);
  const unexpected = [...covered.keys()].filter(key => !expected.includes(key));
  if (missing.length || duplicates.length || unexpected.length) {
    throw new Error([
      "Template manifest does not exactly cover the publishable snapshot.",
      missing.length ? `Missing: ${missing.join(", ")}` : "",
      duplicates.length ? `Duplicate: ${duplicates.join(", ")}` : "",
      unexpected.length ? `Unexpected: ${unexpected.join(", ")}` : ""
    ].filter(Boolean).join("\n"));
  }
}

validateManifestCoverage();

function currentValue(binding) {
  if (binding.scope === "shared") {
    const entry = snapshot.shared.content[binding.contentId];
    if (binding.lang === "both") {
      if (entry?.en !== entry?.tr) throw new Error(`${binding.contentId}: shared JavaScript binding requires equal English and Turkish values`);
      return entry?.en;
    }
    return entry?.[binding.lang];
  }
  const routeKey = binding.routeKey || "home";
  const entry = snapshot.routes[routeKey]?.content[binding.contentId];
  if (binding.lang === "both") {
    if (entry?.en !== entry?.tr) throw new Error(`${binding.contentId}: route JavaScript binding requires equal English and Turkish values`);
    return entry?.en;
  }
  return entry?.[binding.lang];
}

function replaceTextNode(source, node, value) {
  const original = node.value;
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  return {
    start: node.sourceCodeLocation.startOffset,
    end: node.sourceCodeLocation.endOffset,
    value: leading + escapeHtmlText(value) + trailing
  };
}

function renderChangedElement(source, node, value, renderer, contentId) {
  const nodes = textNodes(node);
  if (renderer === "simple" && nodes.length === 1) return [replaceTextNode(source, nodes[0], value)];

  if (renderer === "strong-prefix") {
    const colon = value.indexOf(":");
    if (colon === -1 || nodes.length < 2) throw new Error(`${contentId}: expected a colon-separated strong-label value`);
    return [replaceTextNode(source, nodes[0], value.slice(0, colon + 1)), replaceTextNode(source, nodes[1], value.slice(colon + 1).trim())];
  }

  if (renderer === "link") {
    const anchor = elements(node).find(child => child !== node && child.tagName === "a");
    const anchorText = anchor ? elementText(anchor) : "";
    if (!anchor || !anchorText || !value.includes(anchorText) || nodes.length < 3) {
      throw new Error(`${contentId}: linked copy changed around an unrecognised anchor; update the template binding intentionally`);
    }
    const [before, after] = value.split(anchorText);
    const anchorNode = textNodes(anchor)[0];
    return [
      replaceTextNode(source, nodes[0], before.trim()),
      replaceTextNode(source, anchorNode, anchorText),
      replaceTextNode(source, nodes[nodes.length - 1], after.trim())
    ];
  }

  if (renderer === "small" && nodes.length === 2) {
    const first = normaliseText(nodes[0].value);
    const second = normaliseText(nodes[1].value);
    if (value.startsWith(`${first} `)) return [replaceTextNode(source, nodes[1], value.slice(first.length).trim())];
    if (value.endsWith(` ${second}`)) return [replaceTextNode(source, nodes[0], value.slice(0, -second.length).trim())];
    throw new Error(`${contentId}: both diagram-node segments changed; split the content ID before publishing`);
  }

  if (renderer === "breaks") {
    const parts = value.split(/,\s+/);
    if (parts.length !== nodes.length) throw new Error(`${contentId}: address line count changed; update the template binding intentionally`);
    return nodes.map((textNode, index) => replaceTextNode(source, textNode, index === parts.length - 1 ? parts[index] : `${parts[index]},`));
  }

  throw new Error(`${contentId}: composite content changed; update the template binding intentionally`);
}

function buildRoute(templateSource, routeRecord) {
  const route = snapshot.routes[routeRecord.routeKey];
  if (!route) throw new Error(`Unknown route key ${routeRecord.routeKey}`);
  if (routeOutputPath(route.route[routeRecord.lang]) !== routeRecord.output) {
    throw new Error(`${routeRecord.routeKey}.${routeRecord.lang}: route changed; perform an explicit route-file migration`);
  }

  let source = templateSource
    .replaceAll("{{CYOBIK:META_TITLE}}", escapeHtmlText(route.metadata.title[routeRecord.lang]))
    .replaceAll("{{CYOBIK:META_DESCRIPTION}}", escapeHtmlAttribute(route.metadata.description[routeRecord.lang]))
    .replaceAll("{{CYOBIK:CANONICAL}}", escapeHtmlAttribute(`${baseUrl}${route.route[routeRecord.lang]}`))
    .replaceAll("{{CYOBIK:ALTERNATE_EN}}", escapeHtmlAttribute(`${baseUrl}${route.route.en}`))
    .replaceAll("{{CYOBIK:ALTERNATE_TR}}", escapeHtmlAttribute(`${baseUrl}${route.route.tr}`));

  const document = parseHtml(source);
  const replacements = [];
  const seen = new Set();
  for (const node of elements(document)) {
    const contentId = attr(node, CONTENT_ATTRIBUTE);
    if (!contentId) continue;
    const binding = manifest.htmlBindings.find(item => item.routeKey === routeRecord.routeKey && item.lang === routeRecord.lang && item.contentId === contentId);
    if (!binding) throw new Error(`${routeRecord.template}: unregistered HTML binding ${contentId}`);
    if (seen.has(contentId)) throw new Error(`${routeRecord.template}: duplicate HTML binding ${contentId}`);
    seen.add(contentId);
    if (elementText(node) !== normaliseText(binding.elementBaseline || binding.baseline)) {
      throw new Error(`${routeRecord.template}: template baseline changed for ${contentId}`);
    }

    const attrLocation = node.sourceCodeLocation.startTag.attrs?.[CONTENT_ATTRIBUTE];
    if (!attrLocation) throw new Error(`${routeRecord.template}: source location missing for ${contentId}`);
    let attrStart = attrLocation.startOffset;
    while (attrStart > node.sourceCodeLocation.startTag.startOffset && /\s/.test(source[attrStart - 1])) attrStart -= 1;
    replacements.push({ start: attrStart, end: attrLocation.endOffset, value: "" });

    const value = route.content[contentId]?.[routeRecord.lang];
    if (typeof value !== "string") throw new Error(`${routeRecord.routeKey}.${routeRecord.lang}: snapshot value missing for ${contentId}`);
    if (normaliseText(value) !== normaliseText(binding.baseline)) {
      const renderedValue = `${binding.prefix || ""}${value}${binding.suffix || ""}`;
      replacements.push(...renderChangedElement(source, node, renderedValue, binding.renderer, contentId));
    }
  }

  const expected = manifest.htmlBindings.filter(item => item.routeKey === routeRecord.routeKey && item.lang === routeRecord.lang).length;
  if (seen.size !== expected) throw new Error(`${routeRecord.template}: expected ${expected} HTML bindings; found ${seen.size}`);
  source = replaceRanges(source, replacements);
  if (source.includes("{{CYOBIK:") || source.includes(CONTENT_ATTRIBUTE)) throw new Error(`${routeRecord.template}: unresolved template marker`);
  return source;
}

function buildScript(templateSource, scriptRecord) {
  let source = templateSource;
  const bindings = manifest.jsBindings.filter(binding => binding.file === scriptRecord.output);
  for (const binding of bindings) {
    const value = currentValue(binding);
    if (typeof value !== "string") throw new Error(`${binding.contentId}.${binding.lang}: snapshot value missing`);
    const occurrences = source.split(binding.token).length - 1;
    if (occurrences !== 1) throw new Error(`${scriptRecord.template}: expected one ${binding.token}; found ${occurrences}`);
    source = source.replace(binding.token, encodeJs(value, binding.context));
  }
  if (/__CYOBIK_\d{4}__/.test(source)) throw new Error(`${scriptRecord.template}: unresolved JavaScript content token`);
  return source;
}

for (const routeRecord of manifest.routes) {
  const templateSource = await readFile(resolve(routeRecord.template), "utf8");
  generated.push({ output: routeRecord.output, content: buildRoute(templateSource, routeRecord) });
}
for (const scriptRecord of manifest.scripts) {
  const templateSource = await readFile(resolve(scriptRecord.template), "utf8");
  generated.push({ output: scriptRecord.output, content: buildScript(templateSource, scriptRecord) });
}

const mismatches = [];
let updated = 0;
for (const file of generated) {
  let existing;
  try {
    existing = await readFile(resolve(file.output), "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (existing === file.content) continue;
  if (checkOnly) mismatches.push(file.output);
  else {
    await writeFile(resolve(file.output), file.content, "utf8");
    updated += 1;
  }
}

if (mismatches.length) {
  throw new Error(`Generated website files are stale:\n- ${mismatches.join("\n- ")}\nRun npm run site:build and commit the results.`);
}

console.log(checkOnly
  ? `Verified ${generated.length} website files against the Confluence snapshot.`
  : `Updated ${updated} of ${generated.length} website files from the Confluence snapshot.`);
