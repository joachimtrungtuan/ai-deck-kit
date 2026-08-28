# AI Deck Kit Folder Structure

The root pointer resolves the installed engine and user deck roots. Keep authored deck data outside the engine.

```text
<project-root>/
├── ai-deck-kit.json
├── engine/                         # installed/upgradable runtime; replaced wholesale on upgrade
│   ├── skills/
│   ├── templates/                  # shipped defaults ONLY — read-only, never edited in place
│   └── preview-app/
├── decks/
│   └── {presentation-slug}.deck/
│       ├── deck.json               # CLI-owned structure
│       ├── content.md              # author/agent-owned content + annotations
│       ├── schema-guidance.md       # thin local schema/editing guardrails
│       ├── assets/
│       ├── template/               # pinned template snapshot
│       └── .build/                 # generated, disposable source/export
└── templates/
    └── {template-name}.template/   # every template the project authors or customizes
```

Templates live in one place. `templates/` is where authoring happens and where a template stays;
`engine/templates/` only holds the defaults the toolkit ships. A project template shadows a shipped
default of the same name everywhere the CLI resolves one.

## Rules

- `deck.json` owns slide order, IDs, types, template binding, and defaults. Change it through `aideck` commands.
- `content.md` is the one canonical authored file: copy, visual direction, speaker notes, design notes, review questions, and explicit override reasons.
- `schema-guidance.md` records the deck's schema/template boundary for agents;
  it does not replace `deck.json` or migrate content.
- `assets/` stores deck-specific images, generated graphics, exported diagrams, and local media.
- `template/` is the deck's frozen snapshot, taken at creation. It is what preview and export render, so editing the source template never disturbs an existing deck. Replace it only through `aideck deck retemplate`.
- `.build/` stores regenerated source and exports; never treat it as canonical input.
- Do not create per-template or per-deck app scaffolds. `engine/preview-app/` is the one shared runtime.

## Naming

- Use kebab-case for folders and files.
- Use descriptive names that remain understandable through grep or file search.
- Do not place deck artifacts outside their `.deck` bundle.
