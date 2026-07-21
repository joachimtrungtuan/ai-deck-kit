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
- Keep deck-specific source under `decks/{presentation-slug}.deck/source/`.
- Add or switch preview entries inside the shared preview app when a template or deck needs visual review.
- Run the shared runtime from `presentation/` with `npm run dev`.

## Review Flow

1. Add the template or deck preview entry to `engine/preview-app/src/`.
2. Run `cd presentation && npm run dev`.
3. Review all relevant slide types or deck slides in browser.
4. Fix template/source issues at their source.
5. Run structural validators again before export.
