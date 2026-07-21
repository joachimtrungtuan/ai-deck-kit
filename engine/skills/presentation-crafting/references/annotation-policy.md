# Annotation Policy

Annotations keep the collaboration trace clear without turning React source into a notebook.

## Where Annotations Belong

| Annotation | Location |
| --- | --- |
| Speaker notes | Content file, per slide. |
| Design notes | Content file, per slide. |
| Review questions | Content file, per slide or file-level section. |
| Override reason | Slide metadata in content file. |
| Implementation extension point | Short source-code comment near component boundary. |
| Change history | Optional `review-notes.md` inside the deck working folder. |

## Rules

- Do not hide important decisions only in source comments.
- Do not create verbose comments for obvious React or CSS.
- Use source comments only when they protect a template contract or explain an extension point.
- Keep annotation language operational: what changed, why it changed, and what remains unresolved.

## Review Loop

When the user requests edits:

1. Update the content file first if the change affects copy, intent, speaker notes, asset direction, slide order, or override reason.
2. Update source code second.
3. Re-run validation.
4. Summarize changed slides by slide number.
