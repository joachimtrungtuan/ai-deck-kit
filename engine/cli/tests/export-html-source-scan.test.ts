import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { scanExternalSources } from "../../skills/presentation-crafting/scripts/export-html-source-scan.mjs";

test("source scan emits exact origins and ignores SVG namespace/internal fragments", () => {
  const root = mkdtempSync(join(tmpdir(), "aideck-scan-"));
  const template = join(root, "template"); mkdirSync(template);
  writeFileSync(join(template, "design-system.css"), '@import url("https://cdn.example.com:8443/fonts.css"); .x{background:url(#paint)}');
  writeFileSync(join(template, "asset.svg"), '<svg xmlns="http://www.w3.org/2000/svg"><use href="#paint"/></svg>');
  const result = scanExternalSources({ deckRoot: root, templateRoot: template });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.allowances.map(({ directive, origin }) => ({ directive, origin })), [{ directive: "style-src", origin: "https://cdn.example.com:8443" }]);
  rmSync(root, { recursive: true, force: true });
});

test("source scan rejects HTTP and never emits wildcard origins", () => {
  const root = mkdtempSync(join(tmpdir(), "aideck-scan-"));
  writeFileSync(join(root, "design-system.css"), 'a{background:url("http://cdn.example.com/x.png")}');
  const result = scanExternalSources({ deckRoot: root });
  assert.match(result.errors.join("\n"), /HTTP external source/);
  assert.equal(result.allowances.some(({ origin }) => origin.includes("*")), false);
  rmSync(root, { recursive: true, force: true });
});
