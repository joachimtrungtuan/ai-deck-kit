import assert from "node:assert/strict";
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
