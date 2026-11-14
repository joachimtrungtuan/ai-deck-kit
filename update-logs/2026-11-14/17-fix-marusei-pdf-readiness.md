# Marusei PDF readiness fix

## What changed

- Made image readiness settle on a successful `load` event when `Image.decode()` remains pending.
- Added a focused regression test for that browser behavior.

## Why

The Marusei print DOM had 40 empty pages, no ready/error marker, and a permanently visible loader. The prior loader could wait forever on a native image decode promise that never resolved.

The earlier load-only fallback was removed because it did not prove the required decoded state. The verified fix waits for `load`, then `createImageBitmap` completion (or `Image.decode` where bitmap decode is unavailable).

Actual native verification: rebuilt single and web exports both passed CSP normal + print; rebuilt PDF completed 40 slides at 3.1 MB. Focused loader/PDF readiness tests passed 11/11. Full repository gates remain pending.

## Verification

- Focused asset-loader tests passed.
- Engine typecheck passed.
- Full real-browser PDF verification is pending because Chrome currently exits `SIGABRT` even on a tiny fixture.
