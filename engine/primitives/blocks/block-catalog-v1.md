# Block Catalog v1

`blockCatalog: "v1"` is the fixed shared vocabulary beneath template layouts. Blocks use the TypeScript contracts in `contracts.ts`; templates supply all visual tokens and composition.

| Type | Contract | Required data | Notes |
| --- | --- | --- | --- |
| `text` | `TextBlockData` | `text` | Free-form prose. |
| `title-description` | `TitleDescriptionBlockData` | `title` | `description` optional. |
| `image` | `ImageBlockData` | `src`, `alt` | Local asset path preferred. |
| `chart` | `ChartBlockData` | `kind: "bar"`, `series[]` | Structured, morph-capable. |
| `table` | `TableBlockData` | `columns[]`, `rows[][]` | Structured data table. |
| `icon-text-card` | `IconTextCardBlockData` | `icon`, `title`, `description` | Icon is a template-resolved name. |
| `quote` | `QuoteBlockData` | `quote` | `attribution` optional. |
| `stat` | `StatBlockData` | `value`, `label` | Structured, morph-capable. |
| `list` | `ListBlockData` | `items[]` | `ordered` optional. |
| `code` | `CodeBlockData` | `code` | `language`, `caption` optional. |

Every block has `id`, optional `animation` (`none`, `fade`, `gentle-rise`, `morph`), and optional `morph`. A morph anchor must match the same anchor on an adjacent slide.
