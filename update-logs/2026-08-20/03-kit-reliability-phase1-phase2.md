# Kit reliability Phases 1–2

## What changed

- Completed Phase 1 manifest-driven icon prop wiring: parsed `icon`/`icons` metadata now reaches generated slide props.
- Completed Phase 2 export toolbar hide/show behavior: Shift+I and right-click toggle the export-only controls while keyboard navigation remains active.
- Added focused serve-contract coverage for both changes.
- Updated the export workflow reference with the new screen-recording controls.
- Synced the canonical reliability plan: Phases 1–2 completed; Phases 3–4 remain pending.

## Why

VIVIMOON content already declared valid Phosphor icons, but the manifest preview dropped those props. Export screen recordings also had no way to remove the navigation overlay.

## Verification

- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm run validate` — pass.
- `npm run build` — pass.
- `npm run test:serve` — 32/32 pass with local-network permission.
- Playwright proof: VIVIMOON icon-grid rendered 6 SVG tiles with 0 empty/error tiles; standalone export toolbar defaulted visible, hid via Shift+I, preserved ArrowRight navigation while hidden, and restored via right-click.

## Follow-ups

- Independent tester and docs-manager controller calls did not return. A fallback code-reviewer completed with 9/10, no critical issues, and no side-effect blocker. A delayed project-manager sync later confirmed 2/4 phases complete; the files-first plan state remains canonical.
- Phases 3 and 4 are still pending.
