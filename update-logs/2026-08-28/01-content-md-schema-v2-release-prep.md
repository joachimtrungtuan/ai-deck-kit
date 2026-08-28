# Content Schema v2 release preparation

## What changed

- Finished the Phase 1 documentation amendments and normalized Phase 3's plan
  frontmatter to `status: completed`.
- Confirmed Phases 1, 2, 2b, and 3 have no unchecked work remaining.
- Marked the deliberately out-of-scope downstream `clarity-courseware` item in
  Phase 4 as not applicable to this repository.
- Completed local Phase 7 release preparation: version `0.4.0`, v2 shipped
  template metadata, compatibility documentation, rebuilt CLI dist, and
  package dry-run.

## Why

Keep the active plan's status aligned with the implemented dual-schema scope:
existing v1 decks remain frozen, while new shipped-template decks use v2.

## Follow-ups

Phase 7 remains in progress only for the external gate: commit the generated
dist and release changes, publish the version, then prove a clean install
scaffolds a v2 deck. No commit, tag, push, or deployment was performed.
