// tableColumnWidths and tocTitle guards. The parser passes both through without checking shape, so
// the validator is the only place a width list that disagrees with tableColumns, or an empty slide
// list label, is caught. Run: npm test
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { tableColumnWidthPercentages } from "../../primitives/blocks/table-column-widths.ts";

const projectRoot = fileURLToPath(new URL("../../..", import.meta.url));
const engineDir = path.join(projectRoot, "engine");
const validator = path.join(engineDir, "skills/presentation-crafting/scripts/validate-slide-content.mjs");
// The showcase spec-table slide has five columns.
const SPEC_TABLE_COLUMNS = 'tableColumns: ["ID", "Requirement", "Priority", "Verified by", "Status"]';

function validateWithSpecTableExtra(extra: string) {
  const dir = mkdtempSync(path.join(tmpdir(), "aideck-table-widths-"));
  const deckDir = path.join(dir, "probe.deck");
  cpSync(path.join(engineDir, "examples/showcase.deck"), deckDir, { recursive: true });
  try {
    const contentPath = path.join(deckDir, "content.md");
    const original = readFileSync(contentPath, "utf8");
    assert.ok(original.includes(SPEC_TABLE_COLUMNS), "fixture no longer has the spec-table columns line");
    writeFileSync(contentPath, original.replace(SPEC_TABLE_COLUMNS, `${SPEC_TABLE_COLUMNS}\n${extra}`));
    const result = spawnSync(process.execPath, [validator, deckDir], { cwd: projectRoot, encoding: "utf8" });
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("tableColumnWidths: fractions with one entry per column pass", () => {
  const { status, output } = validateWithSpecTableExtra("tableColumnWidths: [1, 4, 1, 2, 1]");
  assert.equal(status, 0, output);
});

test("tableColumnWidths: percentages summing to 100 pass", () => {
  const { status, output } = validateWithSpecTableExtra('tableColumnWidths: ["10%", "45%", "15%", "20%", "10%"]');
  assert.equal(status, 0, output);
});

test("tableColumnWidths: a count that differs from tableColumns is rejected", () => {
  const { status, output } = validateWithSpecTableExtra("tableColumnWidths: [2, 1, 1]");
  assert.equal(status, 1);
  assert.match(output, /"tableColumnWidths" has 3 entries but "tableColumns" has 5/);
});

test("tableColumnWidths: percentages that do not sum to 100 are rejected", () => {
  const { status, output } = validateWithSpecTableExtra('tableColumnWidths: ["10%", "40%", "15%", "20%", "10%"]');
  assert.equal(status, 1);
  assert.match(output, /percentages sum to 95%/);
});

test("tableColumnWidths: mixed fractions and percentages are rejected", () => {
  const { status, output } = validateWithSpecTableExtra('tableColumnWidths: [1, "40%", 1, 1, 1]');
  assert.equal(status, 1);
  assert.match(output, /do not mix them/);
});

test("tocTitle: a non-empty string passes and an empty one is rejected", () => {
  assert.equal(validateWithSpecTableExtra('tocTitle: "Joining spec"').status, 0);
  const { status, output } = validateWithSpecTableExtra('tocTitle: ""');
  assert.equal(status, 1);
  assert.match(output, /"tocTitle" must be a non-empty string/);
});

test("tableColumnWidthPercentages normalizes fractions over the visible columns", () => {
  assert.deepEqual(tableColumnWidthPercentages([2, 1, 1], 3), ["50%", "25%", "25%"]);
  assert.deepEqual(tableColumnWidthPercentages([1, 1, 2], 2), ["50%", "50%"]);
  assert.deepEqual(tableColumnWidthPercentages(["60%", " 40 % "], 2), ["60%", "40%"]);
  assert.equal(tableColumnWidthPercentages([1, "40%"], 2), undefined);
  assert.equal(tableColumnWidthPercentages([1], 2), undefined);
  assert.equal(tableColumnWidthPercentages(undefined, 2), undefined);
});
