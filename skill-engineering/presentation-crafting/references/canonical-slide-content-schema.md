# Canonical Slide Content Schema

Use Markdown with YAML frontmatter and one slide section per slide.

## File Frontmatter

```yaml
---
title: "Presentation title"
slug: "presentation-slug"
audience: "Who this is for"
goal: "What the presentation should achieve"
template_set: "template-set-name"
template_version: "1.0.0"
slide_type_catalog: "v1"
output_mode: "react-and-static-html"
status: "draft"
---
```

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

- Every slide must have `id`, `type`, `status`, `intent`, and `animation`.
- `type` must exist in the active slide-type catalog.
- `override.reason` is required when `override.layout` or `override.animation` is not `none`.
- Put edit intent and review notes in this file, not hidden only in React source.
- Keep visible slide copy under the density limits of the chosen template.
