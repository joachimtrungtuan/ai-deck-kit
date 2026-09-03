// Phase 4 (Diagram IR v1) tests: schema validator, renderer contract, CSS scoping,
// and the deck-validator diagram-override guards. Run: npm run test:diagram
// The mjs scripts are exercised as CLIs (repo convention: skill scripts are never
// imported by the TS build), through the shipped worked-example IR.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, globSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const projectRoot = fileURLToPath(new URL("../../..", import.meta.url));
const engineDir = path.join(projectRoot, "engine");
const scriptDir = path.join(engineDir, "skills/presentation-crafting/scripts");
// Both shipped templates cap their layout at z-index 1; the override overlay must sit above it.
const TEMPLATE_CONTENT_MAX_Z = 1;
const showcaseIrPath = path.join(engineDir, "examples/showcase.deck/assets/diagrams/station-network.json");
const showcaseIr = JSON.parse(readFileSync(showcaseIrPath, "utf8"));

function validateIrText(ir: unknown): string {
  const dir = mkdtempSync(path.join(tmpdir(), "aideck-ir-"));
  try {
    const file = path.join(dir, "probe.json");
    writeFileSync(file, JSON.stringify(ir, null, 2));
    const result = spawnSync(process.execPath, [path.join(scriptDir, "validate-diagram-ir.mjs"), file], { encoding: "utf8" });
    return `${result.stdout}${result.stderr}`;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function renderIntoScratch(ir: unknown, name: string, animation: string): { snippet: string; dir: string; status: number; output: string } {
  const dir = mkdtempSync(path.join(tmpdir(), "aideck-ir-render-"));
  mkdirSync(path.join(dir, "probe.deck", "assets/diagrams"), { recursive: true });
  const irPath = path.join(dir, "probe.deck", "assets/diagrams", `${name}.json`);
  writeFileSync(irPath, JSON.stringify(ir, null, 2));
  const result = spawnSync(process.execPath, [path.join(scriptDir, "render-diagram.mjs"), "--ir", irPath, "--animation", animation], { encoding: "utf8" });
  return { snippet: result.stdout ?? "", dir, status: result.status ?? 1, output: `${result.stdout}${result.stderr}` };
}

function validIr(overrides: Record<string, unknown> = {}): any {
  return { ...structuredClone(showcaseIr), ...overrides };
}

test("IR validator: the shipped worked example is valid", () => {
  const output = validateIrText(showcaseIr);
  assert.match(output, /✓/);
  assert.ok(!output.includes("✗"), output);
});

test("IR validator: structural errors are reported", () => {
  const output = validateIrText(validIr({ extraTopLevel: true }));
  assert.match(output, /unknown property "extraTopLevel"/);
});

test("IR validator: enums, constants, and patterns", () => {
  assert.match(validateIrText(validIr({ irVersion: 2 })), /constant 1/);
  const wrongKind = validIr();
  wrongKind.nodes[0].kind = "blockchain";
  assert.match(validateIrText(wrongKind), /"blockchain" is not one of/);
  const badId = validIr();
  badId.nodes[0].id = "1-station";
  assert.match(validateIrText(badId), /does not match pattern/);
});

test("IR validator: semantic cross-references", () => {
  const dangling = validIr();
  dangling.edges[0].to = "ghost";
  assert.match(validateIrText(dangling), /does not name a node/);

  const selfEdge = validIr();
  selfEdge.edges[0].to = selfEdge.edges[0].from;
  assert.match(validateIrText(selfEdge), /self-edge/);

  const wrapGhost = validIr();
  wrapGhost.groups[0].wraps = ["nowhere"];
  assert.match(validateIrText(wrapGhost), /groups\[0\]\.wraps\[0\]: "nowhere"/);

  const dupCell = validIr();
  dupCell.nodes[1].col = dupCell.nodes[0].col;
  dupCell.nodes[1].row = dupCell.nodes[0].row;
  assert.match(validateIrText(dupCell), /already occupied/);

  const outOfGrid = validIr();
  outOfGrid.layout = { mode: "grid", cols: 2 };
  assert.match(validateIrText(outOfGrid), /exceeds layout\.cols/);
});

test("renderer: deterministic, scoped, primitive-anim only", () => {
  const first = renderIntoScratch(showcaseIr, "station-network", "gentle-rise");
  const second = renderIntoScratch(showcaseIr, "station-network", "gentle-rise");
  try {
    assert.equal(first.status, 0, first.output);
    assert.equal(first.snippet, second.snippet);

    const animations = [...first.snippet.matchAll(/primitive-anim-[a-z-]+/g)].map((m) => m[0]);
    assert.ok(animations.length > 0);
    assert.ok(animations.every((name) => name.startsWith("primitive-anim-")));
    assert.ok(!/ld-anim|swiss-anim/.test(first.snippet), "no template-prefixed class may leak into generated output");
    assert.ok(!first.snippet.includes("primitive-anim-morph"));

    const parsed = parseYaml(first.snippet);
    assert.equal(parsed.override.layout, "none");
    assert.equal(parsed.override.animation, "none");
    assert.match(parsed.override.reason, /assets\/diagrams\/station-network\.json/);
    assert.match(parsed.override.css, /Generated by render-diagram\.mjs from assets\/diagrams\/station-network\.json/);

    const scopeMatch = parsed.override.css.match(/\.(aideck-diagram--station-network-[0-9a-f]{8}) \{/);
    assert.ok(scopeMatch, "root scoped rule present");
    for (const line of parsed.override.css.split("\n")) {
      if (!line.trim() || line.trim().startsWith("/*")) continue;
      assert.ok(line.includes(scopeMatch![1]), `unscoped generated selector: ${line}`);
    }
    assert.ok(parsed.override.html.includes(`class="aideck-diagram ${scopeMatch![1]}"`));
  } finally {
    rmSync(first.dir, { recursive: true, force: true });
    rmSync(second.dir, { recursive: true, force: true });
  }
});

test("renderer: refuses morph and unknown animations", () => {
  const morph = renderIntoScratch(showcaseIr, "station-network", "morph");
  const unknown = renderIntoScratch(showcaseIr, "station-network", "backflip");
  try {
    assert.notEqual(morph.status, 0);
    assert.match(morph.output, /morph is not supported/);
    assert.notEqual(unknown.status, 0);
    assert.match(unknown.output, /not in the element animation catalog/);
  } finally {
    rmSync(morph.dir, { recursive: true, force: true });
    rmSync(unknown.dir, { recursive: true, force: true });
  }
});

test("renderer: invalid IR produces no output", () => {
  const broken = validIr();
  broken.edges[0].to = "ghost";
  const run = renderIntoScratch(broken, "broken", "gentle-rise");
  try {
    assert.notEqual(run.status, 0);
    assert.match(run.output, /IR is not valid/);
    assert.equal(run.snippet, "");
  } finally {
    rmSync(run.dir, { recursive: true, force: true });
  }
});

test("renderer: two diagrams in one deck keep disjoint scopes", () => {
  const second = validIr();
  second.nodes = second.nodes.map((node: any) => ({ ...node, label: `${node.label} B` }));
  const a = renderIntoScratch(showcaseIr, "alpha", "gentle-rise");
  const b = renderIntoScratch(second, "beta", "staggered-list");
  try {
    assert.equal(a.status, 0, a.output);
    assert.equal(b.status, 0, b.output);
    const scopeA = a.snippet.match(/aideck-diagram--alpha-[0-9a-f]{8}/)![0];
    const scopeB = b.snippet.match(/aideck-diagram--beta-[0-9a-f]{8}/)![0];
    assert.ok(!b.snippet.includes(scopeA), "diagram B must not carry diagram A's scope");
    assert.ok(!a.snippet.includes(scopeB), "diagram A must not carry diagram B's scope");
    const idsA = new Set([...a.snippet.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
    const idsB = new Set([...b.snippet.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
    assert.ok(idsA.size > 0 && idsB.size > 0);
    for (const id of idsA) assert.ok(!idsB.has(id), `element id "${id}" collides across diagrams`);
  } finally {
    rmSync(a.dir, { recursive: true, force: true });
    rmSync(b.dir, { recursive: true, force: true });
  }
});

function copyShowcaseDeck() {
  const dir = mkdtempSync(path.join(tmpdir(), "aideck-diagram-deck-"));
  const deckDir = path.join(dir, "probe.deck");
  cpSync(path.join(engineDir, "examples/showcase.deck"), deckDir, { recursive: true });
  return { dir, deckDir };
}

function validateDeck(deckDir: string) {
  const result = spawnSync(process.execPath, [path.join(scriptDir, "validate-slide-content.mjs"), deckDir], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

// Diagram slides depend on the override overlay painting ON TOP of the recorded layout, or the
// template content shows through the rendered diagram. That invariant has three separable parts,
// asserted here against source rather than a rendered DOM (these tests run under node --test with
// no renderer). Each assertion is order-independent so formatting changes cannot break it.
test("override overlay: layer is absolutely positioned and stacked above content", () => {
  const source = readFileSync(path.join(engineDir, "preview-app/src/slide-override-layer.tsx"), "utf8");
  const overlayStyle = source.match(/className="aideck-override-overlay"[\s\S]*?style=\{\{([^}]*)\}\}/);
  assert.ok(overlayStyle, "overlay div must carry an inline style object");
  assert.match(overlayStyle[1], /position:\s*"absolute"/);
  assert.match(overlayStyle[1], /inset:\s*0/);
  assert.match(overlayStyle[1], /pointerEvents:\s*"none"/);
  const zIndex = overlayStyle[1].match(/zIndex:\s*(\d+)/);
  assert.ok(zIndex, "overlay must set an explicit zIndex");
  assert.ok(Number(zIndex[1]) > TEMPLATE_CONTENT_MAX_Z, `overlay zIndex ${zIndex[1]} must exceed template content`);
});

test("override overlay: every render site emits the layer after the slide component", () => {
  for (const site of ["preview-app/src/fixed-slide-canvas.tsx", "preview-app/src/deck-export.tsx"]) {
    const source = readFileSync(path.join(engineDir, site), "utf8");
    const component = source.indexOf("<slide.Component");
    const layer = source.indexOf("<SlideOverrideLayer");
    assert.ok(component !== -1, `${site} must render <slide.Component`);
    assert.ok(layer !== -1, `${site} must render <SlideOverrideLayer`);
    assert.ok(layer > component, `${site} must emit the override layer after the slide component`);
  }
});

test("override overlay: shipped templates keep content at or below the assumed z-index cap", () => {
  const files = globSync("templates/*.template/**/*.{css,tsx}", { cwd: engineDir })
    .map((rel) => path.join(engineDir, rel));
  assert.ok(files.length > 0, "expected shipped template sources");
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const [, value] of source.matchAll(/z-?[iI]ndex:\s*(-?\d+)/g)) {
      assert.ok(
        Number(value) <= TEMPLATE_CONTENT_MAX_Z,
        `${path.relative(engineDir, file)} declares z-index ${value}, above the cap the override overlay assumes`,
      );
    }
  }
});

test("deck validator: generated diagram override passes on a clean bundle", () => {
  const { dir, deckDir } = copyShowcaseDeck();
  try {
    const { status, output } = validateDeck(deckDir);
    assert.equal(status, 0, output);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("deck validator: stale IR after render fails", () => {
  const { dir, deckDir } = copyShowcaseDeck();
  try {
    const irPath = path.join(deckDir, "assets/diagrams/station-network.json");
    const tampered = JSON.parse(readFileSync(irPath, "utf8"));
    tampered.meta.subtitle = "edited after the render";
    writeFileSync(irPath, JSON.stringify(tampered, null, 2) + "\n");
    const { status, output } = validateDeck(deckDir);
    assert.equal(status, 1);
    assert.match(output, /changed .* after render/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// The override-shape guards must not hide behind the IR-exists branch: a deck that both lost its
// IR and carries a bad override has to report the bad override too, not just the missing file.
test("deck validator: override-shape guards still fire when the IR is missing", () => {
  const { dir, deckDir } = copyShowcaseDeck();
  try {
    rmSync(path.join(deckDir, "assets/diagrams/station-network.json"));
    const contentPath = path.join(deckDir, "content.md");
    const content = readFileSync(contentPath, "utf8");
    const edited = content.replace('  layout: "none"\n  animation: "none"', '  layout: "split"\n  animation: "fade"');
    assert.notEqual(edited, content, "layout/animation replacement targeted nothing");
    writeFileSync(contentPath, edited);
    const { status, output } = validateDeck(deckDir);
    assert.equal(status, 1);
    assert.match(output, /missing from the deck bundle/);
    assert.match(output, /must set override\.layout and override\.animation to "none"/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("deck validator: traversing IR path is rejected, not followed", () => {
  const { dir, deckDir } = copyShowcaseDeck();
  try {
    // A marker that satisfies a naive startsWith("assets/diagrams/") test but escapes the bundle.
    writeFileSync(path.join(dir, "outside.json"), JSON.stringify(showcaseIr, null, 2) + "\n");
    const contentPath = path.join(deckDir, "content.md");
    const content = readFileSync(contentPath, "utf8");
    const edited = content.replace(
      /(Generated by render-diagram\.mjs from )\S+\.json \(diagram IR v1, content ([0-9a-f]{8})\)/,
      "$1assets/diagrams/../../outside.json (diagram IR v1, content $2)",
    );
    assert.notEqual(edited, content, "marker replacement targeted nothing");
    writeFileSync(contentPath, edited);
    const { status, output } = validateDeck(deckDir);
    assert.equal(status, 1);
    assert.match(output, /outside assets\/diagrams\//);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("deck validator: hand-tampered override marker fails", () => {
  const { dir, deckDir } = copyShowcaseDeck();
  try {
    const contentPath = path.join(deckDir, "content.md");
    const content = readFileSync(contentPath, "utf8");
    const edited = content.replace(
      /(Generated by render-diagram\.mjs from )\S+\.json \(diagram IR v1, content ([0-9a-f]{8})\)/,
      "$1assets/diagrams/nonexistent.json (diagram IR v1, content $2)",
    );
    assert.notEqual(edited, content, "marker replacement targeted nothing");
    writeFileSync(contentPath, edited);
    const { status, output } = validateDeck(deckDir);
    assert.equal(status, 1);
    assert.match(output, /missing from the deck bundle/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
