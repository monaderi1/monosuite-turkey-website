import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateSnapshot } from "./lib/content-snapshot.mjs";

function argumentValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const registryPath = resolve(argumentValue("--registry", "content/confluence-pages.json"));
const snapshotPath = resolve(argumentValue("--snapshot", "content/website-content.snapshot.json"));
const registry = JSON.parse(await readFile(registryPath, "utf8"));
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
const stats = validateSnapshot(snapshot, registry);

console.log(
  `PASS: ${stats.routeCount} routes, ${stats.routeContentCount} route items, ` +
  `${stats.sharedContentCount} shared items, ${stats.excludedContentCount} excluded items`
);
