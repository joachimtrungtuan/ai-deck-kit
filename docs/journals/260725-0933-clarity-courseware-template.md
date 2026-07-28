---
title: "Clarity Courseware: compact catalog, generic runtime"
date: 2026-07-25 09:33
status: complete
tags: [templates, preview, export, courseware]
---

# Clarity Courseware: compact catalog, generic runtime

## Context

Clarity Courseware had to be a browser-native course template, not a disguised PPTX workflow, and it could not distort the existing v1/v2 catalogs. The work therefore introduced its own compact profile: ten semantic slide types and 25 named layouts, with background treated as a shared option rather than multiplying the catalog into 75 gallery entries.

## What Happened

The preset now resolves through the same manifest-backed preview path as any selected template. The resolver prefers an embedded template snapshot in a `.deck`, verifies its manifest name and version against the pinned deck identity, then falls back to the installed bundle. It loads the layout index, components, CSS, and deck class from that bundle; there is no Linear/Swiss/Clarity name-routing branch.

## Reflection

The tempting shortcut was template-specific routing. It would have made the gallery look done while making portable decks fragile and every future template more expensive. The final debugger/reviewer pass exposed two gaps that this kind of shortcut tends to hide: embedded-template identity needed an explicit contract test, and exported HTML needed explicit coverage for Newsreader assets. Both were fixed before handoff.

## Decisions

- Keep Inter as the primary face; use Newsreader only for the precise highlight/quote treatments. The standalone export embeds normal, italic, and Vietnamese Newsreader data, preserving the rendered intent.
- Keep embedded snapshots first for portability, but require exact name/version identity so a stale or incorrect snapshot cannot silently render.
- Validate behavior through the real surfaces: generated `.deck` preview, standalone export, package/upgrade smoke, and browser inspection of all 25 layouts at 1600×900.

## Next

Treat future templates as data-driven bundles: add a catalog, manifest, layout index, and design assets; do not reopen template-name conditionals. Preserve the generic resolver and its identity/font tests when evolving preview or export.
