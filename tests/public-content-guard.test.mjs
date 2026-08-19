import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isNonPublicPath } from "../functions/_middleware.js";

const PUBLIC_OUTPUTS = [
  "content/website-content.snapshot.json",
  "en/platform.html",
  "tr/platform.html",
  "en/integrations.html",
  "tr/entegrasyonlar.html",
  "en/deployment.html",
  "tr/dagitim.html",
  "assets/layout.js",
  "assets/site.js",
  "site/templates/routes/platform.en.html",
  "site/templates/routes/platform.tr.html",
  "site/templates/routes/integrations.en.html",
  "site/templates/routes/integrations.tr.html",
  "site/templates/routes/deployment.en.html",
  "site/templates/routes/deployment.tr.html",
];

const FORBIDDEN_PUBLIC_PATTERNS = [
  [/Jira integrations/gi, "Jira-specific integration wording"],
  [/Jira entegrasyonları/gi, "Jira-specific Turkish integration wording"],
  [/ITSM için belirli bir vendor adı kullanılmaz/gi, "internal ITSM vendor review note"],
  [/Splunk genel inbound kaynak olarak gösterilmez/gi, "internal Splunk review note"],
  [/\bMAS\b/g, "internal deployment component name MAS"],
];

test("publishable content does not contain prohibited internal or stale wording", async () => {
  for (const path of PUBLIC_OUTPUTS) {
    const source = await readFile(path, "utf8");
    for (const [pattern, label] of FORBIDDEN_PUBLIC_PATTERNS) {
      pattern.lastIndex = 0;
      assert.equal(pattern.test(source), false, `${path} contains ${label}`);
    }
  }
});

test("repository-only paths are denied by the Pages middleware", () => {
  const blocked = [
    "/content/website-content.snapshot.json",
    "/content/confluence-pages.json",
    "/archive/monosuite-home-before-connected-intelligence.html",
    "/concepts/primward-connected-intelligence.html",
    "/scripts/build-site-content.mjs",
    "/site/templates/manifest.json",
    "/tests/content-snapshot.test.mjs",
    "/functions/_middleware.js",
    "/README.md",
    "/PACKAGE.JSON",
    "/%63ontent/website-content.snapshot.json",
    "//content//website-content.snapshot.json",
  ];
  for (const path of blocked) {
    assert.equal(isNonPublicPath(path), true, `${path} should be blocked`);
  }

  const allowed = [
    "/",
    "/en/platform",
    "/tr/platform",
    "/assets/site.css",
    "/assets/content-polish.css",
    "/api/leads",
    "/content-polish.css",
  ];
  for (const path of allowed) {
    assert.equal(isNonPublicPath(path), false, `${path} should remain public`);
  }
});
