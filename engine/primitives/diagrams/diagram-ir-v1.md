# Diagram IR v1

A typed intermediate representation for slide diagrams. The agent (or a human)
authors a small JSON graph; `render-diagram.mjs` turns it into a single slide's
`override.html` + scoped `override.css`. The IR is the source of truth and lives
at `{slug}.deck/assets/diagrams/<name>.json`; the rendered override lives inside
that slide's own `override:` block in `content.md`. Both travel with the deck
and with its export — the export is regenerable from itself.

Normative schema: [`diagram-ir-v1.schema.json`](diagram-ir-v1.schema.json).
Provenance: the node/edge/group/layout-hint vocabulary is adapted from Archify's
typed IR specification (upstream commit recorded in the schema `$comment`).
Archify is a specification only — no Archify code ships here, and its renderer
is never used. Adopting an upstream change is a human decision made by reading
the diff against that SHA; there is no automatic update path.

## Vocabulary

| Field | Role |
| --- | --- |
| `irVersion` | Locked to `1`. |
| `meta` | `title` (required), `subtitle` — rendered as the slide's own heading inside the override. |
| `layout` | Grid hints only: `mode: "grid"`, `cols` (1–6), optional `cellW`/`cellH`/`gapX`/`gapY` in canvas px. |
| `nodes[]` | `id`, `label`, `sublabel?`, `kind?`, `col`, `row`, `emphasis?`. The 2–10 boxes the diagram is about. |
| `edges[]` | `from`, `to`, optional `id`, `label`, `variant`, `fromSide`, `toSide`. Direction is the rendering order from → to. |
| `groups[]` | `id`, `label`, `wraps[nodeIds]`, `kind?` (`region` \| `security-group`). A labelled container drawn behind its members. |

Borrowed enums stay aligned with Archify's shared vocabulary so a future
comparison is a name-for-name diff:

- `kind` (nodes): `frontend`, `backend`, `database`, `cloud`, `security`,
  `messagebus`, `external`. Purely a label/legend hint in v1; the renderer
  treats all kinds identically.
- `variant` (edges): `default`, `emphasis`, `security`, `dashed`.
- `fromSide`/`toSide`: `left`, `right`, `top`, `bottom`. When omitted, the
  renderer picks the facing sides from the node positions.

## Motion model — inherit plus diagram presets

The renderer emits **only** engine `primitive-anim-*` classes from the
[element animation catalog v1](../motion/element-animation-catalog-v1.md).
It never emits template-prefixed classes and never branches per template; the
same IR animates in the swiss-modern idiom under swiss-modern and the
linear-dark idiom under linear-dark purely through `--deck-motion-*` tokens.

- Nodes: `primitive-anim-<name>` per node, passed to the renderer via
  `--animation`. Authors pass the slide's own `animation` value — that is the
  "inherit" half. Default: `gentle-rise`. With `staggered-list` the class goes
  on the node container so the engine staggers its children.
- Edges: the diagram preset for connections. Solid edges get
  `primitive-anim-line-draw` (with `pathLength="1"`, per the catalog);
  `dashed`-variant edges get `primitive-anim-fade` instead, because a dash
  reveal and a dashed stroke fight each other. When the animation is `none`,
  edges carry no class.
- Groups and the heading block animate with the same name as their slide.
- `morph` is rejected in v1: it is cross-slide by contract and a diagram owns
  one slide.

## Limits (v1, on purpose)

- One static diagram per slide; grid placement only (`col`/`row`); no free
  coordinates, no absolute `pos`/`size`, no `viewBox` authoring — the renderer
  owns geometry on the fixed 1600×900 canvas.
- No sequence/lane/lifecycle semantics, no legend, no guided views, no
  repository evidence, no brand marks, no localized surfaces. These exist in
  Archify's broader IR; none are needed for a slide diagram. Extend later on
  evidence, not anticipation.
- No interactivity: overrides carry no script, and the overlay is
  pointer-transparent by design.
- Node kinds carry no color encoding in v1 — color comes only from template
  design tokens, which keeps the output identical across templates by contract.
- Labels wrap to two lines; a single word longer than a node's width, or a
  sublabel/title past its limit, can overflow its box. Keep authored copy short
  (the schema caps them: label 40, sublabel 60, title 80 chars).

## Handoff contract

- The generated `override:` block sets `layout: "none"`, `animation: "none"`, a
  `reason` naming the IR file, and the scoped `css`/`html` as YAML literal
  blocks. `override.layout`/`override.animation` document that the diagram
  supersedes the slide type's template layout; the diagram is the slide.
- Every generated CSS selector lives under the unique scope class
  `aideck-diagram--<name>-<hash>` on the diagram root, and every element `id`
  is suffixed with the same hash, so two diagram slides in one deck cannot
  affect each other. The hash is the first 8 hex chars of the IR file content
  — regenerating from the same IR is byte-stable.
- The slide's `type` still comes from the deck's slide-type catalog (use
  `diagram`); the catalog declares the slide's identity, the override carries
  its rendered content.
