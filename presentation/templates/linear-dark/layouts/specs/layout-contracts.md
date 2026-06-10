# Linear Dark Layout Contracts

Use these contracts when mapping canonical slide content to React components. Linear Dark implements the **v2** slide-type catalog (v1 inherited + Technical category).

## Global Rules

- Use the 12-column frame on desktop and 6-column frame on narrow viewports.
- Keep the grid mostly invisible. Structure comes from panels, hairline rules, spacing, and type scale.
- Dark canvas (`--ld-surface`) with one subtle top-center radial glow per slide. Do not add other large gradients.
- Emphasis comes from **one** indigo accent (`--ld-accent`) used sparingly: kicker text/dot, one emphasized word or metric, process/flow node markers, glows. Never as a large fill.
- Surfaces are **panels**: hairline border (`--ld-line`), faint fill (`--ld-panel`), rounded `--ld-radius`, optional top-edge sheen. Linear leans on panels more than swiss leans on rules.
- Headlines use gradient text (`.ld-title`); metrics use gradient text + faint accent glow (`.ld-metric`).
- Rounded corners only (`--ld-radius`, `--ld-radius-sm`). No sharp-cornered tiles.
- Typography: Inter (display + body), JetBrains Mono (kickers, indices, code, labels). Max weight 700, used only for one emphasized word/metric. Display headings weight 600, letter-spacing -0.02em.
- Keep visible copy short. Move nuance to speaker notes.
- Every slide carries a small kicker, index, or structural label unless it is a full-bleed image.

## Foundation

| Type | Layout |
| --- | --- |
| `title` | Kicker (with accent dot) top-left, oversized gradient title columns 1-7, support text under, metadata row upper right. Glow strongest here. |
| `section-divider` | Oversized mono section number low-left, section title right, thin accent progress bar (line-draw). |
| `closing` | Final statement left, next-action list in a panel right. |
| `agenda` | Title top-left, numbered list across lower grid, mono accent indices. |

## Text-Led

| Type | Layout |
| --- | --- |
| `text-statement` | Single strong gradient statement, short support paragraph, optional source marker. |
| `text-list` | Heading left, hairline-separated rows right; no bullet glyphs, mono accent index. |
| `two-column-text` | Header band, then two equal panels with contrast labels. |
| `quote` | Large gradient quote with faint oversized quotation glyph in panel tone; attribution in mono. |
| `numbered-framework` | Heading column left, numbered list right, number column locked. |

## Visual-Led

| Type | Layout |
| --- | --- |
| `full-bleed-image` | Image covers slide in rounded hairline frame with bottom scrim; title + kicker lower-left over scrim. |
| `image-text-split` | Image 7 columns, text 5 columns, align baselines. |
| `image-grid` | 2-6 image cells in rounded frames with captions. |
| `icon-grid` | 2-6 panel tiles, each a rounded icon tile (accent icon) + label. One icon family, weight regular. |
| `diagram` | Diagram area centered in a panel, labels outside the diagram path (line-draw). |

## Data And Evidence

| Type | Layout |
| --- | --- |
| `metric-highlight` | One huge gradient metric with accent glow (spotlight pulse), supporting list right. |
| `chart` | Chart area dominant in a panel, title and reading instruction in side rail. |
| `evidence-stack` | Heading left, source-backed evidence rows right. |
| `case-study` | Context / Action / Result as three panels under a header. |

## Product Or Workflow

| Type | Layout |
| --- | --- |
| `process-flow` | Numbered panels connected by accent arrows across the lower grid. |
| `before-after` | Two opposing panels (After gets accent border) with a central accent arrow. |
| `ui-showcase` | Screenshot panel with window-chrome bar (three muted dots), callouts in side rail. |
| `timeline` | Horizontal axis of accent node dots connected by hairline rules, milestone labels below. |

## Technical (v2)

| Type | Layout |
| --- | --- |
| `code-snippet` | Explanation rail columns 1-5, code in a window-chrome panel columns 6-12. Mono, line numbers in `--ld-soft`, max ~14 lines. Highlighted lines get `--ld-code-highlight-bg` + accent inset bar. Comment lines use the muted comment color; no rainbow tokens. |
| `terminal-output` | Header band, dark terminal panel (`--ld-terminal-bg`) with chrome bar. `$` prompt in accent, command in ink, output in muted. Rows stagger in. |
| `architecture-overview` | Header band, centered panel diagram zone (`children` slot) of nodes connected by hairline rules (line-draw); `items` render as a component legend in the bottom meta row. Falls back to an inline node chain when no children. |
| `data-flow` | Header rail, then numbered lanes; each `flowSteps` entry renders from → to with mono labels and an accent direction marker. |
| `api-endpoint` | Method chip (accent-soft) + mono path headline in header; request and response as two side-by-side code panels with kicker labels. |
| `spec-table` | Hairline-bordered table in a panel. Header row mono uppercase small; row separators hairline; priority/status cells may use chips. Max 5 cols × 6 rows. |
| `comparison-table` | Same table; the recommended column (`recommendedColumn`, default 1) gets accent-soft fill. |
| `decision-record` | Three panels CONTEXT / DECISION / CONSEQUENCES under a header; the Decision panel gets the accent border. Consequences render as a numbered list. |
