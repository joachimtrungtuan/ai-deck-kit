# Slide field editor — review fixes + form styling

## What changed

**YAML edit integrity** (`engine/preview-app/src/yaml-document-edit.ts`)
- Scalar writes mutate the existing node in place instead of replacing it, preserving quote style and trailing comments.
- Typed text stored verbatim, never re-parsed as YAML; serializer quotes when needed. Numeric/boolean scalars keep their type while the text still parses as one.
- Key renames mutate the key scalar in place too.
- Unit tests 2 → 6 (`engine/cli/tests/yaml-document-edit.test.ts`).

**Editor UI** (`slide-field-editor.tsx`, `yaml-field-rows.tsx`, `main.tsx`, `preview-shell.css`)
- Rows stay mounted through a rejected save, so unsaved edits survive; footer is the single error surface.
- Positional React keys fix focus loss on every keystroke; rename keeps a local draft so a rejected rename does not snap back mid-typing.
- Locked `id`/`type` rows now lock the value input, not just the key.
- Collapsed editor panel hides its body and keeps the expand toggle reachable at 56px.
- Global keydown navigation no longer steals keystrokes from the editor (`[data-slide-editor]` exemption).

**Recognized keys** (`content-schema-v2.tsx`)
- `status, intent, animation, transition, assets, icons` are no longer flagged "Not read by renderer" — the validator requires them and the CLI scaffolds them; the renderer reads them from `deck.json`.

**Dev-server write endpoint** (`vite-deck-plugin.ts`)
- Trailing newlines trimmed before splicing, so saves stop growing a blank line before the closing fence.
- 2 MB request-body cap, rejects with 400. New serve test covers both.

**Form styling** (`slide-field-editor.css`, `yaml-field-rows.tsx`)
- Add/remove/reorder are 22×22 icon buttons with accessible labels.
- Key input narrowed to 120px; `Key` label is 10px uppercase accent-gold mono for visual hierarchy.

**Version** 1.0.2 → 1.1.0 across `package.json`, `ai-deck-kit.json`, `engine/engine.version.json`, `engine/package.json`, lockfile, catalog test pin.

## Why

Code review returned Stage 1 FAIL with 4 blockers: silent YAML corruption on edit, lost unsaved work on a rejected save, and an unusable key input. Plus two styling requests from the user.

## Follow-ups

- `authoringSlideYamlKeys` duplicates a contract the validator owns — consider deriving one from the other.
- 2 MB body cap is a chosen number, not a measured one.
- Keyboard deletion in the key input is covered by unit tests only; browser-pane automation cannot send Backspace to inputs.

Report: `plans/reports/fix-260908-1130-slide-field-editor-review-findings.md`
