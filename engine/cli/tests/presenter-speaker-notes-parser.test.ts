// Speaker-notes header parsing and ON-DEMAND stepping. Run: npm test
import assert from "node:assert/strict";
import test from "node:test";
import { nextPresentableIndex, parseSpeakerNotes, parseTargetSeconds } from "../../preview-app/src/presenter/speaker-notes-parser.ts";

test("no notes yields an empty card", () => {
  assert.deepEqual(parseSpeakerNotes(undefined), { body: "", invalid: [] });
  assert.equal(parseSpeakerNotes("   \n").body, "");
});

test("notes without headers stay raw body", () => {
  const notes = parseSpeakerNotes("Say **this**.\n\n<mark>Pause</mark>");
  assert.equal(notes.body, "Say **this**.\n\n<mark>Pause</mark>");
  assert.equal(notes.pacing, undefined);
});

test("headers parse in any order and body keeps the rest", () => {
  const notes = parseSpeakerNotes("Cue: click through\nTarget: 2m30s\nPacing: focus\n\nBody text\nPacing: not a header here");
  assert.equal(notes.pacing, "FOCUS");
  assert.equal(notes.targetSeconds, 150);
  assert.equal(notes.cue, "click through");
  assert.equal(notes.body, "Body text\nPacing: not a header here");
});

test("target forms", () => {
  assert.equal(parseTargetSeconds("90s"), 90);
  assert.equal(parseTargetSeconds("2m"), 120);
  assert.equal(parseTargetSeconds("2m30s"), 150);
  assert.equal(parseTargetSeconds("soon"), undefined);
  assert.equal(parseTargetSeconds(""), undefined);
});

test("bad values are reported, not thrown", () => {
  const notes = parseSpeakerNotes("Pacing: FAST\nTarget: later\nBody");
  assert.deepEqual(notes.invalid, ["Pacing: FAST", "Target: later"]);
  assert.equal(notes.pacing, undefined);
  assert.equal(notes.body, "Body");
});

test("nextPresentableIndex skips ON-DEMAND and stops at the ends", () => {
  const p = [undefined, "ON-DEMAND", "ON-DEMAND", "FOCUS", "ON-DEMAND"] as const;
  assert.equal(nextPresentableIndex(p, 0, 1), 3);
  assert.equal(nextPresentableIndex(p, 3, -1), 0);
  assert.equal(nextPresentableIndex(p, 3, 1), 3);
  assert.equal(nextPresentableIndex(p, 0, -1), 0);
});
