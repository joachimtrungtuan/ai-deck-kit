# Outline-First Generation

Use this flow whenever the input is a prompt, document, transcript, raw notes, or another source without a trustworthy slide-by-slide structure. The agent creates the narrative; the CLI creates the bundle and keeps its structure synchronized.

## 1. Derive an outline

Extract audience, goal, key evidence, tone, and desired duration. Propose a concise slide outline before writing deck content. Each item needs a short title and one sentence describing its slide purpose. Preserve an explicit user outline unless they ask to reshape it.

Ask for approval when the source leaves material narrative choices open. Do not scaffold from an unapproved outline when the user must choose the story.

## 2. Save the approved outline

Write a temporary Markdown outline outside the target `.deck` bundle. Use one `#` deck title followed by one `##` heading per proposed slide:

```markdown
# Quarterly Product Review

## The customer signal changed
## Three product bets
## What we need next
```

The CLI uses only these headings for structure; explanatory notes remain agent working material and do not become slide copy automatically.

## 3. Scaffold deterministically

Run:

```bash
aideck gen scaffold quarterly-product-review \
  --template swiss-modern \
  --outline /absolute/path/to/approved-outline.md
```

This creates `decks/quarterly-product-review.deck/`, writes the ordered slide registry in `deck.json`, creates matching `content.md` sections, and records `generation.source: "outline"`. Do not hand-create or reorder slide registry entries.

## 4. Fill and validate

Fill each generated section in `content.md` with on-slide copy, visual direction, speaker notes, design notes, review questions, and any validated structured blocks. Keep placeholders only when they are an explicit review question.

Run `aideck validate quarterly-product-review` before preview. Then review via `aideck serve --deck quarterly-product-review`; use CLI slide commands if approved changes alter structure.

## Prompt and document inputs

Treat a prompt or document as creative source material, never as a CLI payload. The agent converts it into the approved Markdown outline above, then calls `aideck gen scaffold`. This keeps model judgment separate from deterministic filesystem and manifest work.
