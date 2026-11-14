# Headless CSP verification

- Added a shared Chrome executable finder and fail-closed headless CSP read-back for standalone HTML exports.
- Both single and web exports now verify normal and `?print` pages, recording directive and blocked URI details; missing Chrome emits one visible skip warning while runtime failures fail.
- Forwarded CSP violations from the fixed slide iframe and hashed generated YAML CSS blocks used by diagrams and slide overrides.
- Added real Chrome checks for clean exports, injected inline styles, missing recorder, missing browser, and runtime failure.
- The clean showcase export added about 3.4 seconds for the two headless checks on this Mac.
- Final focused CSP verifier: 4 passed, 0 failed; CSP metadata/frame suite: 9 passed, 0 failed in the real-Chrome run.
- Lint, typecheck, build-current, and validate all passed. The repository-wide `npm test` process emitted 32 passing tests before the harness returned without a Node summary; no failure lines were emitted.
- Full-suite diagnosis: Node's default concurrent test workers oversubscribed Chrome and loopback resources (allocator/runtime failures); serial execution of the unchanged suite passed 225/225 in 156.5s. The `npm test` script now pins test concurrency to 1 as a resource bound, without changing assertions.
- The headless checker also uses an atomic cross-process lease with stale-owner recovery so independent export commands cannot start Chrome concurrently; profiles remain unique and are removed in `finally`.
- Fresh escalated verification after `7598d31`: focused CSP suite 4/4; full `npm test` run 1 225/225 (158.1s) and run 2 225/225 (156.7s), each 0 failed / 0 skipped; `build:check`, `lint`, `typecheck`, and `validate` all passed. The prior allocator failure is not reproduced under the serial test bound and Chrome lease.
