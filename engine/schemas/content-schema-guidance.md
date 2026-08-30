# Content Schema Guidance

Read this before creating, editing, validating, or migrating a template or
`.deck` bundle.

## Stability Contract

- `contentSchemaVersion` selects the content parser and validator by major
  version: `1.x` uses the frozen v1 path; `2.x` uses the canonical v2 path.
- V1 remains supported. Never rewrite or relabel v1 content merely because the
  engine or a template has a newer version.
- `aideck upgrade` replaces the engine only. It must not rewrite project
  templates, deck manifests, content, assets, or embedded template snapshots.
- V1-to-v2 migration is optional, explicit, user-initiated, and performed by
  the `content-schema-migration` skill. A schema number change alone is never a
  migration.

## Version Axes

Keep these independent:

- `deck.json.schema`: manifest format.
- `contentSchemaVersion`: `content.md` field grammar and parser.
- `templateVersion`: visual/component contract frozen into a deck.
- `slideTypeCatalog`: allowed semantic slide types.
- `blockCatalog`: allowed structured block contracts.

The template manifest declares the content shape its React layouts consume.
New decks inherit that value. A deck renders from its embedded `template/`
snapshot, so the deck and snapshot must remain schema-compatible.

## Executable Owners

- Manifest shape: `engine/schemas/deck-manifest.schema.json`
- Runtime dispatch: `engine/preview-app/src/manifest-deck-source.tsx`
- V1 parser: `engine/preview-app/src/content-schema-v1.tsx`
- V2 parser: `engine/preview-app/src/content-schema-v2.tsx`
- Validator dispatch: `engine/skills/presentation-crafting/scripts/validate-slide-content.mjs`
- Template compatibility guard: `engine/cli/lib/deck-template-sync.ts`
- Canonical v2 authoring reference: `docs/deck-format-spec.md`

## Local Guidance

- Read a template's `schema-guidance.md`, manifest, layout contracts, and React
  props before authoring content for it.
- Read a deck's root `schema-guidance.md`, `deck.json`, and embedded template
  manifest before editing the deck.
- If local guidance disagrees with its manifest or executable owners, stop and
  report the mismatch. Never guess which schema to apply.

## `items[]` Formatting

Write every `items[]` entry in YAML block style, one field per line — never a
single-line flow mapping (`{title: "...", description: "..."}`). Block style
keeps each attribute (`title`, `description`, `icon`, `column`) on its own
line so it stays scannable in an IDE:

```yaml
items:
  - title: "Prompt structure"
    description: "..."
    icon: "target"
    column: "left"
```

`validate-slide-content.mjs` flags flow-style `items[]` entries.

## Icon Resolution

V2 icons belong on the object they decorate, such as `items[].icon`. A valid
Phosphor name must also render as that exact glyph. Templates must resolve the
complete supported Phosphor namespace; curated aliases or fallbacks must not
silently replace a valid explicit name with a placeholder or a different icon.
