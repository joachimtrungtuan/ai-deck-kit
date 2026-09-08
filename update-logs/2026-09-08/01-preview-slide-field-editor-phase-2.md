# Preview Slide Field Editor — Phase 2

**What changed:** Added a deck-only YAML field editor with recursive mapping and sequence rows, scalar editing, add/remove/rename/reorder controls, locked deck-binding keys, renderer-read badges, revision-aware Save/conflict handling, and a v1 disabled state. The preview source now carries its content-schema major for that boundary.

**Why:** Authors can edit the active slide's source YAML directly in `aideck serve` without a second content store or writing asset-inlined virtual-module content.

**Verification:** Typecheck and focused parser/editor tests cover the source contracts and YAML mutations. Manual Vite review remains host-limited in this sandbox by loopback `listen EPERM`.

**Follow-ups:** Re-run manual `aideck serve` checks for `items`, `tableRows`, and v1 on a host that permits loopback binding.
