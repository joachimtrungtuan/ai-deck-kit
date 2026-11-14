import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { addExportSecurityMeta, exportFrameBusterScript, hashInlineContent } from "../../skills/presentation-crafting/scripts/export-html-csp-meta.mjs";
import { exportDeck, workspaceWithDeck } from "./export-deck-fixture.ts";

const app = "console.log('app')";
const css = ".deck{color:red}";
const override = ".override { color: blue; }";

async function waitForObservation(read: () => string | null): Promise<string> {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    const value = read();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("Browser fixture did not report child-frame state.");
}

const frameObserver = `!function report(){var root=document.getElementById("root"),loader=document.getElementById("export-loader"),report={refused:document.documentElement.dataset.cspFrameBust||"",loader:loader?getComputedStyle(loader).display:"missing",root:root?getComputedStyle(root).display:"missing",mount:root?root.children.length:-1,ready:document.documentElement.dataset.exportReady||""};window.parent.postMessage({type:"aideck-frame-observation",report:report},"*");if(!report.refused&&!report.ready)setTimeout(report,100)}();`;

function instrumentGeneratedExport(html: string): string {
  const observerHash = `'${hashInlineContent(frameObserver)}'`;
  const policyPattern = /(<meta\s+http-equiv="Content-Security-Policy"\s+content=")([^"]+)/i;
  const withObserverHash = html.replace(policyPattern, (_match, prefix: string, policy: string) => [prefix, policy.replace("script-src ", `script-src ${observerHash} `)].join("") + `"`);
  return withObserverHash.replace("</body>", `<script>${frameObserver}</script></body>`);
}

function frameParentPage(childUrl: string): string {
  return `<!doctype html><html><body><div id="parent-marker">parent</div><iframe src="${childUrl}"></iframe><script>window.addEventListener("message",function(event){if(event.data&&event.data.type==="aideck-frame-observation"){document.documentElement.dataset.frameReport=encodeURIComponent(JSON.stringify(event.data.report));}});</script></body></html>`;
}

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

test("cross-origin iframe buster tolerates browser-blocked top navigation", async (t) => {
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!existsSync(chrome)) {
    t.skip("Chrome is required for the cross-origin iframe regression");
    return;
  }
  let observation: string | null = null;
  const child = createServer((request, response) => {
    if (request.url?.startsWith("/report?")) {
      observation = request.url.slice("/report?".length);
      response.end("ok");
      return;
    }
    response.setHeader("Content-Type", "text/html");
    response.end(`<!doctype html><html><head><style>html[data-csp-frame-bust="refused"] #export-loader,html[data-csp-frame-bust="refused"] #root{display:none}</style></head><body><div id="export-loader">loader</div><div id="root"></div><script>${exportFrameBusterScript}</script><script>const state=new URLSearchParams({refused:document.documentElement.dataset.cspFrameBust||"",loader:getComputedStyle(document.querySelector("#export-loader")).display,root:getComputedStyle(document.querySelector("#root")).display,marker:document.querySelector("#child-marker")?"present":"absent"});fetch("/report?"+state).catch(()=>{});if(document.documentElement.dataset.cspFrameBust!=="refused"){document.body.insertAdjacentHTML("beforeend",'<div id="child-marker">child</div>')}</script></body></html>`);
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
    const dom = await new Promise<string>((resolve, reject) => {
      execFile(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", `--user-data-dir=${work}`, "--dump-dom", `http://127.0.0.1:${parentPort}/parent`], { encoding: "utf8", timeout: 10000, maxBuffer: 2 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Chrome cross-origin regression failed: ${error.message}${stderr ? `\n${stderr}` : ""}`));
          return;
        }
        resolve(stdout);
      });
    });
    // Chromium intentionally blocks a cross-origin iframe's top navigation without user
    // activation; the parent remains usable while the child export refuses to render.
    assert.match(dom, /id="parent-marker"/);
    const report = await waitForObservation(() => observation);
    assert.match(report, /refused=refused/);
    assert.match(report, /loader=none/);
    assert.match(report, /root=none/);
    assert.match(report, /marker=absent/);
  } finally {
    rmSync(work, { recursive: true, force: true });
    child.close();
    parent.close();
  }
});

