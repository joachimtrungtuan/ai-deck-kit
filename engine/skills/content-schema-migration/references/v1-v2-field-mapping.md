# v1 → v2 field mapping

Use the actual v1 parser and the selected template as authorities. Do not
infer a field from its heading when the v2 contract says YAML is authoritative.

| v1 source | v2 destination | Rule |
|---|---|---|
| Heading text after `## Slide NN:` | `title:` only when it is the v1 visible title | V2 headings are structural; quote slides put quote text in YAML `title`. |
| YAML `id`, `type`, `status`, `intent`, `animation` | Same keys | Preserve values; `id` must match `deck.json.slides[].id`. |
| YAML `kicker`, `layoutVariant`, `backgroundVariant`, `highlightPhrase`, `courseName`, `lessonName`, `sectionName` | Same keys | Preserve only keys supported by the target template. |
| YAML `body` or parsed first body line | `description` | V2 does not read an authoring `body` key. Preserve literal `\\n` where used. |
| v1 rendered list props | One `items[]` object array | Trace the v1 parser and template before choosing a source. A legacy deck may contain newer-looking `listItems`/`leftListItems` metadata that v1 never rendered; when the visible cards came from `### On-Slide Text`, migrate those rendered bullets instead. Write each entry in block style, one field per line (never a single-line `{title: ..., description: ...}` flow mapping), and preserve the rendered item count and column split: `items:` then `- title: "..."` / `  description: "..."` / `  icon: "..."` / `  column: "left"`. |
| v1 flat `icons[]` | `items[].icon` | Map by the positional relationship that the v1 parser/template actually rendered. Validate each name with Phosphor, then verify that the target template resolves that exact name to the intended glyph rather than a placeholder. Never invent or silently substitute icons. |
| `images[]`, `tableColumns`, `tableRows`, `chartData`, `regionSeries`, `stats[]` | Same structured keys | Keep array/object shape and ordering. |
| `code`, `language`, `highlightLines` | Same keys | `language` remains documentation metadata. |
| `attribution`, `source`, `caption`, `metric`, `metricLabel`, `index`, `recommendedColumn` | Same keys | Preserve values and numeric types. |
| v1 `blocks[]` and `morph` | Same explicit v2 structures | Preserve IDs, block types, data, and anchors; validate adjacency. |
| v1 `### Speaker Notes` | `### Speaker Notes` | Carry forward unchanged unless approval authorizes copy editing. |
| v1 `### Visual Direction` | `### Design Notes` | Rename the annotation heading; preserve its contents. |
| v1 `### On-Slide Text` | Explicit YAML fields | Remove duplicated prose only after each visible value is represented in v2 YAML. |
| v1 `override` | Same `override` object, including `css`, `html`, `reason` | Preserve active override and reason; reject unsafe `</style>`/`<script` values. |

Manifest invariants: retain `schema`, title, slug, audience, goal, template
set/version, slide type catalog, block catalog, output mode, status, defaults,
slide IDs, slide order, and slide types. Change only
`contentSchemaVersion` to the approved v2 version and any explicitly approved
manifest fields.

Field names are not render evidence. When YAML and `### On-Slide Text` disagree,
the v1 parser plus template determine which value is the baseline. Record that
precedence per affected slide before writing the v2 candidate.
