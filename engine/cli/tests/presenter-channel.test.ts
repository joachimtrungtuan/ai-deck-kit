import assert from "node:assert/strict";
import test from "node:test";
import { createLatestWins, isFresh, isPresenterMessage, nextSeq } from "../../preview-app/src/presenter/presenter-channel.ts";
import { isExportGotoMessage, isExportStateMessage } from "../../preview-app/src/presenter/export-bridge-messages.ts";
import { readResumeIndex, writeResumeIndex } from "../../preview-app/src/presenter/presenter-resume.ts";
import { createCommitEmitter } from "../../preview-app/src/presenter/slide-nav-api.ts";

test("nextSeq stays monotonic when the clock stalls or goes backwards", () => {
  assert.equal(nextSeq(100, 50), 101);
  assert.equal(nextSeq(100, 100), 101);
  assert.equal(nextSeq(100, 500), 500);
});

test("isFresh rejects stale and duplicate sequence numbers", () => {
  assert.equal(isFresh(5, 6), true);
  assert.equal(isFresh(5, 5), false);
  assert.equal(isFresh(5, 3), false);
});

test("isPresenterMessage validates each message shape", () => {
  assert.equal(isPresenterMessage({ kind: "hello" }), true);
  assert.equal(isPresenterMessage({ kind: "goto", index: 2, seq: 1 }), true);
  assert.equal(isPresenterMessage({ kind: "goto", index: "2", seq: 1 }), false);
  assert.equal(isPresenterMessage({ kind: "state", index: 0, seq: 1, total: 3, slides: [] }), true);
  assert.equal(isPresenterMessage({ kind: "screen", mode: "black" }), true);
  assert.equal(isPresenterMessage({ kind: "screen", mode: "red" }), false);
  assert.equal(isPresenterMessage(null), false);
  assert.equal(isPresenterMessage({ kind: "nope" }), false);
});

test("createLatestWins collapses a burst into one apply with the last value", () => {
  const applied: number[] = [];
  let flush: (() => void) | null = null;
  const push = createLatestWins<number>((v) => applied.push(v), (run) => { flush = run; });
  push(1); push(2); push(3);
  assert.deepEqual(applied, []);
  flush!();
  assert.deepEqual(applied, [3]);
  push(4);
  flush!();
  assert.deepEqual(applied, [3, 4]);
});

test("export bridge guards reject foreign origins and bad shapes", () => {
  assert.equal(isExportGotoMessage({ aideck: "goto", index: 1 }, "http://a", "http://a"), true);
  assert.equal(isExportGotoMessage({ aideck: "goto", index: 1 }, "http://evil", "http://a"), false);
  assert.equal(isExportGotoMessage({ aideck: "goto", index: "1" }, "http://a", "http://a"), false);
  assert.equal(isExportGotoMessage(null, "http://a", "http://a"), false);
  assert.equal(isExportStateMessage({ aideck: "state", index: 0, slides: [{ id: "a", type: "T" }] }, "http://a", "http://a"), true);
  assert.equal(isExportStateMessage({ aideck: "state", index: 0 }, "http://a", "http://a"), false);
  assert.equal(isExportStateMessage({ aideck: "state", index: 0, slides: [] }, "http://x", "http://a"), false);
});

test("resume index round-trips and clamps to the current deck size", () => {
  const store = new Map<string, string>();
  const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
  assert.equal(readResumeIndex(storage, "d", 10), 0);
  writeResumeIndex(storage, "d", 7);
  assert.equal(readResumeIndex(storage, "d", 10), 7);
  assert.equal(readResumeIndex(storage, "d", 5), 4);
  assert.equal(readResumeIndex(storage, "other", 10), 0);
  store.set("aideck.present.position--bad", "abc");
  assert.equal(readResumeIndex(storage, "bad", 10), 0);
});

test("commit emitter notifies subscribers until they unsubscribe", () => {
  const emitter = createCommitEmitter();
  const seen: number[] = [];
  const off = emitter.onCommit((i) => seen.push(i));
  emitter.emit(1);
  off();
  emitter.emit(2);
  assert.deepEqual(seen, [1]);
});
