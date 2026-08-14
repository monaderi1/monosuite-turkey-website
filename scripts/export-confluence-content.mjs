import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { extractRoutePage, extractSharedPage, parseApiPage } from "./lib/adf-content.mjs";
import { validateSnapshot } from "./lib/content-snapshot.mjs";

function argumentValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function fetchPage(baseUrl, authHeader, pageId) {
  const url = `${baseUrl}/wiki/api/v2/pages/${encodeURIComponent(pageId)}?body-format=atlas_doc_format`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: authHeader
    },
    redirect: "error"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Confluence page ${pageId} returned ${response.status}: ${detail.slice(0, 500)}`);
  }

  return parseApiPage(await response.json());
}

async function mapWithLimit(values, limit, mapper) {
  const output = new Array(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      output[index] = await mapper(values[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return output;
}

function assertExpectedPage(page, config) {
  if (String(page.id) !== String(config.pageId)) {
    throw new Error(`Expected page ${config.pageId}; received ${page.id}`);
  }
  if (page.title !== config.title) {
    throw new Error(`Page ${config.pageId} title changed: expected "${config.title}"; received "${page.title}"`);
  }
}

const registryPath = resolve(argumentValue("--registry", "content/confluence-pages.json"));
const outputPath = resolve(argumentValue("--output", "content/website-content.snapshot.json"));
const registry = await readJson(registryPath);

const baseUrl = (process.env.ATLASSIAN_BASE_URL || "").replace(/\/+$/, "");
const email = process.env.ATLASSIAN_EMAIL;
const apiToken = process.env.ATLASSIAN_API_TOKEN;

if (!baseUrl || !email || !apiToken) {
  throw new Error(
    "ATLASSIAN_BASE_URL, ATLASSIAN_EMAIL and ATLASSIAN_API_TOKEN are required. " +
    "Credentials are read from the environment and must never be committed."
  );
}

const configuredOrigin = new URL(baseUrl);
const registeredOrigin = new URL(registry.siteBaseUrl);
if (configuredOrigin.protocol !== "https:" || configuredOrigin.origin !== registeredOrigin.origin) {
  throw new Error(
    `ATLASSIAN_BASE_URL must use the registered HTTPS origin ${registeredOrigin.origin}. ` +
    "This check prevents credentials from being sent to an unregistered host."
  );
}

const authHeader = `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`;
const routeConfigs = Object.entries(registry.routes);
const pageConfigs = [registry.shared, ...routeConfigs.map(([, config]) => config)];
const pages = await mapWithLimit(pageConfigs, 4, config => fetchPage(baseUrl, authHeader, config.pageId));

for (let index = 0; index < pages.length; index += 1) assertExpectedPage(pages[index], pageConfigs[index]);

const shared = extractSharedPage(pages[0]);
const routes = {};
for (let index = 0; index < routeConfigs.length; index += 1) {
  const [routeKey] = routeConfigs[index];
  routes[routeKey] = extractRoutePage(pages[index + 1]);
}

const snapshot = {
  schemaVersion: 1,
  source: {
    system: "Confluence",
    hubPageId: String(registry.hubPageId),
    governancePageId: String(registry.governancePageId),
    note: "Generated editorial snapshot. Production does not fetch Confluence at runtime."
  },
  shared,
  routes
};

const stats = validateSnapshot(snapshot, registry);
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
console.log(JSON.stringify(stats));
