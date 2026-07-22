# Quality Gate

Run this checklist before handing off a deck.

## Content

- One canonical `decks/{slug}.deck/content.md` file exists.
- Every slide has a clear intent.
- Visible copy fits the selected slide type.
- Speaker notes carry detail that should not be on screen.
- Review questions are listed at the end of the report if any remain.

## Template Consistency

- One template set is used across the deck.
- Every slide maps to an active slide type.
- Overrides are explicit and justified.
- Typography, color, spacing, icon weight, and animation style are consistent.

## Runtime

- `aideck validate <slug>` passes before review or export.
- Shared preview runtime is used through `aideck serve --deck <slug>` for browser review.
- React source compiles when React output is used.
- Static export opens in browser when static output is requested.
- Keyboard navigation works.
- Current slide position or progress is visible.
- Responsive layout works for common laptop and projector sizes.

## Visual Review

- Text does not overflow containers.
- Important text is not obscured by images or motion.
- Images render and are not blurry, dark, or generic unless intentionally treated.
- Icons share one family and weight.
- Motion is gentle, purposeful, and reduced-motion aware.

## Report

Include:

- content path
- template set and version
- output path
- validations run
- unresolved questions, if any
