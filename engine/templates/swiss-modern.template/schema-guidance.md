# Swiss Modern Schema Guidance

This template consumes the content schema declared by
`template-manifest.json`. Treat that manifest as the version authority.

Before authoring or changing a deck:

1. Confirm `contentSchemaVersion`, `slideTypeCatalog`, `blockCatalog`, and
   `templateVersion` in the manifest.
2. Select only a type in `supportedSlideTypes`.
3. Read `layouts/specs/layout-contracts.md` for semantic layout intent.
4. Read the matching component and `layouts/react/shared.tsx` for the exact
   fields consumed. Do not invent aliases or positional mappings.
5. Keep images, icons, tables, and structured items in their declared YAML
   fields. Preserve speaker notes and review annotations in `content.md`.

For v2 content, `title` is YAML-owned and list/card content uses structured
`items[]`, written in block style (one field per line, never a single-line
flow mapping). The engine contract is `engine/schemas/content-schema-guidance.md`.
Use the `content-schema-migration` skill for an explicit v1-to-v2 migration;
never change only the version field or retemplate first.
