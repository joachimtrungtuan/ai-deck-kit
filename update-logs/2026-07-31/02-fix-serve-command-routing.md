# Fix serve command routing

## What changed

- Normalized `serve` arguments so bare deck slugs, `deck <slug>`, `template <name>`,
  and the existing flag forms route to the intended preview target.
- Added explicit errors for ambiguous, conflicting, missing, and unknown arguments.
- Preserved browser auto-open by default and `--no-open` for automation.
- Added a narrow compatibility resolver for legacy generated deck imports that still
  reference an installed template without its `.template` suffix.
- Expanded direct template previews from base slide types to every declared layout
  variant, while preserving one-slide-per-type behavior for templates without variants.
- Added regression coverage and updated the public command documentation.

## Why

Positional deck commands were ignored and silently opened the template gallery.
VIVIMOON's generated source then failed to load its installed template after the
template-directory suffix migration, making browser auto-open appear broken.

## Follow-ups

- None.
