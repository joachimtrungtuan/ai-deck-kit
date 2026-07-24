# AI Deck Kit — Product Definition & Requirements (PDR)

**Status:** Phase 08 implementation complete (distribution, upgrade, template migration, and local QA completed 2026-07-23; remote release and registry-backed clean install remain unverified)
**Supersedes:** the enclosed React-only "AI Presentation" workspace model.

## 1. Vision

**AI Deck Kit** is a portable, agent-native toolkit for building beautiful browser presentations. It installs into any project on any machine with one command, then the AI agent (Claude Code, Codex, etc.) is the runtime. A deterministic CLI owns all repeatable/boilerplate work; agent skills own the creative content work. Users create and edit decks and templates by prompting the agent or by running the same CLI commands directly.

**One line:** More control than Gamma, less weight than PowerPoint — decks as portable, git-friendly source that an AI agent authors and a small CLI scaffolds, serves, and exports.

## 2. Why (problems with the old model)

- **Enclosed structure** — logic and user content tangled in one fixed folder tree; can't scale or reuse.
- **Not portable/shareable** — cannot drop into another project or hand to another user cleanly.
- **No dedicated deck artifact** — content lived as a loose `.slides.md`; no self-contained, shareable unit.
- **No repeatable scaffolding** — every new deck/template started from scratch via AI, wasting the agent on boilerplate.
- **No update path** — no separation between upgradable engine and user working files.

## 3. Goals

1. **Install anywhere** — the root package exposes an `npx github:<owner>/ai-deck-kit init` installer that sets up the workspace.
2. **Agent-native runtime** — no standalone server app; the agent drives the toolkit through skills + CLI.
3. **Deterministic core** — repeatable operations (new deck, new template, serve, export, package, validate) are CLI commands, callable by user or agent.
4. **Portable deck artifact** — the `.deck` folder bundle is self-contained (content + manifest + assets), git-diffable and zippable for sharing.
5. **Hard engine/working-files split** — engine is version-pinned and upgradable without touching user decks.
6. **Keep control & flexibility** — reuse the existing custom React preview/export runtime; template system stays code-owned.
7. **Multi-user, multi-machine** — same experience for other users on other machines.

## 4. Non-Goals

- Not a WYSIWYG editor like Google Slides / PowerPoint (agent-edits-source + read-only browser preview is the model).
- Not a hosted SaaS, database app, or account system.
- Not a multi-provider LLM abstraction — the host agent *is* the model layer.
- Not (initially) a native `.pptx` editor; PPTX export is a future consideration, not a v1 requirement.

## 5. Primary Users & Flows

- **Deck author (via agent):** prompts Claude → agent runs `aideck new` to scaffold a `.deck`, authors `content.md`, previews, exports.
- **Deck author (via CLI):** runs `aideck new my-talk --template swiss-modern`, edits content, `aideck serve`, `aideck export`.
- **Template author:** `aideck template new <name>` scaffolds a template set; agent designs the design system + layouts; `aideck template register`.
- **Sharer/recipient:** receives a `.deck` bundle (or zip), runs the toolkit, previews/exports without touching engine internals.

## 6. Product Naming

- Product: **AI Deck Kit**
- npm package: `ai-deck-kit` (scope TBD)
- CLI binary: `aideck` (confirmed; Phase 04 command surface implemented)
- Deck artifact: `*.deck` folder bundle

## 7. Scope Boundaries for This Restructure

In scope: workspace restructure (engine/decks split), `.deck` format, Node/TS CLI core, skill-bundle rework, generation (outline-first), reuse of preview/export runtime, `.deck` zip sharing, installer + update mechanism, docs.

Deferred: PPTX export, local WYSIWYG web editor, audience-interactive on-slide elements, cloud sharing/hosting.

## 8. Success Criteria

- A fresh machine can use the GitHub-source installer (`npx github:<owner>/ai-deck-kit init`) and produce a previewed + exported deck without manual setup once registry access is available.
- Creating a new deck or template is a single deterministic command (no AI needed for boilerplate).
- A `.deck` bundle moves between projects/users and still previews + exports identically.
- Engine upgrade leaves all `decks/` untouched.
- Current-format decks plus `swiss-modern`/`linear-dark` templates export cleanly. VIVIMOON remains
  a read-only legacy reference, not a runtime compatibility target.

## 9. References

- Related specs: `system-architecture.md`, `deck-format-spec.md`, `development-roadmap.md`.
- Landscape references: Slidev (closest philosophy — Markdown + components, git-friendly, CLI), reveal.js/Marp/Pandoc (export patterns), allweonedev/presentation-ai (outline-first generation), presenton (folder + HTML/Tailwind templates), Gamma (control gap we intentionally close).

## Decisions (locked 2026-07-22)

- CLI binary: `aideck` (confirmed).
- Distribution: npx-from-GitHub, single package — no npm scope/registry needed.
- VIVIMOON test deck lives in gitignored `decks/`; CI generates its own deck via `aideck new` for the export smoke test.
