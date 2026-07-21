# AI Deck Kit Modules

Each module owns a distinct surface (CLI, skill, runtime) and coordinates via dependency graph. Every module has a PRD (Product Requirements Document) following the shared template in `module-prd-template.md`.

## Module Index

| Module | Surface | Purpose | PRD |
|--------|---------|---------|-----|
| **Core Orchestration** | CLI, Skill | Workspace resolution, init/upgrade/doctor/config/list. Entry point for all operations. | [core-orchestration-module-prd.md](./core-orchestration-module-prd.md) |
| **Design Primitives** | CLI, Skill, Runtime | Shared blocks (text, chart, table, etc.), motion vocabulary, base token contract. Foundation for all templates. | [design-primitives-module-prd.md](./design-primitives-module-prd.md) |
| **Presentation** | CLI, Skill | Deck/slide lifecycle: new, add/remove/move slides, animations, sync deck.json ↔ content.md. | [presentation-module-prd.md](./presentation-module-prd.md) |
| **Template Management** | CLI, Skill | Author/register template sets. Compose primitives, define slide-type layouts, manage versions. | [template-management-module-prd.md](./template-management-module-prd.md) |
| **Generation** | CLI, Skill | Outline-first deck creation: scaffold structure, agent fills content. Reduces hallucination. | [generation-module-prd.md](./generation-module-prd.md) |
| **Export & Package** | CLI, Runtime | Export to HTML (self-contained), PDF, or zip archive. Uses existing React/export runtime. | [export-package-module-prd.md](./export-package-module-prd.md) |
| **Preview** | CLI, Runtime | Shared React preview app. Serves any .deck via manifest resolver. Read-only review, morph transitions at runtime. | [preview-module-prd.md](./preview-module-prd.md) |
| **Annotation** | CLI | Reuse existing in-content annotations (Speaker Notes, Design Notes, Review Questions). Validation only. | [annotation-module-prd.md](./annotation-module-prd.md) |
| **Distribution & CI/CD** | CLI | Install via `npx`, upgrade engine only, run CI pipeline (lint/typecheck/smoke tests), publish releases. | [distribution-cicd-module-prd.md](./distribution-cicd-module-prd.md) |

## Adding a New Module

To add a future module:

1. Copy `module-prd-template.md` to a new file (kebab-case name).
2. Fill in all 9 sections: Purpose, Responsibilities, Surfaces, Inputs & Outputs, Files & Data Touched, Dependencies, Success Criteria, Risks & Mitigations, Open Questions.
3. Set `depends_on: [...]` in frontmatter to declare dependencies on other modules.
4. Add row to this index table.
5. Ensure CLI ↔ skill contract is clear (CLI for deterministic; skill for creative).

## Dependency Graph

Modules depend on (→ means "depends on"):

```
generation         → presentation, template-management
export-package     → presentation, preview
annotation         → presentation
presentation       → core-orchestration, design-primitives
template-management → design-primitives
preview            → design-primitives
core-orchestration (no deps, root)
design-primitives  (no deps, foundation)
distribution-cicd  (no deps, installer)
```

## References

- `module-prd-template.md` — template structure (frontmatter + 9 sections).
- `system-architecture.md` — two-root model, module surfaces, versioning.
- `deck-format-spec.md` — .deck bundle, .template bundles, field ownership.
- `project-overview-pdr.md` — vision, scope, non-goals.
