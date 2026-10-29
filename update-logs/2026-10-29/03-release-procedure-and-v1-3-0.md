# Release procedure documented; v1.3.0 release

## What changed

- `CLAUDE.md` / `AGENTS.md`: new **Releases (required)** section — cut a release for every version bump that reaches `main`, version files in lockstep, changelog entry, annotated `vX.Y.Z — summary` tag, let the `Engine Release` workflow create the release (never `gh release create` by hand — that broke v1.0.2's assets), then `gh release edit` the notes. Status line no longer says release publication is unverified.
- `docs/deployment-guide.md`: CI/CD paragraph now states the workflow publishes the release (verified on v1.0.1) and points to the procedure.
- `docs/project-changelog.md`: recorded the unreleased 1.1.0–1.2.0 work, which first ships in v1.3.0.

## Why

No release since v1.0.2 while the kit moved through 1.1.0, 1.1.1, 1.2.0 and 1.3.0. The practice existed only in history, and the one hand-made release (v1.0.2) shipped without assets.

## Follow-ups

- Merge `feat/presenter-mode` into `main`, tag `v1.3.0`, confirm the workflow run attaches the tarball, then edit the notes.
- v1.0.2 still has no assets attached; re-running is not possible without deleting the release. Left as is.
