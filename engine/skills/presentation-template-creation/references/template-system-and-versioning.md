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

Slide Types v2 is the current catalog for new template work. Templates that
already declare `v1` remain supported; do not silently force their decks into
newer slide types.

`templateVersion` is the drift signal. A deck freezes a copy of its template at creation and records the version it froze; `aideck deck status` compares that against the live source. This only works if the agent bumps the version after every edit — the CLI reads versions, it never writes template content or infers a bump. See SKILL.md → Versioning Discipline for the patch/minor/major decision.

## Where Templates Live

One place: the project's `templates/{name}.template/`. `engine/templates/` holds only the defaults shipped with the toolkit — read-only, replaced wholesale on upgrade, and refused by `aideck template version --bump`. To evolve a shipped default, copy it into `templates/` under a new name. When both roots hold the same name, the project's copy wins everywhere: `serve`, the gallery, deck creation, and re-sync.

## Template Manifest Shape

```json
{
  "name": "swiss-modern",
  "displayName": "Swiss Modern",
  "deckClass": "swiss-deck",
  "templateVersion": "1.0.0",
  "contentSchemaVersion": "2.0.0",
  "slideTypeCatalog": "v2",
  "runtime": ["react", "static-html"],
  "iconFamily": "phosphor-react",
  "defaultAnimation": "gentle-rise",
  "supportedAnimations": ["none", "fade", "gentle-rise"],
  "defaultTransition": "none",
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

Element animations are engine-owned `primitive-anim-*` classes. Templates declare their supported names and tune them with `--deck-motion-base`, `--deck-motion-ease`, and the optional `--deck-motion-slow` tier; they ship no animation CSS of their own.

## Controlled Overrides

Overrides are allowed only for:

- layout pressure that the template does not yet cover
- intentional emphasis for a key slide
- animation change for pacing
- special asset treatment

Record overrides in the content file with a reason. If the same override appears repeatedly, update the template instead.
