# Workspace Boundary

Which files you may write, which you may not, and what to do when a task seems to need the
forbidden ones. Canonical for both presentation skills.

## Two workspace modes

| Mode | What it is | Is `engine/` writable? |
|------|------------|------------------------|
| **Consumer project** | Any project that ran `aideck init`. The overwhelmingly common case. | **No.** |
| **Kit repository** | AI Deck Kit's own repository — the engine's development home. | Yes; editing the engine *is* the work there. |

Telling them apart, without guessing: in a consumer project `engine/` is **gitignored**
(`aideck init` adds it) and `ai-deck-kit.json` points at it. In the kit repository `engine/`
is tracked in git and its `CLAUDE.md` describes building the kit itself. If `git check-ignore
engine` says the directory is ignored, you are in a consumer project and `engine/` is
read-only.

Assume consumer mode when unsure. Being wrong in that direction costs one question; being
wrong the other way destroys work.

## Ownership

```text
consumer project/
├── ai-deck-kit.json                  CLI-owned pointer. Do not hand-edit.
├── engine/**                         READ-ONLY. Replaced wholesale on upgrade.
├── templates/{name}.template/**      template work goes here, and only here
└── decks/{slug}.deck/
    ├── content.md, assets/           agent-owned — this is where deck work happens
    └── deck.json, template/, .build/ CLI-owned — change through `aideck` commands
```

Read `engine/` freely: catalogs, shipped templates, primitives, and the preview runtime are
all reference material. Copy from it. Never write into it.

## Why writing to `engine/` is worse than it looks

`aideck upgrade` replaces the whole engine tree — no merge, no backup, no prompt naming your
file. And because `init` gitignores the directory, `git status` will never show the edit. So
an engine edit is invisible while it exists and gone without warning afterwards. `aideck
verify` reports engine drift, which is the only place it surfaces.

## Check your own work

Run `aideck verify` when you finish an editing pass, before you report back. It is read-only
and fast, and it names what a reader of the workspace cannot see for themselves: an edited
engine, a template edited inside a deck's frozen `template/` copy, a layout that no longer
parses, a deck whose content fails validation, a file left loose beside the bundles. In a
project wired for Claude Code this also runs automatically as a `Stop` hook — a non-zero
result comes back as work to finish, not as advice.

## When a task appears to need an engine change

**Stop. Report what is missing. Escalate to the kit's own repository.** Do not work around it,
and do not edit the engine "just to see it render" — that is how the file gets forgotten.

The cases that used to require an engine edit, and their supported route now:

| Need | Supported route |
|------|-----------------|
| Preview fixtures for a new layout | `preview-props.json` in the template bundle; shallow-merged over the engine defaults, per template. |
| A typeface | Declare it in the manifest's `fonts` array. The catalog is `engine/cli/lib/font-catalog.ts` — read it to see what is available. |
| A family the font catalog lacks | Escalate. Adding one costs an npm dependency in the engine, so it is kit work released through `aideck upgrade`. |
| A new slide-type catalog version | Escalate. A catalog needs both `engine/templates/slide-types-v(N+1).md` and a `supportedSlideTypeCatalogs` entry in `engine.version.json`; a catalog written anywhere else is rejected by `aideck doctor`. |
| A preview or export runtime capability | Escalate. Record the deck-side need in the deck's `content.md` first, so the request carries its motivating case. |

An escalation report names: the template or deck, the exact capability missing, what you
tried, and the smallest engine change that would unblock it. That report is the deliverable —
finish the rest of the task around the gap rather than stopping the whole job.

## In the kit repository

None of the above restricts you. The engine is the product; edit it, and keep this file, both
`SKILL.md` boundary blocks, and `docs/system-architecture.md` in step when the boundary moves.
