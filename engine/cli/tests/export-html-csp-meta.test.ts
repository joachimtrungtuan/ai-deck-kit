import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { addExportSecurityMeta, exportFrameBusterScript, hashInlineContent } from "../../skills/presentation-crafting/scripts/export-html-csp-meta.mjs";

const app = "console.log('app')";
const css = ".deck{color:red}";
const override = ".override { color: blue; }";

test("security metadata is ordered and hashes exact executable/style content", () => {
  const html = `<html><head>\n<meta charset="UTF-8" />\n<style>${css}</style>\n</head><body><div id="root"></div><script>${app}</script><script type="text/plain" data-slide="1">${JSON.stringify({ override: { css: override } })}</script></body></html>`;
  const secured = addExportSecurityMeta(html, { mode: "single" });
  assert.match(secured, /charset="UTF-8" \/>\n    <meta http-equiv="Content-Security-Policy"/);
  assert.ok(secured.indexOf("http-equiv=\"Content-Security-Policy\"") < secured.indexOf("name=\"referrer\""));
  assert.ok(secured.indexOf("name=\"referrer\"") < secured.indexOf("<script>(function"));
  const policy = secured.match(/content="([^"]+)"/)?.[1] ?? "";
  assert.ok(policy.includes(`script-src '${hashInlineContent(app)}' '${hashInlineContent(exportFrameBusterScript)}'`));
  assert.ok(policy.includes(`style-src '${hashInlineContent(css)}' '${hashInlineContent(override)}'`));
  assert.ok(policy.includes(`'${hashInlineContent(override)}'`));
  assert.doesNotMatch(policy, /unsafe-(?:inline|eval)/);
  assert.doesNotMatch(policy, /(?:frame-ancestors|sandbox|report-uri)/);
  assert.match(policy, /connect-src 'none'/);
});

test("web mode permits same-origin images while single mode does not", () => {
  const html = `<html><head><meta charset="UTF-8"></head><body><script>const deck={override:{css:${JSON.stringify(override)}}};app()</script></body></html>`;
  const single = addExportSecurityMeta(html, { mode: "single" });
  const web = addExportSecurityMeta(html, { mode: "web" });
  assert.match(single, /img-src data:/);
  assert.match(web, /img-src data: 'self'/);
  assert.doesNotMatch(single, /img-src data: 'self'/);
  assert.ok(web.includes(hashInlineContent(override)));
});

test("cross-origin iframe buster navigates the top window in Chrome", async (t) => {
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!existsSync(chrome)) {
    t.skip("Chrome is required for the cross-origin iframe regression");
    return;
  }
  const child = createServer((_request, response) => {
    response.setHeader("Content-Type", "text/html");
    response.end(`<!doctype html><html><body><div id="child-marker">child</div><script>${exportFrameBusterScript}</script></body></html>`);
  });
  const parent = createServer((_request, response) => {
    response.setHeader("Content-Type", "text/html");
    response.end(`<!doctype html><html><body><div id="parent-marker">parent</div><iframe src="http://127.0.0.1:${(child.address() as { port: number }).port}/child"></iframe></body></html>`);
  });
  const listen = (server: ReturnType<typeof createServer>) => new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  try {
    await listen(child);
    await listen(parent);
  } catch (error) {
    child.close(); parent.close();
    if ((error as NodeJS.ErrnoException).code === "EPERM") t.skip("localhost binding is unavailable in this environment");
    else throw error;
    return;
  }
  const work = mkdtempSync(join(tmpdir(), "aideck-frame-buster-"));
  try {
    const parentPort = (parent.address() as { port: number }).port;
    let dom = "";
    try {
      dom = execFileSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", `--user-data-dir=${work}`, "--dump-dom", `http://127.0.0.1:${parentPort}/parent`], { encoding: "utf8", timeout: 10000 });
    } catch (error) {
      t.skip(`Chrome could not run in this environment: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    assert.match(dom, /id="child-marker"/);
    assert.doesNotMatch(dom, /id="parent-marker"/);
  } finally {
    rmSync(work, { recursive: true, force: true });
    child.close();
    parent.close();
  }
});
