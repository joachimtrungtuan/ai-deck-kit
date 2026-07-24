# AI Deck Kit — Codebase Summary

**Generated:** 2026-07-23  
**Source:** `repomix-output.xml` (Repomix v1.17.0)

## Current Shape

AI Deck Kit is a single-package, agent-native presentation toolkit. The root package exposes the `ai-deck-kit` installer and `aideck` binary. The `engine/` tree contains the deterministic CLI, preview/export runtime, primitives, skills, and shipped templates. User decks and user-authored templates are separate workspace data roots.

```text
AI Presentation/
├── package.json                 # root distribution package and binaries
├── bin/                         # installer entrypoint
├── engine/
│   ├── cli/                     # aideck commands and workspace resolution
│   ├── primitives/              # shared blocks, motion, and tokens
│   ├── preview-app/             # shared React preview/export runtime
│   ├── skills/                  # crafting, validation, and export skills
│   ├── templates/               # swiss-modern and linear-dark presets
│   └── engine.version.json      # engine compatibility/version record
├── scripts/                     # lint, validation, and CI smoke orchestration
├── .github/workflows/           # CI and tagged release workflow definitions
├── docs/                        # product, architecture, module, and deployment docs
└── plans/                       # implementation plans and reports
```

## Runtime Flow

1. The installer copies the pinned engine into the project root or a selected subfolder and writes `ai-deck-kit.json`.
2. `aideck` walks upward to resolve that pointer and operates on the selected `decks/` root.
3. `aideck new` creates a `.deck` bundle from a shipped template; validation resolves nested engine roots.
4. The shared preview runtime renders decks and exports standalone HTML or raster PDF.
5. `aideck upgrade` replaces only the resolved engine tree and verifies deck-tree preservation.

## Verification Snapshot

The Phase 07/08 implementation has local evidence for lint, TypeScript typecheck, template validation, source-fixture smoke coverage, HTML/PDF export, VIVIMOON validation, and `npm pack --dry-run`. The repository also defines GitHub Actions for CI and tagged release packaging.

The local registry-backed clean-install check was not completed because npm DNS resolution returned `ENOTFOUND`. No remote release publication is represented as completed in this summary.

## Maintenance Notes

- Keep `engine/` behavior and the root installer contract synchronized.
- Treat `ai-deck-kit.json`, `engine.version.json`, deck schema/catalog versions, and template manifests as compatibility boundaries.
- Update module PRDs when a CLI surface or ownership boundary changes.
- Keep release and clean-install claims tied to observed workflow runs, not workflow definitions alone.
