import assert from "node:assert/strict";
import test from "node:test";
import { exportDrift } from "../../preview-app/src/presenter/notes-export-drift.ts";

const slide = (id: string, type = "title", tocTitle = id) => ({ id, tocTitle, type });

test("identical slide lists report no drift", () => {
  assert.deepEqual(exportDrift([slide("a"), slide("b")], [slide("a"), slide("b")]), []);
});

test("a changed title, type or id is named by position", () => {
  const drift = exportDrift([slide("a"), slide("b", "quote")], [slide("a"), slide("b", "title")]);
  assert.equal(drift.length, 1);
  assert.match(drift[0], /Slide 2 differs/);
});

test("a different slide count is reported", () => {
  assert.match(exportDrift([slide("a")], [slide("a"), slide("b")])[0], /count differs/);
});

test("the report is capped at the limit", () => {
  const live = Array.from({ length: 10 }, (_, i) => slide(`l${i}`));
  const old = Array.from({ length: 10 }, (_, i) => slide(`o${i}`));
  assert.equal(exportDrift(live, old).length, 3);
});
