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
- Keep authored templates under the project's `templates/`; `engine/templates/` holds only the shipped defaults.
- Keep generated deck-specific source under `decks/{presentation-slug}.deck/.build/source/`; it is never canonical input.
- Never name a template in runtime source. Everything the runtime renders arrives through `virtual:aideck-deck`, built from what the CLI resolved.
- Run the shared runtime through `aideck serve`; the CLI resolves the workspace from `ai-deck-kit.json`.
- In deck mode only, the right-hand Slide editor can explicitly save the active v2/v3 slide's YAML through the dev server. It never writes the inlined virtual-module content, does not run for template/gallery previews or exports, and leaves v1 decks disabled until migrated.

## Review Flow

1. Run `aideck serve --deck <slug>` or `aideck serve --template <name>` from the workspace. The browser opens automatically; use `--no-open` for automation.
2. Read the resolution line the CLI prints before Vite starts — deck path, or template name with its origin, version, and path. Confirm it is what you asked for. A deck reviews with its own frozen snapshot, not the live source template.
3. `templates/<name>.template/` wins over `engine/templates/<name>.template/`. Bare `aideck serve` opens a gallery built from every template the project can resolve.
4. Review all relevant slide types or deck slides in browser.
5. Fix template/source issues at their source.
6. Run structural validators again before export.
