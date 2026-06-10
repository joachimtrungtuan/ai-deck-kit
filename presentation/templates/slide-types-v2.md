# Slide Types V2

The v2 catalog is additive over `v1`: it contains every v1 type verbatim, plus a new **Technical** category for software-requirements and engineering presentations. Template sets that declare `slideTypeCatalog: "v2"` must support every type below.

V1 templates remain valid against `slide-types-v1.md` and are unaffected by this version.

## Foundation

| Type | Required Linear Dark component |
| --- | --- |
| `title` | `LinearTitleSlide` |
| `section-divider` | `LinearSectionDividerSlide` |
| `closing` | `LinearClosingSlide` |
| `agenda` | `LinearAgendaSlide` |

## Text-Led

| Type | Required Linear Dark component |
| --- | --- |
| `text-statement` | `LinearTextStatementSlide` |
| `text-list` | `LinearTextListSlide` |
| `two-column-text` | `LinearTwoColumnTextSlide` |
| `quote` | `LinearQuoteSlide` |
| `numbered-framework` | `LinearNumberedFrameworkSlide` |

## Visual-Led

| Type | Required Linear Dark component |
| --- | --- |
| `full-bleed-image` | `LinearFullBleedImageSlide` |
| `image-text-split` | `LinearImageTextSplitSlide` |
| `image-grid` | `LinearImageGridSlide` |
| `icon-grid` | `LinearIconGridSlide` |
| `diagram` | `LinearDiagramSlide` |

## Data And Evidence

| Type | Required Linear Dark component |
| --- | --- |
| `metric-highlight` | `LinearMetricHighlightSlide` |
| `chart` | `LinearChartSlide` |
| `evidence-stack` | `LinearEvidenceStackSlide` |
| `case-study` | `LinearCaseStudySlide` |

## Product Or Workflow

| Type | Required Linear Dark component |
| --- | --- |
| `process-flow` | `LinearProcessFlowSlide` |
| `before-after` | `LinearBeforeAfterSlide` |
| `ui-showcase` | `LinearUiShowcaseSlide` |
| `timeline` | `LinearTimelineSlide` |

## Technical

New in v2. For delivering technical explanations: code, architecture, specs, APIs, comparisons, and terminal demos. Required component column names the implementing template's component.

| Type | Purpose | Required Linear Dark component | Key props (all optional, added to the shared prop shape) |
| --- | --- | --- | --- |
| `code-snippet` | Present a focused code excerpt with explanation | `LinearCodeSnippetSlide` | `code: string`, `language?: string`, `highlightLines?: number[]`, `caption?` (reuse) |
| `terminal-output` | Show CLI commands and their output (demos, install steps) | `LinearTerminalOutputSlide` | `commands?: { prompt: string; output?: string }[]` |
| `architecture-overview` | System components and their connections at a glance | `LinearArchitectureOverviewSlide` | `children` slot (diagram markup) + `items` for component legend |
| `data-flow` | Step-by-step flow of data/requests between actors | `LinearDataFlowSlide` | `flowSteps?: { from: string; to: string; label: string }[]` |
| `api-endpoint` | One API operation: method, path, request/response shape | `LinearApiEndpointSlide` | `method?: string`, `path?: string`, `requestExample?: string`, `responseExample?: string` |
| `spec-table` | Requirements/spec matrix (ID, requirement, priority, status) | `LinearSpecTableSlide` | `tableColumns?: string[]`, `tableRows?: string[][]` |
| `comparison-table` | Options/approaches compared across criteria | `LinearComparisonTableSlide` | `tableColumns?`, `tableRows?` (shared with `spec-table`), `recommendedColumn?: number` |
| `decision-record` | Architecture decision: context → decision → consequences | `LinearDecisionRecordSlide` | `context?: string`, `decision?: string`, `consequences?: string[]` |

### Technical category rules

- **One idea per slide** still holds: one endpoint, one decision, one flow, one architecture per slide. Split a multi-endpoint API across multiple `api-endpoint` slides.
- **Code blocks max ~14 lines.** Mono font only. No syntax-highlight rainbow — use the muted token palette defined by the template's design system (4–5 token colors: keyword, string, comment, function, plus a highlight background). The accent color is reserved for the emphasized/highlighted line, never spread across all tokens.
- **Tables max 5 columns × 6 rows.** Beyond that, split or summarize. Header row is mono, uppercase, small. `comparison-table` may highlight one recommended column.
- **Terminal output** distinguishes prompt, command, and output by color/weight, never by syntax coloring.
- Technical slides still carry a kicker/index or structural label like every other slide type.
