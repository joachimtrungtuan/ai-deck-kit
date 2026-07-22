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

What the presenter should say but the slide should not carry.

### Design Notes

Constraints for layout, hierarchy, spacing, emphasis, or asset treatment.

### Review Questions

- Any unresolved question for this slide.
````

## Rules

- Every slide must have `id`, `type`, `status`, `intent`, `animation`, and `transition`; the `id` and `type` must match the paired `deck.json` slide registry.
- `type` must exist in the active slide-type catalog.
- `override.reason` is required when `override.layout` or `override.animation` is not `none`.
- Put edit intent and review notes in this file, not hidden only in React source.
- Keep visible slide copy under the density limits of the chosen template.
- When a structured block is needed, add it to the slide YAML under `blocks:` using a type from the deck's pinned block catalog. Preserve the prose sections below it.
