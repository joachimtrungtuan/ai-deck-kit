# AGENTS.md

Guidance for AI agents (OpenCode, Codex, Gemini CLI, and others) working in this repository. **`CLAUDE.md` is the source of truth** — this file mirrors it with agent-neutral adaptations, and AI Deck Kit treats these agents as first-class runtimes. When updating one, update both. Differences from `CLAUDE.md` are only where a mechanism is Claude-specific: skills are invoked by READING their `SKILL.md` (no Skill tool or slash commands), and Claude Code hooks / `.claude/` wiring do not apply here.

## Project Overview

**AI Deck Kit** (evolving from "AI Presentation") is a **portable, agent-native presentation toolkit**. It installs into any project on any machine; the AI agent (Claude Code, Codex, …) is the runtime, a deterministic Node/TS CLI (`aideck`) owns repeatable/boilerplate work, agent skills own the creative content work, and decks are portable `.deck` folder bundles. It stays content-first: the agent edits source, the user reviews content + rendered output. This is **not** a Google Slides clone.

**Core principles:** consistency, flexibility, portability, user control.

> **Status (2026-07-28).** All eight migration phases are implemented: the two-root split, the `.deck` bundle format, the `aideck` CLI, the primitives layer, the shared preview/export runtime, and the installer. Tagged releases publish through GitHub Actions (see Releases); a registry-backed clean install remains unverified. Vision, architecture, and per-module PRDs live in `docs/`; read `docs/project-overview-pdr.md` + `docs/system-architecture.md` before structural work. **This repository develops the engine — decks and templates are authored in other projects that install the kit** (`npx github:joachimtrungtuan/ai-deck-kit init --here`; see `README.md`).

## Structure

> `engine/` is the upgradable engine root; `decks/` + project-root `templates/` are gitignored user data. `ai-deck-kit.json` is the root pointer. Each deck is a `{slug}.deck/` bundle holding `deck.json`, `content.md`, `assets/`, and a pinned `template/` snapshot.

```
AI Presentation/
├── ai-deck-kit.json                        ← Root pointer (engineRoot, decksRoot, engineVersion)
├── engine/                                 ← Upgradable engine root (ships with the toolkit)
│   ├── skills/                             ← Skills SOURCE OF TRUTH (symlinked into .claude/skills/
│   │   │                                      and .agents/skills/ — edit ONLY in engine/skills/)
│   │   ├── presentation-crafting/          ← Deck creation skill (content → slides)
│   │   └── presentation-template-creation/ ← Template-set authoring skill (catalogs, design systems, layouts)
│   ├── templates/                          ← Shipped, versioned *.template presets + catalog docs
│   │   ├── template-system.md              ← Master template-system rules
│   │   └── slide-types-v1.md               ← Versioned slide-type catalog
│   ├── preview-app/                        ← Single shared React preview + export runtime (Vite)
│   └── engine.version.json                 ← Pinned engine version + supported ranges
├── decks/                                  ← User data (gitignored): one {slug}.deck/ per deck
├── templates/                              ← User data (gitignored): user-authored .template bundles
├── update-logs/                            ← Dated change logs (see below)
├── plans/                                  ← Implementation plans & reports
└── docs/                                   ← Project documentation
```

## Way of Working (Presentation Crafting)

Before deck work (content → slides), READ `engine/skills/presentation-crafting/SKILL.md` and its `references/`. Before template-set or slide-type-catalog work, READ `engine/skills/presentation-template-creation/SKILL.md` and its `references/`. Follow them as the standard operating procedure — the two skills are deliberately non-overlapping; never improvise either flow. (Agent metadata in `presentation-crafting/agents/openai.yaml`; both skills symlinked under `.agents/skills/`.) Non-negotiable rules:

