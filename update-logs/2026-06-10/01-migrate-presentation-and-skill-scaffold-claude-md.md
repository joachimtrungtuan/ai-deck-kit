# 01 — Migrate presentation workspace + skill, scaffold CLAUDE.md/AGENTS.md

## What changed

- Copied `presentation/` (templates incl. swiss-modern, shared preview-app, working-files, Vite/TS config) from `../Web Design Course Curriculum Enhancement/presentation/` → `./presentation/` (excluded `node_modules`; run `npm install` inside `presentation/` before previewing).
- Copied `presentation-crafting` skill from old workspace → `./skill-engineering/presentation-crafting/` (SOURCE OF TRUTH per user decision).
- Symlinked skill into `.claude/skills/presentation-crafting` and `.agents/skills/presentation-crafting`.
- Updated SKILL.md validation-script paths to `skill-engineering/presentation-crafting/scripts/...`.
- Replaced ClaudeKit boilerplate `CLAUDE.md`/`AGENTS.md` with project-specific versions (107/105 lines): project overview, structure, presentation-crafting way of working, karpathy guidelines, update-log + end-of-session + session-start protocols. CLAUDE.md = source of truth, AGENTS.md = agent-neutral mirror.
- Verified: skill registered in skills catalog; `validate-template-manifest.mjs` passes on swiss-modern manifest.

## Why

Project repurposed as standalone presentation-generation workspace; assets previously lived inside the Web Design Course workspace.

## Follow-ups

- Originals left untouched in old workspace — delete after user verifies migration.
- `npm install` in `presentation/` not yet run.
- Old workspace's root `package.json` for presentation copied as `presentation/package.json` — confirm deps still resolve.
