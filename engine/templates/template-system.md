# Presentation Template System

This folder stores reusable presentation template sets.

## Rules

- Use one template set per presentation.
- Each template set must declare its slide-type catalog version.
- Each current template set carries `schema-guidance.md`, routing agents to its
  manifest, layout contracts, React props, and the engine schema contract.
  Legacy embedded snapshots without this file remain valid.
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
| `swiss-modern` | `2.0.1` | `v1` | Typography-first Swiss style decks with strong grid discipline, bold hierarchy, and restrained motion. |
| `linear-dark` | `2.0.1` | `v2` | Dark, cinematic narrative decks with expressive editorial layouts. |

Template version and slide-type catalog version are independent axes. Swiss
Modern therefore keeps its v1 slide catalog while consuming the v2 content
schema; the manifest's `contentSchemaVersion` is authoritative for content
parsing.
