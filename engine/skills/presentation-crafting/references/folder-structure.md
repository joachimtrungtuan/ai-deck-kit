# Folder Structure

All presentation artifacts live under `presentation/`.

```text
presentation/
├── templates/
│   ├── template-system.md
│   ├── slide-types-v1.md
│   └── {template-set-name}/
│       ├── template-manifest.json
│       ├── design-system.css
│       ├── animation-presets.css
│       ├── icon-policy.md
│       └── layouts/
├── preview-app/
│   ├── index.html
│   └── src/
└── working-files/
    └── {presentation-slug}/
        ├── content/
        │   └── {presentation-slug}.slides.md
        ├── source/
        ├── assets/
        └── export/
```

## Rules

- `templates/` stores reusable template systems, not one-off deck edits.
- `preview-app/` stores the single shared React preview runtime for templates and decks.
- `working-files/{presentation-slug}/content/` stores the source of truth for deck content and annotations.
- `source/` stores React or static source code generated from the content file.
- `assets/` stores deck-specific images, generated graphics, exported diagrams, and local media.
- `export/` stores browser-ready output.
- Do not create per-template or per-deck app scaffolds. Add preview entries to the shared runtime.

## Naming

- Use kebab-case for folders and files.
- Use descriptive names that remain understandable through grep or file search.
- Do not place deck files outside `presentation/`.
