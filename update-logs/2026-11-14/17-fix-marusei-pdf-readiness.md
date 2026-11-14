# Marusei PDF readiness fix

## What changed

- Made image readiness wait for `load`, then `createImageBitmap` completion and bitmap close; bitmap rejection retries native `Image.decode` before failing.
- Added a real-Chrome lifecycle regression covering bitmap success/close, bitmap rejection fallback, and both-reject failure.

## Why

The Marusei print DOM had 40 empty pages, no ready/error marker, and a permanently visible loader. The prior loader could wait forever on a native image decode promise that never resolved.

The earlier load-only fallback was removed because it did not prove the required decoded state. The current fix preserves the loaded + decoded contract and handles browsers that expose but reject `createImageBitmap` for a format.

Actual native verification: rebuilt single and web exports both passed CSP normal + print; rebuilt PDF completed 40 slides at 3.1 MB. Focused browser lifecycle/PDF readiness tests passed 12/12. Full npm test passed 227/227 with 0 skips; typecheck, lint, build-check, and validate passed.

## Verification

- Native Chrome allocator/CVDisplayLink stderr diagnostics remain, but escalated commands exit successfully and generated the verified artifacts.
- Final manual Safari/Chrome visual acceptance remains pending.
