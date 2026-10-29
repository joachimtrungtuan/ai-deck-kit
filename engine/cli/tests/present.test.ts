import assert from "node:assert/strict";
import test from "node:test";
import { isExportStale, parsePresentArgs, presentOpenPath } from "../commands/present.ts";

test("present parses a deck with flags in any order", () => {
  assert.deepEqual(parsePresentArgs(["present", "--export", "demo", "--port", "5200", "--no-open"]), { deck: "demo", export: true, open: false, port: "5200" });
  assert.deepEqual(parsePresentArgs(["demo"]), { deck: "demo", export: false, open: true });
});

test("present rejects missing deck, extra targets and unknown options", () => {
  assert.throws(() => parsePresentArgs(["present"]), /Usage/);
  assert.throws(() => parsePresentArgs(["a", "b"]), /Usage/);
  assert.throws(() => parsePresentArgs(["a", "--nope"]), /Unknown present option/);
  assert.throws(() => parsePresentArgs(["a", "--port"]), /requires a value/);
});

test("the mode is chosen by query parameter on the opened path", () => {
  assert.equal(presentOpenPath(false), "/?present");
  assert.equal(presentOpenPath(true), "/?present&source=export");
});

test("an export is rebuilt only when missing or older than a source", () => {
  assert.equal(isExportStale(null, [1]), true);
  assert.equal(isExportStale(100, [50, 100]), false);
  assert.equal(isExportStale(100, [50, 101]), true);
});
