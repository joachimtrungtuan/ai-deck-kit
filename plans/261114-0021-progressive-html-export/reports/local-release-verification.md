# Local release verification — 2026-11-15

Status: DONE. Local release complete; publication intentionally deferred by user choice (November 15).

## Local refs

- Reviewed documentation commit: `4e0bcda`.
- Main merge: `6830ee7db9bc8d4e25f15ec66959e85f9e6c80c5` (`merge: progressive html export`).
- Release commit: `160dde7f17c05a3abbf0a9c256b618e6f2ed4143` (`chore(release): bump to 1.5.0`).
- Annotated `v1.5.0`: object `b8b794ee7db341ca76117db89fcadc40b4739ca9`, targets release commit above.
- Existing annotated `v1.4.1` preserved at `324532d77fafdd452644dd6e82e32c6bc19a0648`.
- Five version files agree on 1.5.0; content schema remains 3.2.0. CLI reads package version dynamically; no compiled output change needed.

## Gates and distribution

Premerge sequential gates: **228/228 tests**, build:check, lint, typecheck, validate PASS. Original exec handle was inaccessible across agents; native process inspection confirmed the shell remained alive, so its durable logs were reused without duplicate tests. Logs: `/private/tmp/aideck-release-{test,build,lint,typecheck,validate}.log`.

After the version-only edit: build:check, lint, typecheck, validate PASS; CLI version 1.5.0. Logs: `/private/tmp/aideck-postbump-{build,lint,typecheck,validate}.log`. Full tests were not repeated for version metadata.

Actual `npm pack` artifact: `/private/tmp/aideck-local-release-1.5.0/ai-deck-kit-1.5.0.tgz`; 361 entries, 432,307 bytes, unpacked 1,817,665 bytes.

SHA-256: `47e03086a08d9e98854fb27860da6c68c232e228eeed33f045aa42d01714c41f`.

Pack inventory includes all export/font helper scripts and declarations. No private root decks, user templates, plans, logs, dotenv files, agent homes or repomix snapshots included. Standard package validation confirms both shipped template bundles and guidance. A writable temporary npm cache avoided the sandbox's blocked default cache; no cache ownership changes made.

## Real scratch install and upgrade

- Unpacked actual tarball, ran its `bin/create-ai-deck-kit init --here` in a new scratch consumer with real npm dependencies: exit 0, CLI 1.5.0.
- Initialized another scratch consumer from `git archive v1.4.1`, with real dependencies. Seeded real bundled showcase deck and linear-dark template copies plus user sentinels; synchronized generated guidance before taking hashes.
- Ran installed `./aideck upgrade --to 1.5.0 --source /private/tmp/aideck-local-release-1.5.0/unpacked/package`: exit 0; post-upgrade verification reports one template and one deck. All 44 user deck/template files retain identical SHA-256 hashes; pointer and installed CLI report 1.5.0.
- Initial incomplete sentinel bundles correctly failed post-upgrade validation. Corrected only scratch fixtures, restored the actual 1.4.1 baseline through the supported CLI, then reran the valid upgrade above. No product change required.
- Scratch evidence/logs: `/private/tmp/aideck-local-release-1.5.0/`. No persistent server/watch process started.

## Publication boundary

No push, workflow invocation, release creation or release-note edit performed. Registry-backed installation remains unverified. Future publication procedure (outside accepted delivery): push main before tags; publish existing 1.4.1 then 1.5.0 in ancestry order, allow Engine Release workflows to create releases, verify both attached assets, then edit notes and record actual results. Never use `gh release create`.

Unresolved questions: none within accepted local delivery.

## Final closure — 2026-11-15
User explicitly chose **“Keep releases local”**. Local delivery complete; GitHub publication outside current scope, not pending approval. No pushes, workflows, hosted release assets or release-note edits performed. Local notes drafts retained. Plan closes on verified local releases, package and real install/upgrade evidence; registry-backed installation remains unverified. Historical approval-ready review records remain unchanged.
