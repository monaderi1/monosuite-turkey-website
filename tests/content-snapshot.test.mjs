import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateSnapshot } from "../scripts/lib/content-snapshot.mjs";

test("checked-in Confluence snapshot is structurally valid", async () => {
  const registry = JSON.parse(await readFile("content/confluence-pages.json", "utf8"));
  const snapshot = JSON.parse(await readFile("content/website-content.snapshot.json", "utf8"));
  const stats = validateSnapshot(snapshot, registry);

  assert.equal(stats.routeCount, 12);
  assert.ok(stats.routeContentCount > 500);
  assert.ok(stats.sharedContentCount > 20);
});

test("draft route content cannot enter the publishable snapshot", async () => {
  const registry = JSON.parse(await readFile("content/confluence-pages.json", "utf8"));
  const snapshot = JSON.parse(await readFile("content/website-content.snapshot.json", "utf8"));
  snapshot.routes.home.sourcePage.status = "Draft";

  assert.throws(
    () => validateSnapshot(snapshot, registry),
    /sourcePage\.status is not publishable/
  );
});
