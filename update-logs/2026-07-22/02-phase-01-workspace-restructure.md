# Phase 01: Workspace Restructure

**What changed:**
- Split the workspace into two roots per `docs/system-architecture.md` §2: `engine/` (upgradable, ships with the toolkit) and `decks/` + root-level `templates/` (gitignored user data).
- `git mv skill-engineering → engine/skills`, `presentation/templates → engine/templates`, `presentation/preview-app → engine/preview-app`, `presentation/working-files/vivimoon-website → decks/vivimoon-website.deck` (kept tracked history via `git mv`; untracked `decks/vivimoon-website.deck` from git afterward per the plan's "gitignored user deck" intent, keeping it on disk).
- Added `ai-deck-kit.json` root pointer (`engineRoot`, `decksRoot`, `engineVersion`) and `engine/engine.version.json` (engine version + supported content/catalog/template ranges).
- Added `engine/README.md` documenting the engine layout and the external user-data roots.
- Updated `.gitignore`: `/decks/`, `/templates/`, `**/.build/`.
- Fixed path-resolution code for the new directory depths: `engine/vite.config.ts` (dev-server `fs.allow` now includes the project root so `decks/` imports resolve), `engine/vite.export.config.ts` (export outDir → `decks/<slug>.deck/export/`), `engine/preview-app/src/{deck-registry.tsx,main.tsx}`, and both `engine/skills/presentation-crafting/scripts/{export-standalone-html.mjs,export-pdf.mjs}`.
- Batch-updated stale path references across 8 skill reference/SKILL markdown files (`presentation/working-files/` → `decks/`, `skill-engineering/` → `engine/skills/`, `presentation/preview-app` → `engine/preview-app`, `presentation/templates` → `engine/templates`).
- Updated `CLAUDE.md` and `AGENTS.md` in lockstep: transition banner now states Phase 01 is done, structure tree reflects post-Phase-01 layout, skill-read paths and content-file/preview-runtime path rules updated.

**Why:** first step of the 8-phase AI Deck Kit restructure — separates the upgradable engine from user decks/templates so `aideck upgrade` can replace the engine wholesale without touching user data.

**Verification (regression check per phase success criteria):**
- `npm install` in `engine/` (dependencies had been deleted mid-move; regenerated cleanly, 0 vulnerabilities).
- Found and fixed a real stale import missed by the markdown-only batch substitution: `decks/vivimoon-website.deck/source/vivimoon-website-deck.tsx` still imported `../../../templates/linear-dark/layouts/react` (now the empty user-templates root) instead of `../../../engine/templates/linear-dark/layouts/react`. Caught via a live dev-server 500 error, not a static grep.
- Dev server (`vite`) serves the VIVIMOON deck cleanly from `decks/vivimoon-website.deck/` after the fix (verified via direct HTTP fetch of the transformed module graph, including the cross-root `/@fs/...decks/...` import).
- `export-standalone-html.mjs --deck vivimoon-website` → builds `decks/vivimoon-website.deck/export/index.html` (1.5 MB, 4614 modules transformed).
- `export-pdf.mjs --slug vivimoon-website` → produces `decks/vivimoon-website.deck/export/vivimoon-website.pdf` (12 slides, ~1.1 MB).

**Follow-ups:**
- None outstanding for Phase 01. Proceeding to Phase 02 (`.deck` manifest format).
