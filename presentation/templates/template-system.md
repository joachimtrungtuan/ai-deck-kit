# Presentation Template System

This folder stores reusable presentation template sets.

## Rules

- Use one template set per presentation.
- Each template set must declare its slide-type catalog version.
- Every active slide type must map to a layout contract and a React component.
- Deck-specific changes belong under `presentation/working-files/`, not in reusable templates.
- Repeated deck overrides should become a template update.

## Template Sets

| Template | Version | Catalog | Use |
| --- | --- | --- | --- |
| `swiss-modern` | `1.0.0` | `v1` | Typography-first Swiss style decks with strong grid discipline, bold hierarchy, and restrained motion. |
