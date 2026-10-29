# Canonical Slide Content Schema

Use `content.md` with one Markdown section per slide. Its paired `deck.json` is the manifest: it owns the deck title, slug, audience, goal, template, catalog versions, output mode, defaults, and slide registry. Do not duplicate that frontmatter in `content.md`.

## Slide Block

````markdown
## Slide 01: Short Slide Title

```yaml
id: "slide-01"
type: "title"
status: "draft"
intent: "Open the presentation with the core promise."
animation: "gentle-rise"
layoutVariant: "editorial-left"
backgroundVariant: "white"
highlightPhrase: "one clear idea"
courseName: "AI Foundations"
lessonName: "Lesson 01"
sectionName: "Core concepts"
imageSrc: "assets/retrieval-loop.png"
imageAlt: "Retrieval practice loop"
tableColumns: ["Step", "Purpose"]
tableRows: [["Retrieve", "Find evidence"], ["Reflect", "Test the claim"]]
language: "ts"
highlightLines: [2, 3]
metric: "84%"
metricLabel: "Learners completing the practice"
chartData: [{"label":"Read","value":42}, {"label":"Apply","value":76}]
icons: []
assets: []
override:
  layout: "none"
  animation: "none"
  reason: ""
```

### On-Slide Text

- Primary visible text.
- Supporting visible text.

### Visual Direction

Describe image, icon, chart, diagram, or type-only treatment.

### Speaker Notes

Pacing: FOCUS
Target: 2m30s
Cue: pause for questions after the second point

What the presenter should say but the slide should not carry.

### Design Notes

Constraints for layout, hierarchy, spacing, emphasis, or asset treatment.

### Review Questions

- Any unresolved question for this slide.
````

## Rules

- Every slide must have `id`, `type`, `status`, `intent`, `animation`, and `transition`; the `id` and `type` must match the paired `deck.json` slide registry.
- A numeric slide id (`slide-01`, `slide-02`, ...) is position-derived, not a durable handle: `aideck slide add|remove|move` renames it to match its new 1-based position and re-syncs `deck.json` `slides[].file`, the section `id`, and the `## Slide NN (slide-NN)` heading label. After any reorder, a numeric id may name a different slide than it did before — re-read `deck.json` before addressing a slide by id. Give a slide a custom, non-numeric id (`slide-summary`) when it needs an identity that survives reordering; custom ids are never renamed.
- `type` must exist in the active slide-type catalog.
- `override.reason` is required when `override.layout` or `override.animation` is not `none`.
- `layoutVariant` and `backgroundVariant` are optional template-owned selections.
  When present, they must be declared by the active template manifest.
- `highlightPhrase` is optional. Templates may style its first exact contiguous
  occurrence inside the title; unmatched text must render safely without emphasis.
- `courseName`, `lessonName`, and `sectionName` are optional instructional
  metadata. Page position is supplied by the runtime rather than authored.
- Use optional advanced metadata only when the selected layout needs it:
  `imageSrc`/`imageAlt`/`caption` for media, `tableColumns`/`tableRows` (plus
  optional `tableColumnWidths`, one fraction or percentage per column) for
  tables, `language`/`highlightLines` for code, and `metric`/`metricLabel` or
  `chartData` for data visuals. Keep arrays and objects on one flow-style,
  JSON-compatible YAML line so the shared runtime can parse them.
- `### Speaker Notes` may open with optional header lines, in any order, before the body:
  `Pacing: FOCUS|BRIEF|SKIM|ON-DEMAND` (ON-DEMAND slides are skipped by presenter Next/Prev),
  `Target: 90s|2m|2m30s` (talk-time budget for the pace indicator), and `Cue: <text>` (one-line
  reminder). The body is Markdown plus a small safe HTML subset and is shown only in the presenter
  window — never on the slide or in an export. Notes without headers stay valid; unknown `Pacing`
  or an unparseable `Target` is a validator warning, not an error.
- `tocTitle` is an optional, navigation-only label for the slide list (preview
  sidebar, export picker). It is never rendered on the slide; omit it to show
  the slide type.
- Put edit intent and review notes in this file, not hidden only in React source.
- Keep visible slide copy under the density limits of the chosen template.
- When a structured block is needed, add it to the slide YAML under `blocks:` using a type from the deck's pinned block catalog. Preserve the prose sections below it.
