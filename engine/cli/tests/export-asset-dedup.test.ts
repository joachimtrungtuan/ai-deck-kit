// An image used by several slides must reach the standalone export once, and the resolver that
// puts it back on each slide must reach every shape of slide prop.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { collectDeckAssetTable, referencedAssetKeys } from "../../preview-app/deck-asset-table.ts";
import { resolveSlideAssets } from "../../preview-app/src/deck-asset-resolver.ts";

const engineRoot = fileURLToPath(new URL("../..", import.meta.url));
const exportScript = join(engineRoot, "skills", "presentation-crafting", "scripts", "export-standalone-html.mjs");

/** The showcase template reaches the engine primitives and dependencies by relative path, so a copy needs both in reach. */
function workspaceWithDeck(): { work: string; deck: string } {
  const work = mkdtempSync(join(tmpdir(), "aideck-asset-dedup-"));
  symlinkSync(join(engineRoot, "node" + "_modules"), join(work, "node" + "_modules"), "dir");
  symlinkSync(join(engineRoot, "primitives"), join(work, "primitives"), "dir");
  const deck = join(work, "dedup.deck");
  cpSync(join(engineRoot, "examples", "showcase.deck"), deck, { recursive: true });
  return { work, deck };
}

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

test("resolver rewrites quoted references inside override html and css", () => {
  const override = { html: '<img src="assets/a.png">', css: ".x{background:url('assets/b.png')}" };
  assert.deepEqual(resolveSlideAssets(override, table), {
    html: `<img src="${table["assets/a.png"]}">`,
    css: `.x{background:url('${table["assets/b.png"]}')}`,
  });
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

  const outDir = join(work, "out");
  const result = spawnSync(process.execPath, [exportScript, "--deck", deck, "--out", outDir], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);

  const html = readFileSync(join(outDir, "index.html"), "utf8");
  const probe = shared.toString("base64").slice(0, 96);
  assert.equal(html.split(probe).length - 1, 1, "shared image bytes appear exactly once");
  assert.equal(html.includes(unreferenced.toString("base64").slice(0, 96)), false, "authoring-only asset is not embedded");
});

test("the export build fails on a missing asset path and on a path that leaves assets/", () => {
  const { work, deck } = workspaceWithDeck();
  after(() => rmSync(work, { recursive: true, force: true }));
  const content = readFileSync(join(deck, "content.md"), "utf8");
  for (const [bad, message] of [
    ["assets/not-there.png", /Referenced asset not found: assets\/not-there\.png/],
    ["assets/../../escape.png", /Asset path escapes deck assets\//],
  ] as const) {
    writeFileSync(join(deck, "content.md"), content.replace('imageSrc: "assets/station-ridge.svg"', `imageSrc: "${bad}"`));
    const result = spawnSync(process.execPath, [exportScript, "--deck", deck, "--out", join(work, "out")], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, message);
  }
});
