# Swiss Modern Layout Contracts

Use these contracts when mapping canonical slide content to React components.

## Global Rules

- Use the 12-column frame on desktop and 6-column frame on narrow viewports.
- Keep the grid mostly invisible. Use alignment, spacing, rules, and type scale to reveal structure.
- Do not use technical grid textures, plus signs, or intersection markers in this template.
- Do not use a colored accent palette. Emphasis comes from scale, weight, spacing, grayscale imagery, and rule placement.
- Align all rules, panels, media fields, headings, metadata rows, and list text starts to column boundaries. Do not place elements at arbitrary offsets.
- Use deliberate empty gutters between major fields when text or imagery could collide.
- Use sharp corners only.
- Prefer measured Inter typography, JetBrains Mono metadata, thin rules, grayscale imagery, and asymmetric whitespace over decorative cards.
- Keep visible copy short. Move nuance to speaker notes.
- Every slide must include a small metadata cue, index, or structural label unless the content is full-bleed image.

## Foundation

| Type | Layout |
| --- | --- |
| `title` | Kicker top-left, oversized title spanning columns 1-10, support text under title, metadata row at lower right. |
| `section-divider` | Large section number low-left, strong title right, thin top rule. |
| `closing` | Final statement left, next action or discussion prompt right, heavy top rule. |
| `agenda` | Title top-left, numbered agenda list across lower grid, small timing notes optional. |

## Text-Led

| Type | Layout |
| --- | --- |
| `text-statement` | Single strong statement, short support paragraph, optional source marker. |
| `text-list` | 3-5 rows divided by rules; no bullet glyphs. |
| `two-column-text` | Two equal columns with contrast labels; use rule divider. |
| `quote` | Quote large but controlled, attribution in mono, rule only if it clarifies hierarchy. |
| `numbered-framework` | Numbered steps in grid rows, number column locked. |

## Visual-Led

| Type | Layout |
| --- | --- |
| `full-bleed-image` | Grayscale image covers slide, title in flat editorial field, minimal metadata. |
| `image-text-split` | Image 7 columns, text 5 columns, align baselines. |
| `image-grid` | 2-6 image cells with strict grid and captions. |
| `icon-grid` | 4-8 semantic cells, one icon family and one weight. Use icons only when they add meaning. |
| `diagram` | Diagram area centered on grid, labels outside the diagram path. |

## Data And Evidence

| Type | Layout |
| --- | --- |
| `metric-highlight` | One primary metric huge, supporting metrics in rule-separated row. |
| `chart` | Chart area dominant, title and reading instruction in side rail. |
| `evidence-stack` | Source-backed evidence rows, each with claim, support, and source label. |
| `case-study` | Context/action/result as three vertical blocks plus proof metric. |

## Product Or Workflow

| Type | Layout |
| --- | --- |
| `process-flow` | Linear path across grid with numbered nodes and connecting rules. |
| `before-after` | Two opposing panels with a central transformation marker. |
| `ui-showcase` | Interface screenshot dominant, callouts in side rail. |
| `timeline` | Horizontal time axis with milestone blocks aligned to grid. |

## Technical

| Type | Layout |
| --- | --- |
| `code-snippet` | Editorial explanation rail left; restrained mono code panel right. Limit code to ~14 lines and highlight only the key line. |
| `terminal-output` | Header over a single terminal transcript panel; distinguish prompt, command, and output through mono weight and grayscale, never syntax colors. |
| `architecture-overview` | Title rail plus central diagram field. Custom diagram markup uses `children`; the structured item list remains the fallback. |
| `data-flow` | Numbered from-to rows on horizontal rules. Keep each request or handoff to one concise label. |
| `api-endpoint` | Method label and path in the header, then paired request and response mono panels. |
| `spec-table` | A sharp, rule-separated matrix, capped at 5 columns × 6 rows. Mono uppercase headers. |
| `comparison-table` | Same matrix; the recommended column receives a solid ink field rather than a color accent. |
| `decision-record` | Context, decision, and consequences in three aligned panels; emphasis comes from the decision panel's heavy rule. |
