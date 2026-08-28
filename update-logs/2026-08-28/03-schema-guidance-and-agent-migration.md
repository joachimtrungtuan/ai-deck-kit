# Schema guidance and agent-led migration

## What changed

- Added engine, template, and deck-local schema guidance, including scaffold
  support for new decks and templates.
- Added the explicit `content-schema-migration` skill and its fidelity
  checklist; `aideck upgrade` remains engine-only and never rewrites content.
- Documented legacy render precedence: migration follows the v1 parser and
  template output rather than assuming similarly named YAML fields were active.
- Strengthened the icon contract: explicit Phosphor names must render as their
  declared glyph, not a curated fallback or placeholder.
- Added focused scaffold and compatibility tests and bumped the shipped
  templates after adding their local guidance files.
- Made `deck retemplate` refuse schema-major mismatches in both directions, so
  v2 content cannot be paired with a v1 template snapshot either.

## Why

Schema rules were spread across runtime code and loose documentation. Agents
could select dormant legacy fields, migrate the wrong visible copy, or accept a
valid icon name even when a template silently rendered another glyph.

## Follow-ups

- Visual approval for the disposable Claude lesson v1/v2 comparison was
  received. The comparison workspace, temporary skill package, copied test
  deck, and accumulated browser-test artifacts were removed.
- Remote publication and a registry-backed clean install remain separate
  release proof.
