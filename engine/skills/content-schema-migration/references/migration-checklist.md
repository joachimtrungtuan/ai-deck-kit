# Migration evidence checklist

Record this checklist for one deck. It is evidence, not permission to replace
the source.

## Before editing

- [ ] User explicitly requested v1 → v2 migration.
- [ ] Exact deck path and embedded template identified.
- [ ] Source declares v1 or documented legacy default.
- [ ] Working copy/backup includes `deck.json`, `content.md`, `assets/`, and `template/`.
- [ ] V1 validator passes.
- [ ] Template can consume v2 fields and declared variants.
- [ ] For every conflicting legacy field, the value actually rendered by the v1 parser/template is recorded as the baseline.

## Candidate

- [ ] Every `deck.json.slides[]` ID has one v2 section; no extras.
- [ ] IDs, order, types, visible copy, assets, images, icons, and annotations preserved.
- [ ] `title` is in YAML; `description` replaces authoring `body`.
- [ ] Items use one object array; two-column items use `column`.
- [ ] Structured data, blocks, morph anchors, overrides, and icon names validate.
- [ ] Every declared icon name renders as its intended glyph in the target template; no unknown-name placeholder or semantic substitution is accepted as fidelity.
- [ ] `contentSchemaVersion` is a valid `2.x.y`; template identity remains aligned.
- [ ] V2 validator passes.

## Review and approval

- [ ] Candidate rendered in the shared preview runtime.
- [ ] Every slide compared against the v1 render or equivalent baseline.
- [ ] Differences listed with intentional vs accidental classification.
- [ ] User explicitly approved canonical replacement.
- [ ] Canonical replacement revalidated; v1 backup retained indefinitely.

If any unchecked item is unavailable, report it as unresolved and do not claim
the migration is complete.
