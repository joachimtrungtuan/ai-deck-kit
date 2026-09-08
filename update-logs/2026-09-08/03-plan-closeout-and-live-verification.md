# Plan closeout and live verification of the slide field editor

## What changed

Ran the host-level verification that three plans were still waiting on, then closed every
open plan.

Verification, against a real `aideck serve showcase` on port 5233 (not a fixture):

- GET `/__aideck/slide-yaml` returns the raw fence — `imageSrc: "assets/dashboard-mock.svg"`
  came back un-inlined, confirming the endpoint reads `content.md` and not the asset-inlined
  virtual module.
- One POST carrying a value edit, a key rename, a key removal, an added key, a sequence
  reorder and an added sequence item returned 200. All six landed; `diff` against the pre-save
  copy showed 13 changed lines, every one inside that slide's fence. A comment above `title`,
  the blank line, and every quote style survived.
- The panel rendered exactly the slide's key set including two keys invented at test time,
  badging both as not read by the renderer; `items` and `tableRows` expanded recursively
  (35 nested rows on the `spec-table` slide).
- A deck downgraded to `contentSchemaVersion: "1.0.0"` produced the disabled panel and its
  note with zero key inputs.

Plans closed: the slide field editor plan (both phases), the kit reliability plan and the
motion unification plan (both had all phases complete but stale `in-progress` frontmatter),
and the `linear-dark` build brief, which had no status line at all.

## Why

The field editor plan's remaining criteria were all "prove it against a running server", and
the sandbox `EPERM` that had blocked that turned out not to apply on this host. The other
plans were finished work that only looked open.

## Follow-ups

- Saving re-serializes the whole fence, so an untouched scalar longer than the serializer's
  default line width gets re-wrapped — `imageAlt` folded onto two lines without being edited.
  Cosmetic, round-trips identically, but it rewrites authored formatting.
  Fixed the same day; see `04-preserve-authored-line-wrapping-on-save.md`.
- `ValueInput` chooses `<input>` vs `<textarea>` from the live value on every render, so
  deleting the last newline mid-edit swaps the DOM node and drops focus.
- No component-level tests for the five React/hook files added by this work.