1. **One canonical Markdown content file per deck** (`decks/{slug}.deck/content.md`) — the source of truth for text, images, icons, speaker notes, and review annotations.
2. **One and only one template set per presentation.** Every slide derives from a declared slide type in the active slide-type catalog. No off-template improvisation.
3. **Templates are versioned** against the slide-types catalog version they implement, and live in exactly one place: the project's `templates/`. `engine/templates/` holds only the shipped defaults (read-only). **Bump `templateVersion` after every template edit** — patch/minor/major by scale of change; the CLI reads versions to detect drift but never bumps for you.
4. **Overrides (layout/animation) are an explicit, recorded edge case** — justified in the content file, never the default flow.
5. **Icons:** icon-font approach, Phosphor-first (see skill's `icon-policy.md`).
6. **Animations:** gentle, attention-holding, from the approved preset vocabulary only.
7. **One shared preview runtime** (`engine/preview-app/`) — never scaffold per-template or per-deck apps.
8. **Validate before handoff:** decks with `presentation-crafting/scripts/validate-slide-content.mjs`; templates with `presentation-template-creation/scripts/validate-template-manifest.mjs`.
9. **The engine is off limits in installed projects — but not here.** In a project that installed the kit, `engine/**` is read-only: upgrade replaces it whole. Everything a design needs lives in its bundle (layouts, CSS, icon policy, `preview-props.json`, manifest `fonts`); everything a presentation needs lives in its `.deck`. This repository is where the engine is authored, so edits here are the work — but when adding a capability, ask where a *consumer* would put it, and if the honest answer is "in the engine", the design is wrong. See `docs/system-architecture.md` → "Write boundary".

## Karpathy Coding Guidelines

Apply these behavioral guidelines whenever writing, reviewing, or refactoring code (Claude Code loads them as the `karpathy-guidelines` skill; other agents follow this summary):

- **Don't overcomplicate** — write the simplest code that solves the actual problem; no speculative abstraction.
- **Surgical changes** — touch only what the task requires; preserve surrounding style and structure.
- **Surface assumptions** — state them explicitly instead of silently guessing.
- **Verifiable success criteria** — define how the change will be checked before writing it, then verify.

## Token Discipline (non-negotiable)

Context is scarce; flooding it makes you thrash. Spend deliberately.

- **Bounded search.** Cap search-tool output at ~50 matches; more → refine scope/pattern, don't read further.
- **Bounded reads.** Small files whole; large files in ~100-line windows targeting the range you need. **Never re-read a file already in context.**
- **Lint/compile after every edit** — fix a syntax error before anything else.
- **Your default: no subagent.** As the non-Claude agent reading this file, keep work in your main context. Do not delegate merely because a task is broad, touches many files, or could finish faster in parallel. Time and speed are lower priorities than wise token use.
- **Exception: genuine context efficiency.** Spawn a subagent only when it is extremely necessary to protect the main context from a large mechanical sweep, isolate a clearly bounded specialist task, or avoid a demonstrably larger token cost in the main run. First narrow searches and reads; if those are sufficient, do the work directly. Root-cause analysis, design, integration, edits, and decisions stay with the main agent.
- **Cheapest adequate sub-run for other agents.** If you exceptionally need a subagent, configure low reasoning and use the lowest suitable model tier available to your agenting tool, such as GPT-5.6 Luna. Give it a narrow prompt and require only a distilled brief (paths, line ranges, facts). Do not spend high-tier reasoning on mechanical reconnaissance.
- **Subagents run one at a time.** Never run them concurrently unless the user explicitly requests concurrency and it is genuinely necessary. This overrides any general parallel-work guidance.
- **Right-size the ceremony, never skip it.** Plan → implement → test → review, update-log entries, and docs sync stay mandatory; what scales is their depth.

## Coding Rules

Full rules: `.claude/rules/development-rules.md`. The ones that bite hardest:

- **Minimum code that solves the actual problem** — no speculative features or single-use abstractions (YAGNI/KISS/DRY).
- **Surgical changes** — every changed line traces to the request; don't refactor adjacent code; match existing style.
- **One concern per file**, ~200-line soft cap; split when either trips. Long descriptive kebab-case filenames (respect language conventions).
- **Think before coding** — state assumptions; multiple interpretations → present them; unclear → stop and ask.
- **Never hide or weaken a failing check** (lint, typecheck, build, test) to make it pass.

## Releases (required)

Every kit version that reaches `main` gets a tagged GitHub release — don't let version bumps pile up unreleased. Releases are cut from `main` only.

1. **Land the work on `main`** — `git merge --no-ff <branch> -m "merge: <feature>"` (or a merged PR), after `npm test`, `npm run build:check`, `npm run lint`, `npm run typecheck` and `npm run validate` pass.
2. **Version in lockstep** (semver; `chore(release): bump …` commit): `package.json`, `engine/package.json` (+ `engine/package-lock.json`), `engine/engine.version.json` `engineVersion`, `ai-deck-kit.json`. A `contentSchemaVersion` bump also touches `engine/cli/lib/templates.ts` (+ rebuilt `dist/`) and its test — grep the old value to find every copy.
3. **Changelog** — a `## X.Y.Z — YYYY-MM-DD` entry in `docs/project-changelog.md` covering everything since the previous tag.
4. **Tag** — annotated, on the `main` commit: `git tag -a vX.Y.Z -m "vX.Y.Z — <one-line summary>"`. Push `main` first, then the tag.
5. **Let the `Engine Release` workflow create the release.** The tag push runs `.github/workflows/engine-release.yml`, which validates, packs, and creates the release with `ai-deck-kit-X.Y.Z.tgz` + `engine.version.json` attached. **Never `gh release create` by hand** — it races the workflow, which then fails on "release already exists" and the assets never attach (this happened to v1.0.2).
6. **Then write the notes** — once the run succeeds: `gh release edit vX.Y.Z --title "vX.Y.Z — <summary>" --notes-file <file>`. Notes address the installing user: `### Added` / `### Changed` / `### Fixed` / `### Docs` / `### Upgrading` as applicable (bold lead sentence per bullet, then the why), ending with `**Full changelog:** https://github.com/joachimtrungtuan/ai-deck-kit/compare/vPREV...vX.Y.Z`.
7. **Log it** in `update-logs/` (version, tag commit, workflow run result).

## Update Logs (required)

All non-trivial changes to this workspace must be logged in `update-logs/`. Each date gets its own subfolder (`YYYY-MM-DD/`). Log files are numbered incrementally with a short slug for chronological sorting:

```
update-logs/
  2026-05-21/
    01-install-vibework-mcp.md
    02-scaffold-claude-md.md
```

Each log briefly answers: **what changed, why, any follow-ups**. Trivial edits (typos, formatting) do not need a log.

### End-Of-Session Note (required on explicit user signal)

When the user explicitly ends the session ("end session", "wrap up", "stop here", "end this session for today", or equivalent), create a handoff log in the same dated folder named `NN-end-of-session-<slug>.md` where `NN` is the next sequential number. Do NOT auto-trigger from context limits, idle time, or inference — user must say so.

Purpose: a fresh agent (new session or different model) reads only this file and knows what was done, what remains, and where to resume — without re-reading the full conversation or redoing completed items.

Required sections:

1. **Session goal** — original user request that opened the session.
2. **Completed (DONE)** — items finished, with file paths + one-line purpose. Mark unambiguously DONE so the next agent skips them.
3. **In-progress** — work started but not finished, with current state + next concrete step.
4. **Key decisions** — scope, stack, or design choices made + reason.
5. **Files touched** — created / modified / deleted, with one-line purpose each.
6. **Unresolved questions or blockers** — items needing user input or external resolution.
7. **Pickup pointer** — recommended first action for the next session (file to open, command to run, question to ask).

Cross-reference the session's regular numbered update logs rather than restating them — the end-of-session note is an index and handoff, not a duplicate. If the session had no material changes, write a one-line note: `No material changes; nothing to hand off.`

### Session Start Protocol

At the start of every new session, before acting on the user's request:

1. Scan `update-logs/` for the most recent `*-end-of-session-*.md` (latest dated folder first, then highest `NN` within it). Read it if found.
2. From that note, internalize the **Completed (DONE)** list (skip these), **In-progress**, **Unresolved questions / blockers**, and **Pickup pointer**.
3. Surface a one-line orientation to the user, e.g. *"Last session ended <date> with pickup pointer: <X>. Continue there, or different focus?"* — do NOT silently auto-execute the pickup pointer.
4. If the user's opening request is unrelated, acknowledge prior context exists and follow the new request — the note is context, not a directive.
5. If no end-of-session note exists, or the read fails, proceed normally and mention it once.

Read the end-of-session note **once per session**, not on every task. Do not preload other numbered update logs — fetch them only when a specific item demands it.

## Development Principles

- **YAGNI** — You Aren't Gonna Need It; avoid over-engineering.
- **KISS** — Keep It Simple, Stupid; prefer simple solutions.
- **DRY** — Don't Repeat Yourself; eliminate duplication.

**IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
**IMPORTANT:** In reports, list any unresolved questions at the end, if any.

**IMPORTANT:** *MUST READ* and *MUST COMPLY* all *INSTRUCTIONS* in project `./CLAUDE.md` (source of truth) and this `AGENTS.md`, especially the *WAY OF WORKING* section — *MANDATORY. NON-NEGOTIABLE. NO EXCEPTIONS. MUST REMEMBER AT ALL TIMES!!!*