test("same-origin iframe keeps rendering after the frame-buster check", async (t) => {
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!existsSync(chrome)) {
    t.skip("Chrome is required for the same-origin iframe regression");
    return;
  }
  let observation: string | null = null;
  const server = createServer((request, response) => {
    if (request.url?.startsWith("/report?")) {
      observation = request.url.slice("/report?".length);
      response.end("ok");
      return;
    }
    response.setHeader("Content-Type", "text/html");
    if (request.url === "/parent") {
      response.end(`<!doctype html><html><body><div id="parent-marker">parent</div><iframe src="/child"></iframe></body></html>`);
      return;
    }
    response.end(`<!doctype html><html><body><div id="root"></div><script>${exportFrameBusterScript}</script><script>if(document.documentElement.dataset.cspFrameBust!=="refused"){document.body.insertAdjacentHTML("beforeend",'<div id="child-marker">child</div>')}const state=new URLSearchParams({refused:document.documentElement.dataset.cspFrameBust||"",root:getComputedStyle(document.querySelector("#root")).display,marker:document.querySelector("#child-marker")?"present":"absent"});fetch("/report?"+state).catch(()=>{});</script></body></html>`);
  });
  const listen = () => new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  try {
    await listen();
  } catch (error) {
    server.close();
    if ((error as NodeJS.ErrnoException).code === "EPERM") t.skip("localhost binding is unavailable in this environment");
    else throw error;
    return;
  }
  const work = mkdtempSync(join(tmpdir(), "aideck-same-origin-frame-"));
  try {
    const port = (server.address() as { port: number }).port;
    const dom = await new Promise<string>((resolve, reject) => {
      execFile(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", `--user-data-dir=${work}`, "--dump-dom", `http://127.0.0.1:${port}/parent`], { encoding: "utf8", timeout: 10000, maxBuffer: 2 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) reject(new Error(`Chrome same-origin regression failed: ${error.message}${stderr ? `\n${stderr}` : ""}`));
        else resolve(stdout);
      });
    });
    assert.match(dom, /id="parent-marker"/);
    const report = await waitForObservation(() => observation);
    assert.doesNotMatch(report, /refused=refused/);
    assert.match(report, /root=block/);
    assert.match(report, /marker=present/);
  } finally {
    rmSync(work, { recursive: true, force: true });
    server.close();
  }
});

test("generated export wiring refuses cross-origin frames and renders same-origin frames", { timeout: 120_000 }, async (t) => {
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!existsSync(chrome)) {
    t.skip("Chrome is required for generated export frame wiring");
    return;
  }
  const { work, deck } = workspaceWithDeck();
  try {
    const built = exportDeck(work, deck, { mode: "single" });
    assert.equal(built.status, 0, built.output);
    const generated = instrumentGeneratedExport(readFileSync(join(built.outDir, "index.html"), "utf8"));
    const serve = (html: string) => createServer((request, response) => {
      if (request.url === "/index.html" || request.url === "/") {
        response.setHeader("Content-Type", "text/html");
        response.end(html);
      } else { response.statusCode = 404; response.end(); }
    });
    const listen = (server: ReturnType<typeof createServer>) => new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => resolve());
    });
    const run = async (crossOrigin: boolean): Promise<Record<string, string | number>> => {
      const child = serve(generated);
      const parent = crossOrigin ? serve(frameParentPage("PLACEHOLDER")) : child;
      try {
        await listen(child);
        if (crossOrigin) {
          const childPort = (child.address() as { port: number }).port;
          parent.removeAllListeners("request");
          parent.on("request", (request, response) => {
            if (request.url === "/parent") {
              response.setHeader("Content-Type", "text/html");
              response.end(frameParentPage(`http://127.0.0.1:${childPort}/index.html`));
            } else { response.statusCode = 404; response.end(); }
          });
        } else {
          const childPort = (child.address() as { port: number }).port;
          child.removeAllListeners("request");
          child.on("request", (request, response) => {
            if (request.url === "/parent") {
              response.setHeader("Content-Type", "text/html");
              response.end(frameParentPage(`http://127.0.0.1:${childPort}/index.html`));
            } else if (request.url === "/index.html" || request.url === "/") {
              response.setHeader("Content-Type", "text/html");
              response.end(generated);
            } else { response.statusCode = 404; response.end(); }
          });
        }
        if (crossOrigin) await listen(parent);
        const parentPort = (parent.address() as { port: number }).port;
        const output = await new Promise<string>((resolve, reject) => {
          execFile(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", `--user-data-dir=${mkdtempSync(join(tmpdir(), "aideck-generated-frame-"))}`, "--virtual-time-budget=15000", "--dump-dom", `http://127.0.0.1:${parentPort}/parent`], { encoding: "utf8", timeout: 30_000, maxBuffer: 2 * 1024 * 1024 }, (error, stdout, stderr) => error ? reject(new Error(`${error.message}\n${stderr}`)) : resolve(stdout));
        });
        const encoded = output.match(/data-frame-report="([^"]+)"/)?.[1];
        assert.ok(encoded, `generated frame report missing\n${output.slice(-1000)}`);
        return JSON.parse(decodeURIComponent(encoded)) as Record<string, string | number>;
      } finally { child.close(); if (crossOrigin) parent.close(); }
    };
    const refused = await run(true);
    assert.equal(refused.refused, "refused");
    assert.equal(refused.loader, "none");
    assert.equal(refused.root, "none");
    assert.equal(refused.mount, 0);
    const allowed = await run(false);
    assert.equal(allowed.refused, "");
    assert.equal(allowed.root, "block");
    assert.ok(Number(allowed.mount) > 0);
    assert.equal(allowed.ready, "true");
  } finally { rmSync(work, { recursive: true, force: true }); }
});
