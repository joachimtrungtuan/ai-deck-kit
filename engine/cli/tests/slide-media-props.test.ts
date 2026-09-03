// chartData/images shape guards. The preview runtime checks only Array-ness (content-schema-v2's
// arrayMeta), so these props reach the shipped templates as data and a wrong element shape renders
// as a NaN-height bar or a broken image rather than failing the deck. Run: npm test
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../../..", import.meta.url));
const engineDir = path.join(projectRoot, "engine");
const validator = path.join(engineDir, "skills/presentation-crafting/scripts/validate-slide-content.mjs");
const CHART_LINE = /^chartData: .*$/m;

// Rewrites the fixture's chartData/images, then validates. Returns exit status + combined output.
function validateWithEdit(edit: (content: string) => string) {
  const dir = mkdtempSync(path.join(tmpdir(), "aideck-media-"));
  const deckDir = path.join(dir, "probe.deck");
  cpSync(path.join(engineDir, "examples/showcase.deck"), deckDir, { recursive: true });
  try {
    const contentPath = path.join(deckDir, "content.md");
    const original = readFileSync(contentPath, "utf8");
    const edited = edit(original);
    assert.notEqual(edited, original, "edit targeted nothing in the fixture");
    writeFileSync(contentPath, edited);
    const result = spawnSync(process.execPath, [validator, deckDir], { cwd: projectRoot, encoding: "utf8" });
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const setChart = (value: string) => (content: string) => content.replace(CHART_LINE, `chartData: ${value}`);

test("media props: the shipped fixture passes unedited", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "aideck-media-"));
  const deckDir = path.join(dir, "probe.deck");
  cpSync(path.join(engineDir, "examples/showcase.deck"), deckDir, { recursive: true });
  try {
    const result = spawnSync(process.execPath, [validator, deckDir], { cwd: projectRoot, encoding: "utf8" });
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("media props: a quoted chart value is rejected", () => {
  // The common authoring slip: "112" divides into NaN and the bar silently vanishes.
  const { status, output } = validateWithEdit(setChart('[{"label": "Nov", "value": "112"}]'));
  assert.equal(status, 1);
  assert.match(output, /chartData\[0\]\.value must be a finite number/);
});

test("media props: duplicate chart labels are rejected", () => {
  const { status, output } = validateWithEdit(setChart('[{"label": "Q1", "value": 1}, {"label": "Q1", "value": 2}]'));
  assert.equal(status, 1);
  assert.match(output, /chartData\[1\]\.label "Q1" is duplicated/);
});

test("media props: a non-object chart entry is rejected", () => {
  const { status, output } = validateWithEdit(setChart('["oops"]'));
  assert.equal(status, 1);
  assert.match(output, /chartData\[0\] must be an object/);
});

test("media props: an empty chart series is rejected", () => {
  const { status, output } = validateWithEdit(setChart("[]"));
  assert.equal(status, 1);
  assert.match(output, /chartData is empty/);
});

test("media props: an image src missing from the bundle is rejected", () => {
  const { status, output } = validateWithEdit((content) =>
    content.replace('src: "assets/capture-rain-gauge.svg"', 'src: "assets/typo-missing.svg"'),
  );
  assert.equal(status, 1);
  assert.match(output, /does not exist in the deck bundle/);
});

test("media props: an image src escaping the bundle is rejected", () => {
  const { status, output } = validateWithEdit((content) =>
    content.replace('src: "assets/solar-array.svg"', 'src: "../../../etc/hosts"'),
  );
  assert.equal(status, 1);
  assert.match(output, /points outside the deck bundle/);
});

test("media props: a missing alt warns without failing the deck", () => {
  const { status, output } = validateWithEdit((content) =>
    content.replace('    alt: "Louvered radiation shield on its mount"\n', ""),
  );
  assert.equal(status, 0, output);
  assert.match(output, /has no alt text/);
});

// imageSrc is the scalar counterpart of images[].src and reaches <img src> the same way, so it
// carries the same guard. Remote srcs warn rather than fail — see docs/deck-format-spec.md.
test("media props: an imageSrc missing from the bundle is rejected", () => {
  const { status, output } = validateWithEdit((content) =>
    content.replace('imageSrc: "assets/station-ridge.svg"', 'imageSrc: "assets/typo-gone.svg"'),
  );
  assert.equal(status, 1);
  assert.match(output, /imageSrc "assets\/typo-gone\.svg" does not exist in the deck bundle/);
});

test("media props: an absolute imageSrc is rejected", () => {
  const { status, output } = validateWithEdit((content) =>
    content.replace('imageSrc: "assets/station-ridge.svg"', 'imageSrc: "/etc/hosts"'),
  );
  assert.equal(status, 1);
  assert.match(output, /imageSrc "\/etc\/hosts" is an absolute path/);
});

test("media props: a remote src warns but does not fail the deck", () => {
  const { status, output } = validateWithEdit((content) =>
    content.replace('imageSrc: "assets/station-ridge.svg"', 'imageSrc: "https://example.com/remote.png"'),
  );
  assert.equal(status, 0, output);
  assert.match(output, /is remote — it will not render in an offline or exported deck/);
});

test("media props: imageAlt without an imageSrc is rejected", () => {
  const { status, output } = validateWithEdit((content) =>
    content.replace('imageSrc: "assets/station-ridge.svg"\n', ""),
  );
  assert.equal(status, 1);
  assert.match(output, /imageAlt is set without an imageSrc/);
});
