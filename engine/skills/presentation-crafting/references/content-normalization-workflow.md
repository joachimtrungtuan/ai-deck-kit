# Content Normalization Workflow

Use this workflow before generating or editing a rendered presentation.

## Modes

### Slide-Ready Input

Use when the user provides slide numbers, titles, slide text, asset notes, or visual instructions.

1. Preserve the user's slide order unless they ask for restructuring.
2. Convert each slide into the canonical schema.
3. Keep user-provided wording unless it is too long to fit the selected slide type.
4. Record unclear or conflicting instructions under `review_questions`.

### Raw Input

Use when the user provides notes, a transcript, a memo, a rough outline, or top-line ideas.

1. Extract the presentation goal, audience, tone, and expected duration.
2. Group content into a narrative arc.
3. Propose a slide outline before coding if the structure is not obvious.
4. Assign each slide a purpose: opener, context, contrast, evidence, method, example, implication, closing.
5. Include visual direction for each slide: image, icon, diagram, chart, product UI, or type-only.

## Content Rules

- One primary idea per slide.
- Slide title should be short enough to fit in one or two lines.
- Body text should be scannable, not script-length narration.
- Speaker notes can carry nuance that does not fit on the slide.
- Visual notes must be specific enough for the agent to select or create assets later.

## Output

Always produce or update `decks/{presentation-slug}.deck/content/{presentation-slug}.slides.md` before generating source code.
