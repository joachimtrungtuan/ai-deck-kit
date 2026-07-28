# Preview Runtime

Use one shared React preview runtime for the whole project:

```text
engine/preview-app/
```

## Purpose

Use the shared runtime to review:

- reusable template sets
- slide layout support
- generated presentation source
- text fit, responsive framing, icon consistency, animation pacing, and asset rendering

## Rules

- Do not create one React app per template.
- Do not create one React app per presentation.
- Keep reusable template code under `engine/templates/`.
- Keep generated deck-specific source under `decks/{presentation-slug}.deck/.build/source/`; it is never canonical input.
- Use a targeted CLI preview for a deck or template; reserve static preview entries for the curated installed-template gallery.
- Run the shared runtime through `aideck serve`; the CLI resolves the workspace from `ai-deck-kit.json`.

## Review Flow

1. Run `aideck serve --deck <slug>` or `aideck serve --template <name>` from the workspace. The browser opens automatically; use `--no-open` for automation.
2. For template authoring, the resolver prefers `templates/<name>.template/` and otherwise uses `engine/templates/<name>.template/`. Bare `aideck serve` remains the curated installed-template gallery.
3. Review all relevant slide types or deck slides in browser.
4. Fix template/source issues at their source.
5. Run structural validators again before export.
