# Cross-origin export frame refusal

## What changed

- FR-61 now records the user's decision to refuse cross-origin rendering after the navigation attempt, including when Chromium blocks navigation.
- The frame-buster marks refusal before attempting top navigation; the export shell hides its loader/root and the export entry skips the React mount.
- Real Chrome regressions cover cross-origin refusal and same-origin iframe rendering.

## Why

Best-effort navigation alone could leave a blocked cross-origin frame showing an export loader or presentation. Refusal makes the fallback outcome explicit without changing same-origin presenter mirrors or top-level exports.

## Validation

Focused CSP/frame-buster tests and the standard project gates are run with this change; results are recorded in the worker report.
