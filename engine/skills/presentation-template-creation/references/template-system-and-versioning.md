# Template System And Versioning

A template set is a complete visual system for one presentation family.

## Template Set Requirements

Each template set must include:

- `template-manifest.json`
- design tokens for color, typography, spacing, radii, stroke, and shadow
- slide layouts for every active slide type in its declared catalog version
- animation defaults
- icon family policy
- responsive rules
- quality notes for text density and asset treatment

## One Template Per Deck

Use one template set per presentation. Do not mix Swiss Modern slides with SaaS Technical slides inside one deck unless a new hybrid template set is explicitly created.

## Versioning

Version three things separately:

- `template_version`: the visual template set version.
- `slide_type_catalog`: the required slide-type list version.
- `content_schema_version`: the canonical content file schema version.

When `slide-types-v2` is created later, old templates that declared `v1` remain valid. Do not silently force old decks into newer slide types.

## Template Manifest Shape

```json
{
  "name": "swiss-modern",
  "displayName": "Swiss Modern",
  "deckClass": "swiss-deck",
  "templateVersion": "1.0.0",
  "contentSchemaVersion": "1.0.0",
  "slideTypeCatalog": "v1",
  "runtime": ["react", "static-html"],
  "iconFamily": "phosphor-react",
  "defaultAnimation": "gentle-rise",
  "designTokens": {
    "color": true,
    "typography": true,
    "spacing": true
  },
  "supportedSlideTypes": [
    "title",
    "section-divider",
    "text-statement"
  ]
}
```

`deckClass` is the template-scoped CSS class applied by the shared preview runtime. New scaffolds set it to `<template-name>-deck`; older templates without the field fall back to the first `*-deck` selector in `design-system.css`.

## Controlled Overrides

Overrides are allowed only for:

- layout pressure that the template does not yet cover
- intentional emphasis for a key slide
- animation change for pacing
- special asset treatment

Record overrides in the content file with a reason. If the same override appears repeatedly, update the template instead.
