# Presenter mode (engine 1.3.0, content schema 3.2.0)

**What:** `aideck present <deck> [--export]` opens a presenter window (current/next slide, notes, talk clock, per-slide timers, rehearsal log) synced over `BroadcastChannel` to an audience window. Speaker Notes gain optional `Pacing`, `Target`, `Cue` headers. Export builds strip `### Speaker Notes`; a drift banner flags a stale export. Sidebar gets a "Present" link.

**Why:** Deliver the presenter-mode PRD (`docs/modules/presenter-module-prd.md`) so decks can be rehearsed and presented without leaking notes.

**Review fix:** the notes stripper stopped at `####` headings while the parser does not, which could leave notes text in an export. It now uses the parser's boundary (`#`–`###`); test added.

**Verified:** build, 163 tests, typecheck, lint, build:check, validate, smoke (incl. notes-sentinel check on the HTML export).

**Not verified (manual checklist):**
- Real second display placement on Chrome; Safari/Firefox fallback window + hint.
- Clicker / keyboard presenter remotes.
- Animation sync between presenter and audience windows.
- Running `validate` before `present` is not enforced.
- Pre-built generated-source slides are not stripped (out of scope).
- Registry-backed clean install of 1.3.0 still unverified.
