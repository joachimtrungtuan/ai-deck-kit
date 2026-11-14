// An image used by several slides must reach the standalone export once, and the resolver that
// puts it back on each slide must reach every shape of slide prop.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import { collectDeckAssetTable, referencedAssetKeys } from "../../preview-app/deck-asset-table.ts";
import { assetKeysInString, replaceAssetKeys } from "../../preview-app/src/deck-asset-paths.ts";
import { resolveSlideAssets } from "../../preview-app/src/deck-asset-resolver.ts";
import { engineRoot, exportDeck, tableEntryInHtml, workspaceWithDeck, writeSingleSlideDeck } from "./export-deck-fixture.ts";

const table = { "assets/a.png": "data:image/png;base64,AAAA", "assets/b.png": "data:image/png;base64,BBBB" };

test("resolver swaps imageSrc, images[] and nested object references for table entries", () => {
  const props = {
    title: "assets/ folder layout",
    imageSrc: "assets/a.png",
    images: [{ src: "assets/a.png", alt: "one" }, { src: "assets/b.png", alt: "two" }],
    nested: { deeper: { cover: "assets/b.png" } },
  };
  assert.deepEqual(resolveSlideAssets(props, table), {
    title: "assets/ folder layout",
    imageSrc: table["assets/a.png"],
    images: [{ src: table["assets/a.png"], alt: "one" }, { src: table["assets/b.png"], alt: "two" }],
    nested: { deeper: { cover: table["assets/b.png"] } },
  });
});

test("the resolver puts the collected data URI back on every shape of rendered prop", () => {
  const work = mkdtempSync(join(tmpdir(), "aideck-asset-resolve-"));
  after(() => rmSync(work, { recursive: true, force: true }));
  mkdirSync(join(work, "assets"));
  writeFileSync(join(work, "assets", "one.png"), randomBytes(64));
  writeFileSync(join(work, "assets", "two.png"), randomBytes(64));
  const content = [
    "## Slide 01 (slide-01)",
    "```yaml",
    "imageSrc: assets/one.png",
    "images:",
    "  - src: assets/two.png",
    "    alt: assets/ stays prose",
    "cover:",
    "  deeper:",
    "    - assets/one.png",
    "```",
  ].join("\n");
  const collected = collectDeckAssetTable(content, work, new Set());
  assert.deepEqual(Object.keys(collected), ["assets/one.png", "assets/two.png"]);
  for (const uri of Object.values(collected)) assert.match(uri, /^data:image\/png;base64,/);
  const resolved = resolveSlideAssets(
    { imageSrc: "assets/one.png", images: [{ src: "assets/two.png", alt: "assets/ stays prose" }], cover: { deeper: ["assets/one.png"] } },
    collected,
  );
  assert.deepEqual(resolved, {
    imageSrc: collected["assets/one.png"],
    images: [{ src: collected["assets/two.png"], alt: "assets/ stays prose" }],
    cover: { deeper: [collected["assets/one.png"]] },
  });
});

test("resolver rewrites quoted references inside override html and css", () => {
  const override = { html: '<img src="assets/a.png">', css: ".x{background:url('assets/b.png')}" };
  assert.deepEqual(resolveSlideAssets(override, table), {
    html: `<img src="${table["assets/a.png"]}">`,
    css: `.x{background:url('${table["assets/b.png"]}')}`,
  });
});

test("asset paths allow spaces and unquoted CSS url references without treating prose as a path", () => {
  assert.deepEqual(assetKeysInString("assets/my image.png"), ["assets/my image.png"]);
  assert.deepEqual(assetKeysInString(".x{background:url(assets/my image.png)}"), ["assets/my image.png"]);
  assert.deepEqual(assetKeysInString("assets/ is where images live"), []);
  assert.equal(
    replaceAssetKeys(".x{background:url(assets/my image.png)}", (key) => key === "assets/my image.png" ? "DATA" : undefined),
    ".x{background:url(DATA)}",
  );
});

