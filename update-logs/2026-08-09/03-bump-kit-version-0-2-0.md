# Bump kit version to 0.2.0

**What:** Bumped version in the four places that carry it: `package.json`, `engine/package.json`,
`engine/engine.version.json` (`engineVersion`), and this repo's own `ai-deck-kit.json` pointer.
`0.1.0` → `0.2.0`.

**Why:** The Agentation feedback toolbar (this date's earlier logs 01/02) is a new,
backward-compatible feature — a minor bump. Installed projects run `aideck upgrade` against the
default GitHub branch, which already picks up engine changes regardless of the version string, but
without a bump every installed project stays reporting `0.1.0` after upgrading, indistinguishable
from before this feature landed. A real version bump makes `aideck doctor`/`deck status` output and
future `--to 0.2.0` pins meaningful.

**Verified:** `npm run lint && npm run typecheck && npm run validate` — all green after the bump.

**Follow-up:** No git tag exists yet in this repo, so `aideck upgrade --to 0.2.0` won't resolve
until a `v0.2.0` tag is pushed. Untagged `aideck upgrade` (no `--to`) still works — it packs the
default branch HEAD.
