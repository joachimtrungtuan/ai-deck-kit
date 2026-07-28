# Clarity Courseware Slide Types V1

Named compact profile for lesson and course presentations. It is independent of
the additive `slide-types-v1.md` and `slide-types-v2.md` catalogues. Templates
declaring `slideTypeCatalog: "clarity-courseware-v1"` must implement every type
and variant below.

| Type | Purpose | Layout variants |
| --- | --- | --- |
| `title` | Open a course or lesson with one promise | `editorial-left`, `orange-statement`, `black-hero` |
| `section-divider` | Reset pacing between lesson sections | `number-led`, `chapter-band` |
| `content-text` | Explain concepts through structured text | `statement`, `rule-list`, `two-column`, `concept-callout` |
| `content-media` | Pair instruction with visual evidence | `split-figure`, `captioned-figure`, `image-grid` |
| `table` | Present reference or comparison data | `reference-table`, `comparison-table` |
| `code` | Explain a focused code excerpt | `explain-and-code`, `focus-lines` |
| `data-visual` | Show metrics, charts, or concept diagrams | `metric-highlight`, `comparison-chart`, `concept-diagram` |
| `full-bleed-image` | Let one image carry the slide | `editorial-overlay`, `caption-strip` |
| `quote` | Highlight a memorable external voice | `centered-quote`, `pull-quote` |
| `closing` | Conclude with a decision or next actions | `next-steps`, `final-statement` |

Total: 10 semantic types and 25 layout variants.

## Shared optional props

- `layoutVariant`: one of the variants declared for the selected type.
- `backgroundVariant`: `white`, `orange`, or `black`; defaults to `white`.
- `highlightPhrase`: first exact contiguous title substring rendered in Newsreader.
- `courseName`, `lessonName`, `sectionName`: optional instructional metadata.
- `pageCurrent`, `pageTotal`: runtime-supplied page position.

## Density and behavior

- Title: one promise, optional short support line.
- Lists: 3–5 items.
- Tables: maximum 5 columns × 6 rows.
- Code: maximum 14 visible lines; 1–3 highlighted lines.
- Charts: one orange emphasis series or mark; label meaning without color alone.
- All layouts support all three background variants, but authored decks should
  remain white-dominant.
- Cover and full-bleed image suppress the footer. Full-bleed image also suppresses
  the header.
