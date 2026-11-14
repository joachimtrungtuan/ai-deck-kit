import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { addExportSecurityMeta } from "../../skills/presentation-crafting/scripts/export-html-csp-meta.mjs";
import { runHtmlCspHeadlessCheck } from "../../skills/presentation-crafting/scripts/export-html-csp-headless-check.mjs";

const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const hasChrome = existsSync(chrome);

function fixture(html: string): { root: string; path: string } {
  const root = mkdtempSync(join(tmpdir(), "aideck-csp-fixture-"));
  const path = join(root, "index.html");
  writeFileSync(path, html);
  return { root, path };
}

test("headless CSP check passes normal and print pages for a clean secured document", { skip: !hasChrome }, () => {
  const { root, path } = fixture(addExportSecurityMeta('<!doctype html><html><head><meta charset="utf-8"><style>body{color:red}</style></head><body>ok</body></html>'));
  try { assert.equal(runHtmlCspHeadlessCheck({ htmlPath: path, chrome }).skipped, false); } finally { rmSync(root, { recursive: true, force: true }); }
});

test("headless CSP check names an injected unhashed style", { skip: !hasChrome }, () => {
  const secured = addExportSecurityMeta('<!doctype html><html><head><meta charset="utf-8"><style>body{color:red}</style></head><body>ok</body></html>');
  const { root, path } = fixture(secured.replace("</head>", "<style>.injected{color:blue}</style></head>"));
  try { assert.throws(() => runHtmlCspHeadlessCheck({ htmlPath: path, chrome }), /style-src-elem.*blocked inline/); } finally { rmSync(root, { recursive: true, force: true }); }
});

test("missing recorder fails closed", { skip: !hasChrome }, () => {
  const { root, path } = fixture('<!doctype html><html><head></head><body>no recorder</body></html>');
  try { assert.throws(() => runHtmlCspHeadlessCheck({ htmlPath: path, chrome }), /recorder did not run/); } finally { rmSync(root, { recursive: true, force: true }); }
});

test("missing Chrome skips once and runtime failures are not treated as missing", () => {
  const { root, path } = fixture('<!doctype html><html><head></head><body>no recorder</body></html>');
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (message: string) => warnings.push(message);
  try {
    assert.equal(runHtmlCspHeadlessCheck({ htmlPath: path, chrome: "/nonexistent/chrome" }).skipped, true);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /CSP check skipped/);
    if (hasChrome) assert.throws(() => runHtmlCspHeadlessCheck({ htmlPath: path, chrome: "/usr/bin/false" }), /Chrome CSP check failed/);
  } finally { console.warn = originalWarn; rmSync(root, { recursive: true, force: true }); }
});
