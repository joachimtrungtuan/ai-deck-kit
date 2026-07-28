# Add Clarity Courseware template

## What changed

- Added the `clarity-courseware-v1` compact slide-type profile with exactly 10 semantic types and 25 layout variants.
- Authored and registered `clarity-courseware.template` with scoped design tokens, Inter/Newsreader mixed headings, three background modes, course headers, section/page footers, original SVG assets, and restrained motion.
- Added a curated 25-slide gallery source with a 17 white / 4 orange / 4 black distribution.
- Generalized manifest-backed `.deck` preview loading to resolve the selected template bundle, components, CSS, and deck class without template-name routing.
- Preserved portable embedded-template snapshots, verified their name/version identity, and resolved their bare React/font dependencies through the engine runtime.
- Extended template/deck validation for layout and background variants and added focused contract/integration tests.
- Added fixed-canvas and export capture support for Clarity slides.
- Fixed portable-install exports so direct deck slugs resolve through the workspace pointer and standalone HTML/PDF artifacts stay beside the selected deck bundle instead of the installed engine directory.

## Why

Course lesson decks need a compact, practical layout set with enough controlled variation for text, media, tables, code, data, quotes, and lesson navigation without creating an unwieldy template catalog.

## Verification

- Template manifest validation passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- The complete preview suite passed 18/18, including the localhost Vite integration.
- `npm run validate` confirmed all three shipped `.template` bundles are present in the release package.
- Clean-install/upgrade smoke passed with Swiss Modern, Linear Dark, and Clarity HTML/PDF exports; doctor passed all three decks after upgrade.
- A real Clarity standalone HTML export built successfully and embedded Newsreader normal, italic, and Vietnamese font data.
- A generated `clarity-courseware` `.deck` validated and rendered both layout and background metadata through the generic preview path.
- Browser QA covered all 25 variants at 1600×900 with zero unexpected overflow, no console warnings/errors, correct Newsreader italic highlights, and the intended 17/4/4 background distribution.

## Follow-ups

None.
