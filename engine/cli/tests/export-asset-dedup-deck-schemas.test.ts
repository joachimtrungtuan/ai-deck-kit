// The export embeds a referenced image once for every content-schema generation, and the asset
// collector neither loses images from a lenient legacy fence nor mistakes prose for a path.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test, { after } from "node:test";
import { referencedAssetKeys } from "../../preview-app/deck-asset-table.ts";
import { exportDeck, tableEntryInHtml, workspaceWithDeck, writeSingleSlideDeck } from "./export-deck-fixture.ts";

/** Builds a one-slide deck around a fresh image and returns the exported page plus the image's base64. */
function exportOneSlide(schemaVersion: string, fence: string): { html: string; base64: string; status: number | null; output: string } {
  const { work, deck } = workspaceWithDeck();
  after(() => rmSync(work, { recursive: true, force: true }));
  const bytes = randomBytes(6000);
  writeFileSync(join(deck, "assets", "probe.png"), bytes);
  writeSingleSlideDeck(deck, schemaVersion, fence);
  const result = exportDeck(work, deck);
  const html = result.status === 0 ? readFileSync(join(result.outDir, "index.html"), "utf8") : "";
  return { html, base64: bytes.toString("base64"), status: result.status, output: result.output };
}

function assertEmbeddedOnce({ html, base64, status, output }: ReturnType<typeof exportOneSlide>): void {
  assert.equal(status, 0, output);
  assert.equal(html.split(base64.slice(0, 96)).length - 1, 1, "image bytes appear exactly once");
  assert.equal(tableEntryInHtml(html, "assets/probe.png"), `data:image/png;base64,${base64}`);
}

test("a v1-schema deck embeds its referenced image once", () => {
  assertEmbeddedOnce(exportOneSlide("1.0.0", ['id: "slide-01"', 'type: "full-bleed-image"', 'imageSrc: "assets/probe.png"'].join("\n")));
});

test("a v2-schema deck embeds its referenced image once", () => {
  const fence = ['id: "slide-01"', 'type: "full-bleed-image"', 'title: "Probe"', 'imageSrc: "assets/probe.png"', 'imageAlt: "probe"'].join("\n");
  assertEmbeddedOnce(exportOneSlide("2.0.0", fence));
});

test("a v1 fence that is not valid YAML still gets its image into the export", () => {
  const fence = ['id: "slide-01"', 'type: "full-bleed-image"', "kicker: one", "kicker: two", 'imageSrc: "assets/probe.png"'].join("\n");
  assertEmbeddedOnce(exportOneSlide("1.0.0", fence));
});

test("invalid-YAML fences keep scanning render keys and skip authoring-only ones", () => {
  const content = [
    "## Slide 01: Legacy",
    "```yaml",
    "kicker: @foo",
    "imageSrc: assets/shown.png",
    "images: [{\"src\": \"assets/second.png\"}]",
    "assets:",
    "  - assets/listed-only.png",
    "```",
  ].join("\n");
  assert.deepEqual(referencedAssetKeys(content), ["assets/shown.png", "assets/second.png"]);
});

test("unquoted prose that starts with assets/ is not treated as an asset path", () => {
  assert.deepEqual(referencedAssetKeys(["## Slide 01: Prose", "```yaml", "body: assets/ is where images live", "note: assets/", "```"].join("\n")), []);
  const fence = ['id: "slide-01"', 'type: "full-bleed-image"', "body: assets/ is where images live", 'imageSrc: "assets/probe.png"'].join("\n");
  const result = exportOneSlide("1.0.0", fence);
  assertEmbeddedOnce(result);
  assert.equal(result.html.includes('"assets/ is where images live"'), false, "the prose is not a table key");
});
