# Kit reliability Phase 1 — icon resolution

## What changed

- Replaced the linear-dark template's curated icon map with full Phosphor namespace resolution in the engine and pinned VIVIMOON snapshot.
- Invalid named icons now render an explicit error tile and fail `validate-slide-content.mjs` with slide/value context.
- Migrated VIVIMOON's five legacy alias families to real Phosphor names; synchronized template metadata and version `1.2.0`.
- Added focused validation coverage for a previously unavailable icon and an invalid icon value.

## Why

Content changes outside the old 17-entry map silently rendered `SquaresFour`, making icon overrides appear ineffective.

## Verification and follow-up

- Typecheck, lint, deck validation, diff check, and `npm run test:serve` (30/30 with local-network permission) pass.
- Template preview confirms valid Phosphor SVG output and the visible invalid-value error tile.
- The current VIVIMOON manifest-driven preview still drops metadata `icons` before slide props, leaving six slots empty. This pre-existing wiring defect remains a separate approved follow-up; Phase 1 does not modify `manifest-deck-source.tsx`.
