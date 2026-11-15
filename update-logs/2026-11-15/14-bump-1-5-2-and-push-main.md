# Bump to 1.5.2 and push main

## What changed
- Version bumped 1.5.1 → 1.5.2 in lockstep: `package.json`, `engine/package.json`, `engine/package-lock.json`, `engine/engine.version.json`, `ai-deck-kit.json`. `contentSchemaVersion` unchanged.
- `docs/project-changelog.md`: `## 1.5.2 — 2026-11-15` entry covering the commits since the 1.5.1 bump:
  - 0f0a79e: slide iframe clones body stylesheets (HTML exports unstyled since 1.5.0, log 12).
  - 75502b1: vite / storybook security updates (log 12).
  - 8e496e0: export toolbar picker no longer squeezed into 32px (log 13).
- Pushed `main` with `--no-follow-tags`. No tag and no GitHub release were created.

## Why
Three user-facing fixes landed after 1.5.1. Per the release rule, every version that reaches `main` should get a tagged release. The user asked only to bump and push.

## Follow-ups
- Tag `v1.5.2` on the bump commit and push the tag after the user confirms. The Engine Release workflow then creates the release. Edit the notes afterwards with `gh release edit`.
- 1.5.2 supersedes the untagged 1.5.1. Decide whether 1.5.1 gets a tag of its own.
- Local tags `v1.4.0`, `v1.4.1` and `v1.5.0` have never been pushed. They still need a decision (log 11).
