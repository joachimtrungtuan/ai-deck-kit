// A linked asset keeps its raw file name on disk, but the page must reference it by a URL that survives
// `#`, `%` and `?` in that name. Single mode still embeds the same bytes.
import assert from "node:assert/strict";
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test, { after } from "node:test";
import { collectDeckAssetTable } from "../../preview-app/deck-asset-table.ts";
import { exportDeck, tableEntryInHtml, workspaceWithDeck } from "./export-deck-fixture.ts";

test("linked delivery encodes each path segment and leaves the slash alone", () => {
  const work = workspaceWithDeck();
  after(() => rmSync(work.work, { recursive: true, force: true }));
  copyFileSync(join(work.deck, "assets", "sensor-housing.svg"), join(work.deck, "assets", "a#b?.svg"));
  copyFileSync(join(work.deck, "assets", "sensor-housing.svg"), join(work.deck, "assets", "50%.svg"));
  const content = ["## Slide 01 (slide-01)", "```yaml", 'imageSrc: "assets/a#b?.svg"', 'cover: "assets/50%.svg"', "```"].join("\n");
  assert.deepEqual(collectDeckAssetTable(content, work.deck, new Set(), "linked"), {
    "assets/a#b?.svg": "assets/a%23b%3F.svg",
    "assets/50%.svg": "assets/50%25.svg",
  });
});

test("web export writes files under their raw names and links them by encoded URL; single still embeds them", () => {
  const { work, deck } = workspaceWithDeck();
  after(() => rmSync(work, { recursive: true, force: true }));
  copyFileSync(join(deck, "assets", "sensor-housing.svg"), join(deck, "assets", "a#b.svg"));
  copyFileSync(join(deck, "assets", "station-ridge.svg"), join(deck, "assets", "50%.svg"));
  const contentPath = join(deck, "content.md");
  writeFileSync(
    contentPath,
    readFileSync(contentPath, "utf8")
      .replaceAll('"assets/sensor-housing.svg"', '"assets/a#b.svg"')
      .replace('imageSrc: "assets/station-ridge.svg"', 'imageSrc: "assets/50%.svg"'),
  );

  const web = exportDeck(work, deck, { mode: "web" });
  assert.equal(web.status, 0, web.output);
  assert.deepEqual(readFileSync(join(web.outDir, "assets", "a#b.svg")), readFileSync(join(deck, "assets", "a#b.svg")), "emitted under the raw name");
  assert.deepEqual(readFileSync(join(web.outDir, "assets", "50%.svg")), readFileSync(join(deck, "assets", "50%.svg")));
  assert.equal(existsSync(join(web.outDir, "assets", "a%23b.svg")), false, "the encoded form is only the URL, never a file name");
  const webHtml = readFileSync(join(web.outDir, "index.html"), "utf8");
  assert.match(webHtml, /["']assets\/a#b\.svg["']\s*:\s*["']assets\/a%23b\.svg["']/);
  assert.match(webHtml, /["']assets\/50%\.svg["']\s*:\s*["']assets\/50%25\.svg["']/);

  const single = exportDeck(work, deck, { mode: "single" });
  assert.equal(single.status, 0, single.output);
  const singleHtml = readFileSync(join(single.outDir, "index.html"), "utf8");
  for (const key of ["assets/a#b.svg", "assets/50%.svg"]) {
    const expected = `data:image/svg+xml;base64,${readFileSync(join(deck, key)).toString("base64")}`;
    assert.equal(tableEntryInHtml(singleHtml, key), expected, `${key} is embedded under its raw key`);
  }
  assert.equal(existsSync(join(single.outDir, "assets")), false, "single writes no asset files");
});
