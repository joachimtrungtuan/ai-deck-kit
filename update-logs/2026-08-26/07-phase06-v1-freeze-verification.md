# Phase 6 — v1 freeze verification (content.md schema redesign)

Plan: `plans/260826-1000-content-md-schema-redesign/`, phase 06.
Verification-only — no deck content written, no template edited.

## Method

The six clarity decks live outside this repo (`AI Udemy Course/…/slides/decks/`,
not git-tracked). Per instruction, they were **copied** into `decks/` as
write-protected read-only fixtures and every command ran against the copies;
originals were only ever read (checksummed before/after). Copies were deleted
afterwards.

## Results — all success criteria met

1. **Clean baseline**: repo git clean; checksums of all 7 original bundles
   recorded before any command.
2. **Parse/validate**: all 7 decks pass `aideck validate <slug>` (v1 parser
   path, exit 0). Workspace-wide `aideck verify` shows the expected permanent
   note for vivimoon (`template linear-dark is behind (1.2.0 → 2.0.0)`) —
   this is the intended steady state under revision 2, not drift. The six
   clarity copies show a `source template "clarity-courseware" no longer
   exists` note — **a copy artifact** (this repo doesn't ship that template);
   the course project's own install still has it. Single-deck validate (the
   parse/content gate) is the meaningful check and is green for all.
3. **Canary intact**: `vivimoon-website.deck/.build/source/vivimoon-website-deck.tsx.disabled`
   still `.disabled` — manifest-driven deck exercised the parser dispatch.
4. **Visual renders** (screenshots, since deleted with the fixtures):
   - vivimoon: title slide renders header titles (no "Untitled" leak);
     icon-grid slide 10 resolves all Phosphor glyphs.
   - claude-lesson-1-1 (list-heavy): title + content-text card list with icons
     render from `### On-Slide Text` bullets.
   - claude-lesson-2-2 (table-driven): table slide renders correct
     `tableColumns`/`tableRows` derivation.
5. **Retemplate guard**: `aideck deck retemplate vivimoon-website` refuses
   (v1 deck vs linear-dark 2.0.0), exit non-zero path, full explanation
   printed; bundle hash unchanged before/after (`13df319441f9`).
6. **Zero bundle mutation**: vivimoon hash identical across serve + retemplate;
   post-session scan found zero files under `decks/` modified after servers
   started. Originals: 6 of 7 byte-identical; see caveat.

## Caveat — external change to claude-lesson-1-5.deck (not ours)

During the verification window the **original** `claude-lesson-1-5.deck` in the
course project changed on its own timeline: `content.md` (06:56), a new asset
PNG (06:55), and `.build/export/index.html` regenerated. No command this
session wrote there (all ops hit copies; vivimoon's stable hash proves the
tooling is non-writing). Likely a concurrent session/user edit in the course
project. Consequence: the 1-5 validate/visual evidence covers the pre-change
content; the newly edited 1-5 has not been render-verified. Follow-up for the
course project owner: re-validate/re-preview lesson 1-5 after that edit.

## Expected-notes baseline (recorded so nobody "fixes" it)

- v1 deck + migrated source template → `template <name> is behind
  (<deckVer> → <srcVer>). Run "aideck deck retemplate …" when you are ready.`
  — permanent, expected. Do NOT retemplate a v1 deck; the phase-05 guard will
  refuse, and that refusal is the defence, not a bug.
- Copied-deck `source template no longer exists` — artifact of copying a deck
  out of the workspace that owns its template.

## Follow-ups

- Phase 07 (release cutover) remains.
- Course project: re-verify lesson 1-5 after the external edit noted above.
