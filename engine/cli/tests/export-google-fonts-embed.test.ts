import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { embedGoogleFonts, embedGoogleFontsInStyleBlocks } from "../../skills/presentation-crafting/scripts/export-google-fonts-embed.mjs";
import { aideckDeckPlugin } from "../../preview-app/vite-deck-plugin.ts";
import { exportDeck, workspaceWithDeck } from "./export-deck-fixture.ts";

test("Google CSS imports and font bytes become data URLs", async () => {
  const bytes = readFileSync(new URL("./fixtures/font-license/ofl-real.woff2", import.meta.url));
  const fetchImpl = async (input: URL | RequestInfo) => String(input).includes("googleapis")
    ? new Response("@font-face{font-family:X;src:url(https://fonts.gstatic.com/x.woff2)}")
    : new Response(bytes, { headers: { "content-type": "font/woff2" } });
  const result = await embedGoogleFonts('@import"https://fonts.googleapis.com/css2?family=X:wght@0..900;1..900&display=swap";', { fetchImpl });
  assert.match(result.css, /data:font\/woff2;base64,/);
  assert.doesNotMatch(result.css, /fonts\.googleapis|fonts\.gstatic/);
  assert.doesNotMatch(result.css, /@import/);
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

test("production Vite export embeds Google fonts in final index.html", { timeout: 120_000 }, async (t) => {
  try {
    const probe = await fetch("https://fonts.googleapis.com/css2?family=Inter:wght@400");
    if (!probe.ok) throw new Error(`HTTP ${probe.status}`);
  } catch (error) {
    t.skip(`Google Fonts network unavailable; production export not exercised: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  const { work, deck } = workspaceWithDeck();
  try {
    const template = join(deck, "template");
    const designSystem = join(template, "design-system.css");
    const nestedStyles = join(template, "styles");
    mkdirSync(nestedStyles, { recursive: true });
    writeFileSync(join(nestedStyles, "base.css"), '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400");\n.fixture-font { font-family: Inter; }\n');
    writeFileSync(designSystem, `@import "./styles/base.css";\n${readFileSync(designSystem, "utf8")}`);

    const result = exportDeck(work, deck, { mode: "single" });
    assert.equal(result.status, 0, result.output);
    const html = readFileSync(join(result.outDir, "index.html"), "utf8");
    assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
    assert.doesNotMatch(html, /@import[^;]*data:font/);
    assert.match(html, /data:font\/woff2;base64,/);
    assert.match(html, /font-src[^>]*data:/);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test("dollar sequences in fetched font CSS and style blocks survive embedding literally", async () => {
  const bytes = readFileSync(new URL("./fixtures/font-license/ofl-real.woff2", import.meta.url));
  const fetchImpl = async (input: URL | RequestInfo) => String(input).includes("googleapis")
    ? new Response("@font-face{font-family:\"$&$'\";src:url(https://fonts.gstatic.com/x.woff2)}")
    : new Response(bytes, { headers: { "content-type": "font/woff2" } });
  const direct = await embedGoogleFonts('@import url("https://fonts.googleapis.com/css2?family=X");', { fetchImpl });
  assert.match(direct.css, /font-family:"\$&\$'"/);
  const html = '<html><head><style a="1">@import url("https://fonts.googleapis.com/css2?family=X");.p{content:"$1"}</style><style>.q{}</style></head></html>';
  const out = await embedGoogleFontsInStyleBlocks(html, { fetchImpl });
  assert.match(out, /<style a="1">@font-face\{font-family:"\$&\$'";src:url\(data:font\/woff2;base64,/);
  assert.ok(out.includes('.p{content:"$1"}</style><style>.q{}</style>'));
  assert.doesNotMatch(out, /fonts\.googleapis|fonts\.gstatic/);
});

test("validator rejects Google Fonts referenced from override.css", () => {
  const engineDir = fileURLToPath(new URL("../..", import.meta.url));
  const dir = mkdtempSync(join(tmpdir(), "aideck-override-font-"));
  const deckDir = join(dir, "probe.deck");
  cpSync(join(engineDir, "examples/showcase.deck"), deckDir, { recursive: true });
  try {
    const contentPath = join(deckDir, "content.md");
    const original = readFileSync(contentPath, "utf8");
    const line = '  css: "[data-slide-id=\\"slide-29\\"] td { font-variant-numeric: tabular-nums }"';
    assert.ok(original.includes(line), "fixture no longer has the slide-29 override css line");
    writeFileSync(contentPath, original.replace(line, '  css: "@import url(https://fonts.googleapis.com/css2?family=Inter); td { font-family: Inter }"'));
    const result = spawnSync(process.execPath, [join(engineDir, "skills/presentation-crafting/scripts/validate-slide-content.mjs"), deckDir], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(`${result.stdout}${result.stderr}`, /override\.css must not reference Google Fonts/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
