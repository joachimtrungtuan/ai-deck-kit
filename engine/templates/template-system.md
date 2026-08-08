# Presentation Template System

This folder stores reusable presentation template sets.

## Rules

- Use one template set per presentation.
- Each template set must declare its slide-type catalog version.
- A template may use a named, versioned compact catalog profile when the general catalog is intentionally broader than its use case. The profile must enumerate every supported type and remain additive to the general catalogs.
- Every active slide type must map to a layout contract and a React component.
- A manifest-backed deck resolves its embedded `template/` snapshot first, then
  an installed `engine/templates/<name>.template/` bundle. Embedded manifest
  name and version must match the deck's pinned template identity.
- Deck-specific changes belong under `presentation/working-files/`, not in reusable templates.
- Repeated deck overrides should become a template update.

## Template Sets

| Template | Version | Catalog | Use |
| --- | --- | --- | --- |
| `swiss-modern` | `1.0.0` | `v1` | Typography-first Swiss style decks with strong grid discipline, bold hierarchy, and restrained motion. |
| `linear-dark` | `1.0.0` | `v2` | Dark, cinematic narrative decks with expressive editorial layouts. |
