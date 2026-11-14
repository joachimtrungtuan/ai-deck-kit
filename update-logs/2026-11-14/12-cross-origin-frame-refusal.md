# Cross-origin export frame refusal

## What changed

- FR-61 now records the user's decision to refuse cross-origin rendering after the navigation attempt, including when Chromium blocks navigation.
- The frame-buster marks refusal before attempting top navigation; the export shell hides its loader/root and the export entry skips the React mount.
- Real Chrome regressions cover cross-origin refusal and same-origin iframe rendering.

## Why

Best-effort navigation alone could leave a blocked cross-origin frame showing an export loader or presentation. Refusal makes the fallback outcome explicit without changing same-origin presenter mirrors or top-level exports.

## Validation

- Frame-aware Chrome regressions use asynchronous fixture servers and child-side HTTP observations because `--dump-dom` serializes only the top-level document.
- Cross-origin child reports refusal marker, hidden loader/root, and no rendered marker; same-origin child reports no refusal, visible root, and rendered marker.
- Focused suite: 4/4 pass. Full `npm test` passes under escalated execution; build-check, lint, typecheck, and validate remain green.
