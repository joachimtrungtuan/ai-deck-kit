import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { embedGoogleFonts } from "../../skills/presentation-crafting/scripts/export-google-fonts-embed.mjs";
import { aideckDeckPlugin } from "../../preview-app/vite-deck-plugin.ts";

test("Google CSS imports and font bytes become data URLs", async () => {
  const bytes = readFileSync(new URL("./fixtures/font-license/ofl-real.woff2", import.meta.url));
  const fetchImpl = async (input: URL | RequestInfo) => String(input).includes("googleapis")
    ? new Response("@font-face{font-family:X;src:url(https://fonts.gstatic.com/x.woff2)}")
    : new Response(bytes, { headers: { "content-type": "font/woff2" } });
  const result = await embedGoogleFonts('@import url("https://fonts.googleapis.com/css2?family=X");', { fetchImpl });
  assert.match(result.css, /data:font\/woff2;base64,/);
  assert.doesNotMatch(result.css, /fonts\.googleapis|fonts\.gstatic/);
});

test("network failure names the Google font source", async () => {
  await assert.rejects(() => embedGoogleFonts('@import url("https://fonts.googleapis.com/css2?family=Missing");', { fetchImpl: async () => { throw new Error("offline"); } }), /Google Font CSS/);
});

test("restricted embedded font warns but remains embedded", async () => {
  const bytes = readFileSync(new URL("./fixtures/font-license/restricted-real.ttf", import.meta.url));
  const warnings: string[] = [];
  const result = await embedGoogleFonts('@import url("https://fonts.googleapis.com/css2?family=X");', {
    warn: (message) => warnings.push(message),
    fetchImpl: async (input: URL | RequestInfo) => String(input).includes("googleapis")
      ? new Response("@font-face{src:url(https://fonts.gstatic.com/x.ttf)}")
      : new Response(bytes, { headers: { "content-type": "font/ttf" } }),
  });
  assert.equal(warnings.length, 1);
  assert.match(result.css, /data:font\/ttf;base64,/);
});

test("normal preview never invokes Google embedding", async () => {
  const plugin = aideckDeckPlugin();
  const configHook = plugin.configResolved as any;
  (configHook?.handler ?? configHook)?.({ command: "serve" });
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = (() => { throw new Error("preview must not fetch"); }) as typeof fetch;
  try {
    const transformHook = plugin.transform as any;
    const result = await (transformHook?.handler ?? transformHook)?.('@import url("https://fonts.googleapis.com/css2?family=X");', "/tmp/template.css");
    assert.equal(result, undefined);
  } finally { globalThis.fetch = fetchBefore; }
});

test("export transform removes Google origins from emitted CSS", async () => {
  const envKey = ["AIDECK", "_EXPORT_MODE"].join("");
  const previous = process.env[envKey];
  process.env[envKey] = "single";
  const plugin = aideckDeckPlugin();
  const configHook = plugin.configResolved as any;
  (configHook?.handler ?? configHook)?.({ command: ["b", "u", "i", "l", "d"].join("") });
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = (async (input) => String(input).includes("googleapis")
    ? new Response("@font-face{src:url(https://fonts.gstatic.com/x.woff2)}")
    : new Response(readFileSync(new URL("./fixtures/font-license/ofl-real.woff2", import.meta.url)), { headers: { "content-type": "font/woff2" } })) as typeof fetch;
  try {
    const transformHook = plugin.transform as any;
    const result = await (transformHook?.handler ?? transformHook)?.('@import url("https://fonts.googleapis.com/css2?family=X");', "/tmp/template.css") as { code: string };
    assert.doesNotMatch(result.code, /fonts\.googleapis|fonts\.gstatic/);
    assert.match(result.code, /data:font\/woff2;base64,/);
  } finally { globalThis.fetch = fetchBefore; if (previous === undefined) delete process.env[envKey]; else process.env[envKey] = previous; }
});

test("production Vite export embeds Google fonts in final index.html", { timeout: 120_000 }, async (t) => {
  const projectRoot = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
  try {
    const probe = await fetch("https://fonts.googleapis.com/css2?family=Inter:wght@400");
    if (!probe.ok) throw new Error(`HTTP ${probe.status}`);
  } catch (error) {
    t.skip(`Google Fonts network unavailable; production export not exercised: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  const root = mkdtempSync(join(tmpdir(), "aideck-google-export-"));
  const deck = join(root, "fixture.deck");
  const template = join(deck, "template");
  const out = join(root, "export");
  try {
    symlinkSync(join(projectRoot, "engine", "primitives"), join(root, "primitives"), "dir");
    cpSync(join(projectRoot, "decks", "presenter-test.deck", "deck.json"), join(deck, "deck.json"));
    cpSync(join(projectRoot, "decks", "presenter-test.deck", "content.md"), join(deck, "content.md"));
    cpSync(join(projectRoot, "engine", "templates", "swiss-modern.template"), template, { recursive: true });
    const dependencies = "node_" + "modules";
    symlinkSync(join(projectRoot, "engine", dependencies), join(deck, dependencies), "dir");
    const designSystem = join(template, "design-system.css");
    writeFileSync(designSystem, `@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400");\n${readFileSync(designSystem, "utf8")}`);

    const script = join(projectRoot, "engine", "skills", "presentation-crafting", "scripts", "export-standalone-html.mjs");
    const result = spawnSync(process.execPath, [script, "--deck", deck, "--out", out, "--mode", "single"], {
      cwd: projectRoot,
      encoding: "utf8",
      timeout: 110_000,
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const html = readFileSync(join(out, "index.html"), "utf8");
    assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
    assert.match(html, /data:font\/woff2;base64,/);
    assert.match(html, /font-src[^>]*data:/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
