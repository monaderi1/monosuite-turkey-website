import { parse } from "parse5";

export const CONTENT_ATTRIBUTE = "data-cyobik-content";

export function normaliseText(value) {
  return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function walk(node, visitor) {
  visitor(node);
  for (const child of node.childNodes || []) walk(child, visitor);
}

export function elements(document) {
  const output = [];
  walk(document, node => {
    if (node.tagName && node.sourceCodeLocation?.startTag && node.sourceCodeLocation?.endTag) {
      output.push(node);
    }
  });
  return output;
}

export function textNodes(node) {
  const output = [];
  walk(node, child => {
    if (child.nodeName === "#text" && normaliseText(child.value)) output.push(child);
  });
  return output;
}

export function elementText(node) {
  return normaliseText(textNodes(node).map(child => child.value).join(" "));
}

export function attr(node, name) {
  return (node.attrs || []).find(item => item.name === name)?.value;
}

export function classes(node) {
  return new Set((attr(node, "class") || "").split(/\s+/).filter(Boolean));
}

export function parseHtml(source) {
  return parse(source, { sourceCodeLocationInfo: true });
}

export function replaceRanges(source, replacements) {
  const ordered = [...replacements].sort((a, b) => b.start - a.start);
  let previousStart = source.length + 1;

  for (const replacement of ordered) {
    if (replacement.start < 0 || replacement.end < replacement.start || replacement.end > source.length) {
      throw new Error(`Invalid replacement range ${replacement.start}:${replacement.end}`);
    }
    if (replacement.end > previousStart) {
      throw new Error(`Overlapping replacement at ${replacement.start}:${replacement.end}`);
    }
    source = source.slice(0, replacement.start) + replacement.value + source.slice(replacement.end);
    previousStart = replacement.start;
  }

  return source;
}

export function escapeHtmlText(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function escapeHtmlAttribute(value) {
  // Keep the repository's existing attribute style byte-for-byte. A bare
  // ampersand is valid here when it is not the start of a character reference.
  return String(value).replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function routeOutputPath(route) {
  if (!/^\/(en|tr)\//.test(route)) throw new Error(`Unsupported website route: ${route}`);
  if (route === "/en/" || route === "/tr/") return `${route.slice(1)}index.html`;
  return `${route.slice(1)}.html`;
}

export function rendererFor(node) {
  const nodes = textNodes(node);
  if (nodes.length <= 1) return "simple";

  const childTags = new Set();
  walk(node, child => {
    if (child !== node && child.tagName) childTags.add(child.tagName);
  });

  if (childTags.has("small")) return "small";
  if (childTags.has("strong")) return "strong-prefix";
  if (childTags.has("a")) return "link";
  if (childTags.has("br")) return "breaks";
  return "segments";
}

export function preferredTags(locationRole) {
  const role = locationRole.toLowerCase();
  if (/\bh1\b/.test(role)) return ["h1"];
  if (/\bh2\b/.test(role)) return ["h2"];
  if (/\bh3\b/.test(role)) return ["h3"];
  if (/\bh4\b/.test(role)) return ["h4"];
  if (role.includes("paragraph") || role.includes("intro") || role.includes("summary") || role.includes("outcome")) return ["p"];
  if (role.includes("list item")) return ["li"];
  if (role.includes("address")) return ["address"];
  if (role.includes("cta")) return ["a", "button"];
  if (role.includes("eyebrow")) return ["div", "span"];
  if (role.includes("diagram node")) return ["div"];
  if (role.includes("table heading")) return ["th"];
  if (role.includes("table cell")) return ["td"];
  if (role.includes("label")) return ["label", "span", "b", "div"];
  return ["h1", "h2", "h3", "h4", "p", "li", "a", "button", "span", "b", "strong", "div", "address", "th", "td"];
}

export function jsContextAt(source, targetOffset) {
  let state = "code";
  let escaped = false;

  for (let index = 0; index < targetOffset; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (state === "line-comment") {
      if (char === "\n") state = "code";
      continue;
    }
    if (state === "block-comment") {
      if (char === "*" && next === "/") {
        state = "code";
        index += 1;
      }
      continue;
    }
    if (state !== "code") {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if ((state === "single" && char === "'") || (state === "double" && char === '"') || (state === "template" && char === "`")) {
        state = "code";
      }
      continue;
    }

    if (char === "/" && next === "/") {
      state = "line-comment";
      index += 1;
    } else if (char === "/" && next === "*") {
      state = "block-comment";
      index += 1;
    } else if (char === "'") state = "single";
    else if (char === '"') state = "double";
    else if (char === "`") state = "template";
  }

  return state;
}

export function encodeJs(value, context) {
  const text = String(value).replaceAll("\\", "\\\\").replaceAll("\r", "\\r").replaceAll("\n", "\\n");
  if (context === "single") return text.replaceAll("'", "\\'");
  if (context === "double") return text.replaceAll('"', '\\"');
  if (context === "template") return text.replaceAll("`", "\\`").replaceAll("${", "\\${");
  throw new Error(`Unsupported JavaScript token context: ${context}`);
}
