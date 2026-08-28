---
title: "Phase 07: Release Cutover"
phase: "07"
status: "completed"
---

# Phase 07: Release Cutover

## Context Links

- [plan.md](plan.md) — "Cutover model"
- [phase-05](phase-05-migrate-linear-dark-and-swiss-modern-templates.md) — the template bumps that do the actual switching
- [phase-06](phase-06-v1-freeze-verification.md) — the gate this publishes behind
- `engine/engine.version.json` — release target `engineVersion: "1.0.0"`

## Overview

The user's cutover rule: *everything created before the new published version
stays v1; everything created after it is v2, and the templates move in that
same release.* Phases 1–6 build the machinery. This phase is the release that
makes the boundary real, and the documentation that lets someone six months
from now understand why two schemas exist.

Local preparation and commit handoff are complete: versions are at `1.0.0`.
**Closed by explicit user confirmation on 2026-08-28.** The accepted completion
boundary is the local commit handoff. Publication and published-version
install/upgrade verification remain release follow-ups, not completed checks.
The user reserved pushing for themselves; no push, tag, or release is authorized.

## Key Insights

1. **The switching mechanism is the template manifest, not the engine version.**
   `createDeck` stamps the template's declared `contentSchemaVersion`, so decks
   become v2 the moment they are created from a v2 template. The engine release
   matters because it is what delivers the migrated shipped templates. Stating
   this precisely avoids the false expectation that upgrading the engine
   converts anything.
2. **A project-local template is not upgraded by an engine upgrade.** `engine/`
   is replaced wholesale; `templates/` in the consuming project is user data and
   is left alone. So a project with its own template crosses the line only when
   it migrates that template — which is correct, and needs saying in the
   upgrade note because it is the opposite of what "upgrade" usually implies.
3. **Engine upgrade never migrates user content.** That is already the
   documented promise in `docs/deployment-guide.md:131` ("Upgrade never
   force-migrates user content") — this release is the first real test of it,
   and honours it.

## Requirements

1. `engineVersion` bumped to a new major (`0.3.3` → `1.0.0`); the engine ships
   templates that consume a different content schema, which is user-visible
   behavior change, not a patch.
2. An upgrade note stating, in order: existing decks keep working untouched;
   new decks from shipped templates are v2; project-local templates stay v1
   until their owner explicitly requests migration. The agent-led
   `content-schema-migration` skill is opt-in and requires visual approval;
   engine upgrade never rewrites content.
3. `docs/deck-format-spec.md` and `docs/deployment-guide.md` reflect the
   two-schema world rather than a single current schema.
4. Published only after [phase-06](phase-06-v1-freeze-verification.md) passes.

## Implementation Steps

1. Confirm phase-06's evidence is recorded and green.
2. Bump `engineVersion` in `engine/engine.version.json` to `1.0.0`. Leave
   `supportedContentSchemaMajors` as `[1, 2]` — v1 support is permanent, not a
   deprecation window.
3. Write the upgrade note in the repo's existing upgrade/release documentation
   surface (discover it rather than assuming a filename).
4. Update `docs/deployment-guide.md`'s compatibility paragraph to describe
   major-version dispatch across v1 and v2.
5. Update `docs/deck-format-spec.md`'s status line from "Draft spec v0.1 …
   `content_schema_version` starts at `1.0.0`" to the v1-frozen / v2-canonical
   framing (this is the phase-01 docs follow-up landing here if it has not
   already).
6. Publish per the repo's normal release process; verify a clean install from
   the published version scaffolds a v2 deck.

## Todo List

- [x] Phase-06 evidence green
- [x] `engineVersion` → `1.0.0`
- [x] Upgrade note written
- [x] `deployment-guide.md` compatibility paragraph updated
- [x] `deck-format-spec.md` status line updated
- [x] Local implementation and major-version release commits created
- [x] User confirms closure at local commit handoff; release checks transferred to follow-ups below

> **Local release-prep landed (2026-08-28 sync-back).** `engine/engine.version.json`,
> `engine/package.json`, repo-root `package.json`, and `ai-deck-kit.json` are
> aligned on `1.0.0`; the engine template support range is `>=2.0.0 <3.0.0`;
> release/deployment/schema docs plus template-system/icon-policy docs are in
> sync; committed CLI dist is rebuilt; `npm run lint`, `npm run typecheck`,
> `npm run validate`, `npm run test:lifecycle` (10/10), `npm run test:boundary`
> (12/12), `npm run test:serve` (35/35 outside sandbox), and package dry-run
> passed. `npm run test:smoke` remains locally blocked by npm
> `EALLOWSCRIPTS`/`.npm` permission policy, and serve `EPERM` occurs only in
> sandbox. Remote publication and clean published-install proof were
> intentionally not performed here and remain release follow-ups.

**Status reconciliation (2026-08-28):** implementation committed as `8eee6fd`;
major release bump included in the amended `chore(release): bump kit to 1.0.0`
commit. The later guidance and migration
verification is recorded in
[the guidance update log](../../update-logs/2026-08-28/04-guidance-planting-and-sync.md).
These are local checks, not evidence of installation from a published release.
Publication is owned by
[the release workflow](../../.github/workflows/engine-release.yml), which runs on
version-tag pushes; pushing the branch alone does not publish the release.

## Success Criteria

1. A fresh `init` on the published version, followed by `aideck new` from
   a shipped template, produces a deck stamped `2.0.0` that renders.
2. An existing project upgraded to the published version still opens, validates,
   and renders its v1 decks with no content edits.
3. The upgrade note answers "why do I see two schemas?" without needing this
   plan.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Remote release publication is listed as unverified in `CLAUDE.md` | Treat first publish as the risk it is; verify by clean install (criterion 1) rather than assuming |
| Someone reads "v1 frozen" as "v1 deprecated" and starts migrating decks | Support is permanent; migration is optional, agent-led, and requires an explicit user request plus visual approval |
| Release ships before phase-06 evidence exists | Step 1 is an explicit gate |

## Security Considerations

None beyond the repo's normal publish process.

## Release Follow-ups (outside the closed phase)

The user's explicit closure confirmation supersedes the original requirement
to keep this plan open until publication. These checks remain unverified and
must not be described as passing based on plan closure.

- Publish the `1.0.0` release through the normal remote release path.
- Verify a clean install from the published version scaffolds and renders a v2 deck.
- Verify an existing-project upgrade preserves v1 content and rendering.

Downstream `clarity-courseware` migration remains optional, owner-initiated
work in `AI Udemy Course/`, with no deadline — its decks keep working as v1
indefinitely.

That migration, if its owner ever runs it, owns these items (moved here so they
are not orphaned):

- Bump `clarity-courseware.template`'s manifest to `contentSchemaVersion:
  "2.0.0"` and `templateVersion` major.
- Edit `layouts/react/data-slides.tsx`'s concept-diagram branch to read
  `item.title` / `item.icon` from object `items[]` (locked decision 7). This was
  originally scoped into phase-04; it must not land while the manifest declares
  v1, or new decks are stamped v1 and rendered by v2-shaped components.
- Rewrite the six `claude-lesson-*.deck` `content.md` files to v2 and retemplate
  them, or leave them on v1 and pin them to a v1 copy of the template.
