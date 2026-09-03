# Diagram Authoring (Diagram IR v1)

Author diagrams as a typed IR, render them into the slide's own `override`, and
keep motion inherited from the template. The engine-side contract is
`engine/primitives/diagrams/diagram-ir-v1.md`; this file is the deck-work flow.

## When a diagram is warranted

Reach for a diagram only when the slide's message is a **relationship between
parts** — flow, topology, custody, dependency — that prose or a bullet list
would force the reader to reconstruct in their head. Sequence steps,
comparisons, and single concepts stay on ordinary slide types. One static
diagram per slide; the slide type is `diagram` from the active catalog.

## Author the IR

1. Create `{slug}.deck/assets/diagrams/<name>.json` (kebab-case name, e.g.
   `station-network.json`). Nodes 2–10, grid-placed by `col`/`row`, edges by
   node id. Vocabulary, enums, and limits: the schema
   `engine/primitives/diagrams/diagram-ir-v1.schema.json`.
2. Validate: `node <skill-dir>/scripts/validate-diagram-ir.mjs <file>` (or run
   it on the whole folder). Fix every error before rendering — the renderer
   also refuses an invalid IR.

## Render into the slide

1. Pick the slide's `animation` first (element animation catalog v1; `morph` is
   not allowed). The diagram should move like the rest of the deck, so pass the
   same name to the renderer.
2. Render:

   ```text
   node <skill-dir>/scripts/render-diagram.mjs \
     --ir decks/<slug>.deck/assets/diagrams/<name>.json \
     --animation <same-name>
   ```

   stdout is a ready `override:` YAML block. Paste it as the last key of that
   slide's metadata fence in `content.md`, replacing any existing `override:`.
   Add the slide entry to `deck.json` via `aideck slide` (never hand-edit the
   manifest).
3. Validate the deck (`aideck validate <slug>`). The deck validator checks the
   generator marker against the IR: a hand-tampered override or a stale IR fails.

Rules the generated block already encodes — keep them if you ever must
regenerate by hand: `layout: "none"`, `animation: "none"`, a `reason` naming the
IR file, `css`/`html` as YAML literal blocks, no `<script`, no `</style`.

## Where output lives and how it travels

- Source of truth: `assets/diagrams/<name>.json` (edit this, re-render).
- Rendered output: inside the slide's own `override:` in `content.md` — never a
  shared stylesheet, never another slide's block.
- Diagram overrides obey the same promotion tripwire as every other override
  (`SKILL.md` → Override Promotion Tripwire): the same diagram pattern on 3+
  slides in one deck means the pattern belongs in the IR vocabulary or the
  template — propose that to the user; never promote it yourself.
- The renderer emits only `primitive-anim-*` classes; it has no per-template
  branch, and none may be added. The active template's `--deck-motion-*` and
  `--deck-*` design tokens are what make the diagram look native to it.
- On export, the whole `assets/` folder ships beside the HTML: whoever holds the
  export holds the IR and can re-render from it.
