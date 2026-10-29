import assert from "node:assert/strict";
import test from "node:test";
import { stripSpeakerNotes } from "../../preview-app/strip-speaker-notes.ts";

const content = [
  "## Slide 1",
  "### Content",
  "Visible body",
  "### Speaker Notes (90s)",
  "SECRET-NOTE line one",
  "SECRET-NOTE line two",
  "### Review",
  "Reviewer remark",
  "## Slide 2",
  "### Speaker Notes",
  "SECRET-NOTE tail",
].join("\n");

test("speaker notes sections are removed up to the next heading", () => {
  const out = stripSpeakerNotes(content);
  assert.doesNotMatch(out, /SECRET-NOTE|Speaker Notes/);
  assert.match(out, /Visible body/);
  assert.match(out, /### Review\nReviewer remark/);
  assert.match(out, /## Slide 2/);
});

test("content without notes is unchanged", () => {
  assert.equal(stripSpeakerNotes("## A\n### Content\nbody\n"), "## A\n### Content\nbody\n");
});

test("deeper headings and rules inside notes are removed with the rest of the notes", () => {
  const out = stripSpeakerNotes(
    ["## Slide 1", "### Speaker Notes", "SECRET-A", "#### Aside", "SECRET-B", "###### Deep", "SECRET-C", "### Review", "kept"].join("\n"),
  );
  assert.doesNotMatch(out, /SECRET|Aside|Deep/);
  assert.match(out, /### Review\nkept/);
});
