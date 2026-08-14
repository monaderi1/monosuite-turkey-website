const BLOCK_TYPES = new Set([
  "blockquote",
  "bulletList",
  "heading",
  "listItem",
  "orderedList",
  "paragraph"
]);

function collectText(node, output) {
  if (!node || typeof node !== "object") return;

  if (typeof node.text === "string") output.push(node.text);
  if (node.type === "hardBreak") output.push("\n");

  for (const child of node.content || []) collectText(child, output);

  if (BLOCK_TYPES.has(node.type)) output.push("\n");
}

export function nodeText(node, { preserveBreaks = false } = {}) {
  const output = [];
  collectText(node, output);
  const value = output.join("").replace(/\u00a0/g, " ");

  if (preserveBreaks) {
    return value
      .split("\n")
      .map(line => line.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n");
  }

  return value.replace(/\s+/g, " ").trim();
}

export function findNodes(root, type) {
  const matches = [];

  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === type) matches.push(node);
    for (const child of node.content || []) visit(child);
  }

  visit(root);
  return matches;
}

export function tableMatrix(table) {
  return (table.content || [])
    .filter(row => row.type === "tableRow")
    .map(row => (row.content || [])
      .filter(cell => cell.type === "tableCell" || cell.type === "tableHeader")
      .map(cell => nodeText(cell)));
}

export function pageStatus(doc) {
  const blockquote = findNodes(doc, "blockquote")[0];
  if (!blockquote) return "";

  const lines = nodeText(blockquote, { preserveBreaks: true }).split("\n");
  const line = lines.find(value => value.startsWith("Status:"));
  return line ? line.slice("Status:".length).trim() : "";
}

function tableWithHeader(doc, requiredHeaders) {
  for (const table of findNodes(doc, "table")) {
    const matrix = tableMatrix(table);
    const headers = matrix[0] || [];
    if (requiredHeaders.every(header => headers.includes(header))) return matrix;
  }
  return null;
}

function rowsAsObjects(matrix) {
  const headers = matrix[0];
  return matrix.slice(1).map(row => Object.fromEntries(
    headers.map((header, index) => [header, row[index] || ""])
  ));
}

function sourcePage(page, status) {
  return {
    id: String(page.id),
    title: page.title,
    version: Number(page.version?.number || 0),
    status
  };
}

export function extractRoutePage(page) {
  const doc = page.body;
  const status = pageStatus(doc);
  const metadataTable = tableWithHeader(doc, ["Field", "English", "Turkish"]);
  const contentTable = tableWithHeader(doc, ["Content ID", "English", "Turkish"]);

  if (!metadataTable) throw new Error(`${page.title}: route metadata table not found`);
  if (!contentTable) throw new Error(`${page.title}: content registry table not found`);

  const metadataRows = Object.fromEntries(
    rowsAsObjects(metadataTable).map(row => [row.Field, row])
  );
  const requiredMetadata = ["Route", "Meta title", "Meta description"];
  for (const field of requiredMetadata) {
    if (!metadataRows[field]) throw new Error(`${page.title}: missing ${field}`);
  }

  const content = {};
  for (const row of rowsAsObjects(contentTable)) {
    const contentId = row["Content ID"];
    if (!contentId) continue;
    if (content[contentId]) throw new Error(`${page.title}: duplicate content ID ${contentId}`);

    content[contentId] = {
      locationRole: row["Location / role"] || "",
      en: row.English,
      tr: row.Turkish,
      implementation: row["Current implementation"] || "",
      status
    };
  }

  return {
    sourcePage: sourcePage(page, status),
    route: {
      en: metadataRows.Route.English,
      tr: metadataRows.Route.Turkish
    },
    metadata: {
      title: {
        en: metadataRows["Meta title"].English,
        tr: metadataRows["Meta title"].Turkish
      },
      description: {
        en: metadataRows["Meta description"].English,
        tr: metadataRows["Meta description"].Turkish
      }
    },
    content
  };
}

function isPublishableStatus(status) {
  return status === "Implemented baseline" || status === "Approved";
}

export function extractSharedPage(page) {
  const doc = page.body;
  const status = pageStatus(doc);
  const content = {};
  const excluded = [];

  for (const table of findNodes(doc, "table")) {
    const matrix = tableMatrix(table);
    const headers = matrix[0] || [];
    if (!headers.includes("Content ID") || !headers.includes("Turkish") || !headers.includes("Status")) {
      continue;
    }

    const englishHeader = headers.includes("English")
      ? "English"
      : headers.includes("English implementation string")
        ? "English implementation string"
        : null;
    if (!englishHeader) continue;

    for (const row of rowsAsObjects(matrix)) {
      const contentId = row["Content ID"];
      if (!contentId) continue;

      const entry = {
        element: row.Element || "",
        en: row[englishHeader],
        tr: row.Turkish,
        status: row.Status
      };

      if (!isPublishableStatus(row.Status)) {
        excluded.push({ contentId, ...entry });
        continue;
      }

      if (content[contentId]) throw new Error(`${page.title}: duplicate content ID ${contentId}`);
      content[contentId] = entry;
    }
  }

  if (!Object.keys(content).length) throw new Error(`${page.title}: no publishable shared content found`);

  return {
    sourcePage: sourcePage(page, status),
    content,
    excluded
  };
}

export function parseApiPage(page) {
  const value = page.body?.atlas_doc_format?.value;
  if (!value) throw new Error(`${page.title || page.id}: atlas_doc_format body is missing`);

  return {
    id: String(page.id),
    title: page.title,
    version: page.version,
    body: typeof value === "string" ? JSON.parse(value) : value
  };
}
