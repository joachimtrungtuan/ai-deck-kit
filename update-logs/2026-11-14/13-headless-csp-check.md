# Headless CSP verification

- Added a shared Chrome executable finder and fail-closed headless CSP read-back for standalone HTML exports.
- Both single and web exports now verify normal and `?print` pages, recording directive and blocked URI details; missing Chrome emits one visible skip warning while runtime failures fail.
- Forwarded CSP violations from the fixed slide iframe and hashed generated YAML CSS blocks used by diagrams and slide overrides.
- Added real Chrome checks for clean exports, injected inline styles, missing recorder, missing browser, and runtime failure.
- The clean showcase export added about 3.4 seconds for the two headless checks on this Mac.
- Final focused CSP verifier: 4 passed, 0 failed; CSP metadata/frame suite: 9 passed, 0 failed in the real-Chrome run.
- Lint, typecheck, build-current, and validate all passed. The repository-wide `npm test` process emitted 32 passing tests before the harness returned without a Node summary; no failure lines were emitted.
