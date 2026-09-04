# Kit reliability code review

**What changed:** Full-codebase reliability review of the kit (install, upgrade, serve/export, pack/unpack, agent wiring, Claude hooks, CI/release). Report at `plans/reports/code-review-260904-1035-kit-reliability-review.md`. No code changed.

**Why:** User asked to confirm the kit is reliable for practical use in consumer projects before further work.

**Result:** Baseline gates all green. 3 HIGH (no shipped lockfile; `vite-plugin-singlefile` runtime dep in devDependencies; absolute-path Claude hook commands in shared settings), 4 MEDIUM (init not resumable; safeguards silently skipped non-interactively; unpack collision behaviour; resolver shim raw stack), 8 LOW, plus test gaps. Chrome tall-screenshot hypothesis tested and disproved.

**Follow-ups:** Fix in the order listed in the report (F2 → F1 → F3 → F4/F5 → F6/F7 → tests). Three open questions at the end of the report need user answers (safeguard consent model, whether Storybook ships in the consumer engine, `config --set` root validation).
