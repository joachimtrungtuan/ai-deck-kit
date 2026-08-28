# Guidance planting and synchronization

## What changed

- Centralized generated template and deck schema guidance in one CLI module.
- Added `aideck guidance status` and `aideck guidance sync` for legacy and
  stale project bundles.
- Made deck creation, template creation, retemplate, and template version bumps
  plant or refresh their owning guidance.
- Made `aideck doctor` report missing or stale guidance without changing user
  templates or decks.
- Added idempotent legacy-backfill and retemplate-refresh regression coverage.
- Added exclusive `--deck <slug>` and `--template <name>` selectors to status
  and sync, rejection of unknown/missing selectors, and preservation backups.
- Verified build, lint, typecheck, package validation, lifecycle (10), boundary
  (12), and serve (35) tests. Workspace guidance is current. VIVIMOON remains
  deliberately pinned to Linear Dark 1.2.0 rather than shipped 2.0.1.

## Why

Clean-context agents need the same schema rules inside installed packages, not
only in the engine repository where the implementation history is known.

## Follow-ups

- Remote publication and published-version install/upgrade proof remain pending.

## Major release decision

User requested kit `1.0.0`, superseding unpublished `0.4.0`. Package and engine
versions, engine lockfile root, upgrade examples and release-plan references
are aligned. Content schema remains `2.0.0`; templates remain `2.0.1`.
CLI version, package validation, typecheck and diff checks pass. Local commits:
`8eee6fd` (implementation), amended `chore(release): bump kit to 1.0.0` (major version and plan closure). No push, tag or publication
performed. The workspace hook prevented repeating
the compilation check; the prior compilation and 57 tests passed.

## Plan status reconciliation

Checked every phase status and remaining checklist item. Phases 1–6 and 2b
are complete. User explicitly confirmed closing phase 7 at local commit handoff
and amending the latest commit. The plan index and release phase now record
completion, with publication and published-version install/upgrade verification
retained as unverified release follow-ups. Removed superseded migration wording.
The user owns pushing; a branch push alone does not trigger the tag-based release.
