# AI Deck Kit Folder Structure

The root pointer resolves the installed engine and user deck roots. Keep authored deck data outside the engine.

```text
<project-root>/
├── ai-deck-kit.json
├── engine/                         # installed/upgradable runtime
│   ├── skills/
│   ├── templates/
│   └── preview-app/
├── decks/
│   └── {presentation-slug}.deck/
│       ├── deck.json               # CLI-owned structure
│       ├── content.md              # author/agent-owned content + annotations
│       ├── assets/
│       ├── template/               # pinned template snapshot
│       └── .build/                 # generated, disposable source/export
└── templates/
    └── {template-name}.template/   # user-authored template before registration
```

## Rules

- `deck.json` owns slide order, IDs, types, template binding, and defaults. Change it through `aideck` commands.
- `content.md` is the one canonical authored file: copy, visual direction, speaker notes, design notes, review questions, and explicit override reasons.
- `assets/` stores deck-specific images, generated graphics, exported diagrams, and local media.
- `.build/` stores regenerated source and exports; never treat it as canonical input.
- Do not create per-template or per-deck app scaffolds. `engine/preview-app/` is the one shared runtime.

## Naming

- Use kebab-case for folders and files.
- Use descriptive names that remain understandable through grep or file search.
- Do not place deck artifacts outside their `.deck` bundle.