test("a spaced asset and an unquoted CSS URL load in both generated delivery modes", () => {
  const { work, deck } = workspaceWithDeck();
  after(() => rmSync(work, { recursive: true, force: true }));
  const bytes = randomBytes(6000);
  writeFileSync(join(deck, "assets", "my image.png"), bytes);
  writeSingleSlideDeck(
    deck,
    "2.0.0",
    [
      'id: "slide-01"',
      'type: "full-bleed-image"',
      'imageSrc: "assets/my image.png"',
      'override:',
      '  css: ".probe{background:url(assets/my image.png)}"',
    ].join("\n"),
  );

  const single = exportDeck(work, deck, { mode: "single" });
  assert.equal(single.status, 0, single.output);
  const singleHtml = readFileSync(join(single.outDir, "index.html"), "utf8");
  assert.equal(tableEntryInHtml(singleHtml, "assets/my image.png"), `data:image/png;base64,${bytes.toString("base64")}`);

  const web = exportDeck(work, deck, { mode: "web" });
  assert.equal(web.status, 0, web.output);
  assert.deepEqual(readFileSync(join(web.outDir, "assets", "my image.png")), bytes);
  const webHtml = readFileSync(join(web.outDir, "index.html"), "utf8");
  assert.match(webHtml, /["']assets\/my image\.png["']\s*:\s*["']assets\/my%20image\.png["']/);
});

test("resolver leaves unknown keys alone and keeps one stable result per props object", () => {
  const props = { imageSrc: "assets/other.png", caption: "plain" };
  assert.equal(resolveSlideAssets(props, table), props);
  const known = { imageSrc: "assets/a.png" };
  assert.equal(resolveSlideAssets(known, table), resolveSlideAssets(known, table));
  assert.equal(resolveSlideAssets(known, {}), known);
  assert.equal(resolveSlideAssets(undefined, table), undefined);
});

test("only keys a slide renders are collected: the authoring assets list and notes are skipped", () => {
  const content = [
    "## Slide 01 (slide-01)",
    "```yaml",
    'type: "title"',
    'assets: ["assets/listed-only.png"]',
    'imageSrc: "assets/shown.png"',
    "```",
    "## Slide 02: Legacy",
    "```yaml",
    "images:",
    "  - src: assets/shown.png",
    "  - src: assets/second.png",
    "```",
  ].join("\n");
  assert.deepEqual(referencedAssetKeys(content), ["assets/shown.png", "assets/second.png"]);
});

test("a deck referencing one image from many slides embeds it once in the standalone export", () => {
  const { work, deck } = workspaceWithDeck();
  after(() => rmSync(work, { recursive: true, force: true }));
  const shared = randomBytes(6000);
  const unreferenced = randomBytes(6000);
  writeFileSync(join(deck, "assets", "shared-probe.png"), shared);
  writeFileSync(join(deck, "assets", "unreferenced-probe.png"), unreferenced);
  const contentPath = join(deck, "content.md");
  const original = readFileSync(contentPath, "utf8");
  const sharedUses = original.split('"assets/sensor-housing.svg"').length - 1;
  assert.ok(sharedUses >= 2, "fixture slides must reference the shared image more than once");
  writeFileSync(
    contentPath,
    original
      .replaceAll('"assets/sensor-housing.svg"', '"assets/shared-probe.png"')
      .replace('assets: ["assets/station-ridge.svg"]', 'assets: ["assets/station-ridge.svg", "assets/unreferenced-probe.png"]'),
  );

  const result = exportDeck(work, deck);
  assert.equal(result.status, 0, result.output);

  const html = readFileSync(join(result.outDir, "index.html"), "utf8");
  const probe = shared.toString("base64").slice(0, 96);
  assert.equal(html.split(probe).length - 1, 1, "shared image bytes appear exactly once");
  assert.equal(tableEntryInHtml(html, "assets/shared-probe.png"), `data:image/png;base64,${shared.toString("base64")}`, "the built table maps the path to its data URI");
  assert.equal(html.includes(unreferenced.toString("base64").slice(0, 96)), false, "authoring-only asset is not embedded");
});

test("the export build fails on a missing asset path and on a path that leaves assets/", () => {
  const { work, deck } = workspaceWithDeck();
  after(() => rmSync(work, { recursive: true, force: true }));
  const content = readFileSync(join(deck, "content.md"), "utf8");
  for (const [bad, message] of [
    ["assets/not-there.png", /Referenced asset not found: assets\/not-there\.png/],
    ["assets/../../escape.png", /Asset path escapes deck assets\//],
    ["assets/../../../etc/passwd", /Asset path escapes deck assets\//],
  ] as const) {
    writeFileSync(join(deck, "content.md"), content.replace('imageSrc: "assets/station-ridge.svg"', `imageSrc: "${bad}"`));
    const result = exportDeck(work, deck);
    assert.notEqual(result.status, 0);
    assert.match(result.output, message);
  }
});

test("the export build fails on a symlink in assets/ that points outside the deck", () => {
  const { work, deck } = workspaceWithDeck();
  after(() => rmSync(work, { recursive: true, force: true }));
  const secret = join(work, "outside-secret.png");
  writeFileSync(secret, randomBytes(2000));
  symlinkSync(secret, join(deck, "assets", "linked-out.png"));
  const content = readFileSync(join(deck, "content.md"), "utf8");
  writeFileSync(join(deck, "content.md"), content.replace('imageSrc: "assets/station-ridge.svg"', 'imageSrc: "assets/linked-out.png"'));
  const result = exportDeck(work, deck);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Asset path escapes deck assets\/: linked-out\.png/);
});

test("collecting assets follows a symlink that stays inside the deck", () => {
  const work = mkdtempSync(join(tmpdir(), "aideck-asset-link-"));
  after(() => rmSync(work, { recursive: true, force: true }));
  const assets = join(work, "assets");
  cpSync(join(engineRoot, "examples", "showcase.deck", "assets"), assets, { recursive: true });
  symlinkSync(join(assets, "station-ridge.svg"), join(assets, "alias.svg"));
  const content = ["## Slide 01 (slide-01)", "```yaml", 'imageSrc: "assets/alias.svg"', "```"].join("\n");
  assert.deepEqual(Object.keys(collectDeckAssetTable(content, work, new Set())), ["assets/alias.svg"]);
});
