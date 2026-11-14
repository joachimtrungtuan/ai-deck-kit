# CLI browser launch verification — 2026-11-15

## Outcome

No product defect found. The CSP checker and both CLI HTML export modes work with native Chrome when executed outside the managed sandbox. The previously reported `spawnSync --dump-dom` exit `134` with empty output is reproducible only under the default sandbox execution environment.

## Reproduction and controls

Chrome: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, version `157.0.8103.51`.

Minimal plain document, exact checker launch shape:

```text
default sandbox: status=134, stdout=0 bytes, stderr=0 bytes
escalated native execution: status=0, stdout=79 bytes, stderr=70 bytes
```

The escalated stderr is the non-fatal Chrome allocator warning: `Trying to load the allocator multiple times. This is *not* supported.` The DOM output is present and valid. The probe used a fresh temporary `--user-data-dir` and the same headless flags as the checker.

The same split occurs before any exported page is involved, so it is not caused by file URLs, loopback, CSP, deck JavaScript, or the shared checker lease. The earlier report's file and loopback failures match this sandbox-only launch failure.

## Real CLI verification (escalated native execution)

Against `decks/presenter-test.deck`:

- `node engine/skills/presentation-crafting/scripts/export-standalone-html.mjs --deck decks/presenter-test.deck --out /private/tmp/aideck-cli-single --mode single` — exit `0`; CSP check passed normal + print in `2565ms`.
- Same command with `--out /private/tmp/aideck-cli-web --mode web` — exit `0`; CSP check passed normal + print in `2838ms`.
- Five repeated direct checker runs on the generated single export — all passed (`2423–2503ms`), with no leftover `/tmp/aideck-csp-check.lock`.
- Direct native Chrome loopback probes for `/index.html` and `/index.html?print` — both exit `0`, DOM output present (`3.3MB`).

## Tests

Focused CSP suite under escalated native execution: **9 passed, 0 failed**:

```text
node --experimental-strip-types --test engine/cli/tests/export-html-csp-headless-check.test.ts engine/cli/tests/export-html-csp-meta.test.ts
```

## Decision

No source change. The checker already fails closed on non-zero Chrome status and does not misclassify runtime failure as missing Chrome. Native Chrome verification must be run with the host's actual process permissions; a managed sandbox cannot be used as evidence for this check.

## Unresolved questions

- None for the product implementation. CI or release automation should provide a native browser-capable runner when invoking the real-browser CSP check.
