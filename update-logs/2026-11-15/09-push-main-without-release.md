# Push main without a release

**What changed**
- Merged `fix/codebase-review` into `main` (`015c4bf merge: codebase review fixes`, `--no-ff`).
- Pushed `main` to origin (`d420505..015c4bf`) with `--no-follow-tags`. No tag was pushed, so the `Engine Release` workflow did not run. Only `Engine CI` (push to main) was triggered, run 43705949580.

**Why**: the user asked to push the latest version but explicitly held the release. The gates had already passed on the identical branch tree (log 08).

**Follow-ups**
- `origin/main` now carries version 1.5.0 with no GitHub release. This departs from the repo rule that every version reaching main gets a tagged release, and the user chose it knowingly.
- Local tags `v1.4.1` and `v1.5.0` are still unpushed. When releasing, check whether `v1.5.0` sits on the right commit. It currently predates the review fixes, so either re-cut it on the new main tip or bump to 1.5.1. Then add the changelog entry and push the tag so the workflow creates the release.
- Confirm that CI run 43705949580 passed.
