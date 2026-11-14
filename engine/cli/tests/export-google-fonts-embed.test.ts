import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { embedGoogleFonts } from "../../skills/presentation-crafting/scripts/export-google-fonts-embed.mjs";

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
