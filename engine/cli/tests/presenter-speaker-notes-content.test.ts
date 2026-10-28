// Speaker notes reach PreviewSlide.speakerNotes through the one section splitter, and the validator
// warns (never errors) on bad header values. Run: npm test
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

const projectRoot = fileURLToPath(new URL("../../..", import.meta.url));
const engineDir = path.join(projectRoot, "engine");
const validator = path.join(engineDir, "skills/presentation-crafting/scripts/validate-slide-content.mjs");
const require = createRequire(import.meta.url);

test("parser exposes raw speaker notes per slide and stops at the next heading", () => {
  const outputDir = mkdtempSync(path.join(tmpdir(), "aideck-notes-parser-"));
  const bundlePath = path.join(outputDir, "content-schema-v2.cjs");
  try {
    buildSync({
      entryPoints: [path.join(engineDir, "preview-app/src/content-schema-v2.tsx")],
      bundle: true, format: "cjs", outfile: bundlePath, platform: "node",
    });
    const { createManifestDeckSourceV2 } = require(bundlePath) as typeof import("../../preview-app/src/content-schema-v2.tsx");
    const source = createManifestDeckSourceV2(
      { title: "T", slug: "t", template: { set: "swiss-modern" }, slides: [{ id: "a", type: "terminal-output" }, { id: "b", type: "terminal-output" }] },
      "## Slide 01\n\n```yaml\nid: a\n```\n\n### Speaker Notes\n\nPacing: BRIEF\n\nSay it.\n\n### Design Notes\n\nnot notes\n\n## Slide 02\n\n```yaml\nid: b\n```\n\n### Visual Direction\n\nx\n",
      "deck",
      { "terminal-output": () => null },
    );
    assert.equal(source.slides[0].speakerNotes, "Pacing: BRIEF\n\nSay it.");
    assert.equal(source.slides[1].speakerNotes, undefined);
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
});

function validateWithNotes(notes: string) {
  const dir = mkdtempSync(path.join(tmpdir(), "aideck-notes-validate-"));
  const deckDir = path.join(dir, "probe.deck");
  cpSync(path.join(engineDir, "examples/showcase.deck"), deckDir, { recursive: true });
  try {
    const contentPath = path.join(deckDir, "content.md");
    const original = readFileSync(contentPath, "utf8");
    writeFileSync(contentPath, original.replace("### Speaker Notes\n", `### Speaker Notes\n\n${notes}\n`));
    const result = spawnSync(process.execPath, [validator, deckDir], { cwd: projectRoot, encoding: "utf8" });
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("valid presenter headers pass without warnings", () => {
  const { status, output } = validateWithNotes("Pacing: ON-DEMAND\nTarget: 2m30s\nCue: pause");
  assert.equal(status, 0, output);
  assert.ok(!output.includes("speaker notes"), output);
});

test("unknown Pacing and unparseable Target warn but do not fail", () => {
  const { status, output } = validateWithNotes("Pacing: FAST\nTarget: soon");
  assert.equal(status, 0, output);
  assert.match(output, /Pacing: FAST/);
  assert.match(output, /Target: soon/);
});
