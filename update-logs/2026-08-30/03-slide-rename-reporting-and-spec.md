# Slide commands report post-rename ids; spec and skill record the position-derived id contract

**What changed.** Three review follow-ups on the cascading slide-id rename (see `01-slide-move-cascading-id-rename.md`):

1. `engine/cli/commands/presentation.ts` — `slide add` and `slide move` printed the id the user *asked for*, which the cascading rename may have already replaced. `aideck slide add slide-09 --after slide-01` reported "Added slide-09." while the slide had actually landed as `slide-02`. Both now report the final id when it differs (`Added slide-09 as slide-02 (numeric ids track slide position).`, `Moved slide-03 to position 1 as slide-01.`) and keep the original single-id message when nothing was renamed. `slide remove` was already accurate and is untouched.
2. `docs/deck-format-spec.md` — recorded the contract change: numeric ids are position-derived and rename on `add|move|remove` (along with `slides[].file`, section YAML `id`, and the heading label), so a numeric id is an address rather than a durable handle; custom non-numeric ids are never renamed.
3. `engine/skills/presentation-crafting/` — same contract, now in the agent's instructions. Full rule in `references/canonical-slide-content-schema.md` (Rules list): a numeric id is position-derived, renames on `add|remove|move` along with `slides[].file` / section `id` / heading label, so re-read `deck.json` before addressing a slide by id; use a custom id when a slide needs a durable identity. Two short pointers back to it: `SKILL.md` workflow step 4 (reorder path) and `references/annotation-policy.md` review-loop step 2 (annotation path).

**Why.** Bug 1 is not cosmetic in the agent workflow: the printed id is what an agent next writes into as `content.md#<id>`, and that anchor did not exist. Bug 2 is a user-facing contract change the spec did not mention.

**Files:** `engine/cli/commands/presentation.ts`, `engine/cli/dist/commands/presentation.js` (rebuilt), `docs/deck-format-spec.md`, `engine/skills/presentation-crafting/SKILL.md`, `engine/skills/presentation-crafting/references/canonical-slide-content-schema.md`, `engine/skills/presentation-crafting/references/annotation-policy.md`.

**Verification.** `npm run lint`, `npm run typecheck`, `npm run test:lifecycle` (12/12), `npm run test:boundary` (12/12) all pass. Exercised all five message paths against the real built CLI in a scratch workspace (add matching id / add renamed / add custom id / move renamed / move custom id); `aideck validate` reports the resulting deck valid.

**Follow-ups:** none for this change. Noted but out of scope: `references/export-workflow.md` tells the agent to reuse/restore files from `templates/export-runtime/` while `SKILL.md` labels that folder a legacy snapshot never to copy from — a pre-existing contradiction worth resolving separately.
