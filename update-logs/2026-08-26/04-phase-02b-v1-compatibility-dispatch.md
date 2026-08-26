# Phase 02b — v1 Compatibility & Schema Dispatch

## What changed

- Restored the v1 manifest parser from `12b01d7` as a frozen module.
- Moved the landed canonical parser to a v2 module and added strict major
  dispatch from `contentSchemaVersion`.
- Made deck creation and all CLI-generated sections inherit the template/deck
  schema, preserving both v1 and v2 starter shapes.
- Updated engine compatibility verification and annotated the deliberate v1
  output of legacy slide-folder migration.
- Rebuilt CLI output and added regression coverage for both scaffold paths,
  outline headings, and malformed schema versions.

## Why

Phase 02's parser rewrite broke existing v1 decks. Phase 02b restores their
behavior without migrating deck content while allowing v2 templates and newly
created decks to use the canonical schema.

## Verification

Typecheck, build, lifecycle, boundary, serve (35/35 with loopback permission),
lint, canonical vivimoon validation, rendered preview proof, and git diff check
passed. No deck bundle changed. Remaining work is Phase 03 onward plus the
explicit Phase 01 documentation follow-up.
