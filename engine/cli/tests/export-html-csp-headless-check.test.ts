import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { addExportSecurityMeta } from "../../skills/presentation-crafting/scripts/export-html-csp-meta.mjs";
import { chromeDumpIsJudgeable, runHtmlCspHeadlessCheck } from "../../skills/presentation-crafting/scripts/export-html-csp-headless-check.mjs";

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

function fakeChrome(root: string, dom: string, exitCode: number): string {
  const domPath = join(root, "dom.html");
  writeFileSync(domPath, dom);
  const script = join(root, "fake-chrome.sh");
  writeFileSync(script, `#!/bin/sh\necho "Trying to load the allocator multiple times." >&2\ncat '${domPath}'\nexit ${exitCode}\n`, { mode: 0o755 });
  return script;
}

test("a non-zero Chrome exit after a complete recorder DOM is judged on the DOM", () => {
  const { root, path } = fixture("<!doctype html><html><body>ok</body></html>");
  try {
    const clean = fakeChrome(root, '<html data-csp-check="ran" data-export-ready="true"><body>ok</body></html>', 1);
    assert.equal(runHtmlCspHeadlessCheck({ htmlPath: path, chrome: clean }).skipped, false);
    const violations = encodeURIComponent(JSON.stringify([{ directive: "style-src-elem", blockedURI: "inline" }]));
    const dirty = fakeChrome(root, `<html data-csp-check="ran" data-csp-violations="${violations}"><body>x</body></html>`, 1);
    assert.throws(() => runHtmlCspHeadlessCheck({ htmlPath: path, chrome: dirty }), /style-src-elem blocked inline/);
    const noRecorder = fakeChrome(root, "<html><body>crashed</body></html>", 1);
    assert.throws(() => runHtmlCspHeadlessCheck({ htmlPath: path, chrome: noRecorder }), /Chrome CSP check failed/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("a timed-out Chrome run is judged only when it dumped the finished recorder page", () => {
  const timeout = Object.assign(new Error("spawnSync chrome ETIMEDOUT"), { code: "ETIMEDOUT" });
  const finished = '<html data-csp-check="ran" data-export-ready="true"><body>ok</body></html>';
  assert.equal(chromeDumpIsJudgeable({ error: timeout, status: null, stdout: finished }), true);
  assert.equal(chromeDumpIsJudgeable({ error: timeout, status: null, stdout: '<html data-csp-check="ran"><body>loading</body></html>' }), false);
  assert.equal(chromeDumpIsJudgeable({ error: timeout, status: null, stdout: "" }), false);
  const missing = Object.assign(new Error("spawnSync chrome ENOENT"), { code: "ENOENT" });
  assert.equal(chromeDumpIsJudgeable({ error: missing, status: null, stdout: finished }), false);
  assert.equal(chromeDumpIsJudgeable({ status: 0, stdout: "" }), true);
  assert.equal(chromeDumpIsJudgeable({ status: 1, stdout: "<html><body>crashed</body></html>" }), false);
});

test("a DOM dump larger than a pipe buffer is still judged", () => {
  const { root, path } = fixture("<!doctype html><html><body>ok</body></html>");
  try {
    const embedded = "A".repeat(40 * 1024 * 1024);
    const big = fakeChrome(root, `<html data-csp-check="ran" data-export-ready="true"><body><img src="data:image/png;base64,${embedded}"></body></html>`, 0);
    assert.equal(runHtmlCspHeadlessCheck({ htmlPath: path, chrome: big }).skipped, false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
