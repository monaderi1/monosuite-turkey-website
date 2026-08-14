import assert from "node:assert/strict";
import test from "node:test";
import { extractRoutePage, extractSharedPage } from "../scripts/lib/adf-content.mjs";

const paragraph = text => ({ type: "paragraph", content: [{ type: "text", text }] });
const cell = (text, header = false) => ({
  type: header ? "tableHeader" : "tableCell",
  content: [paragraph(text)]
});
const table = rows => ({
  type: "table",
  content: rows.map((row, rowIndex) => ({
    type: "tableRow",
    content: row.map(value => cell(value, rowIndex === 0))
  }))
});
const status = value => ({
  type: "blockquote",
  content: [{
    type: "paragraph",
    content: [
      { type: "text", text: "Status:" },
      { type: "text", text: ` ${value}` }
    ]
  }]
});

test("extractRoutePage reads metadata and bilingual content IDs", () => {
  const page = {
    id: "10",
    title: "Website Content — Test",
    version: { number: 3 },
    body: {
      type: "doc",
      content: [
        status("Implemented baseline — pending first reconciliation"),
        table([
          ["Field", "English", "Turkish", "Current implementation"],
          ["Route", "/en/test", "/tr/test", "Routing / repository"],
          ["Meta title", "Test", "Deneme", "Route HTML"],
          ["Meta description", "English description", "Türkçe açıklama", "Route HTML"]
        ]),
        table([
          ["Content ID", "Location / role", "English", "Turkish", "Current implementation"],
          ["TEST.H1.01", "Section 01 · H1", "English heading", "Türkçe başlık", "Route HTML"]
        ])
      ]
    }
  };

  const result = extractRoutePage(page);
  assert.deepEqual(result.route, { en: "/en/test", tr: "/tr/test" });
  assert.equal(result.sourcePage.version, 3);
  assert.equal(result.content["TEST.H1.01"].tr, "Türkçe başlık");
  assert.equal(result.content["TEST.H1.01"].status, "Implemented baseline — pending first reconciliation");
});

test("extractSharedPage excludes non-approved middleware strings", () => {
  const page = {
    id: "20",
    title: "Cyobik Website Shared Content",
    version: { number: 2 },
    body: {
      type: "doc",
      content: [
        status("Implemented baseline — pending first reconciliation"),
        table([
          ["Content ID", "Element", "English", "Turkish", "Status"],
          ["SHARED.NAV.DEMO", "Primary CTA", "Request a demo", "Demo Talep Edin", "Implemented baseline"]
        ]),
        table([
          ["Content ID", "English implementation string", "Turkish", "Status"],
          ["SHARED.MW.CLOSE", "Close", "Missing", "Not approved / localisation required"]
        ])
      ]
    }
  };

  const result = extractSharedPage(page);
  assert.equal(result.content["SHARED.NAV.DEMO"].tr, "Demo Talep Edin");
  assert.equal(result.excluded.length, 1);
  assert.equal(result.excluded[0].contentId, "SHARED.MW.CLOSE");
});
