# Annotation Policy

Annotations keep the collaboration trace clear without turning React source into a notebook.

## Where Annotations Belong

| Annotation | Location |
| --- | --- |
| Speaker notes | `decks/{slug}.deck/content.md`, per slide. |
| Design notes | `decks/{slug}.deck/content.md`, per slide. |
| Review questions | `decks/{slug}.deck/content.md`, per slide or file-level section. |
| Override reason | Slide metadata in `content.md`. |
| Implementation extension point | Short source-code comment near component boundary. |
| Change history | Optional `review-notes.md` inside the deck working folder. |

## Rules

- Do not hide important decisions only in source comments.
- Do not create verbose comments for obvious React or CSS.
- Use source comments only when they protect a template contract or explain an extension point.
- Keep annotation language operational: what changed, why it changed, and what remains unresolved.

## Review Loop

When the user requests edits:

1. Update `content.md` first if the change affects copy, intent, speaker notes, asset direction, or override reason.
2. Use `aideck slide add|remove|move` if the change affects slide order or structure; never manually edit the manifest registry. A reorder renumbers numeric slide ids, so re-read `deck.json` before referring to a slide by id again.
3. Re-run `aideck validate <slug>`.
4. Summarize changed slides by slide number.
