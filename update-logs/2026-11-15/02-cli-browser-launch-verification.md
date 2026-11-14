# CLI browser launch verification

What changed: investigated the reported Chrome `spawnSync --dump-dom` exit-134 gap for progressive HTML export. Reproduced the failure under the default managed sandbox and proved the same minimal probe, current checker, real single export, real web export, and loopback URLs pass under escalated native execution with Chrome 157.

Why: determine whether the CSP checker or exported page was broken before release.

Follow-ups: run native-browser CSP checks in CI/release environments; no product source change was needed.
