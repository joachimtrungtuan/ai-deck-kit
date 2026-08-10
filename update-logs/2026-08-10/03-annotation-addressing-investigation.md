# Annotation addressing investigation (post iframe-mount fix)

**What:** Investigated whether moving Agentation inside the slide iframe (see `02-mount-agentation-inside-slide-iframe.md`) weakens its ability to address the element/slide it's annotating. Tried a `document.title`-seeding enhancement, then reverted it after live verification showed it had no effect.

**Findings (live-verified in the running preview, `vivimoon-website` deck):**
- Element/component addressing is fully intact and unaffected by the iframe move — breadcrumb, DOM path, nearby text, computed styles, and React component tree all resolve correctly and still cross the Portal boundary into the parent app's own fiber tree.
- Agentation's annotation schema has no field for page/slide/deck identity (`id, x, y, comment, element, elementPath, timestamp, boundingBox, nearbyText, cssClasses, isFixed, fullPath, accessibility, computedStyles, nearbyElements, reactComponents` — confirmed by reading a live annotation object back from `localStorage`). This was already true before the iframe fix; no regression.
- Agentation buckets annotations in `localStorage` under a key derived from `document.location`, slugified. Because the slide iframe is built dynamically with no `src` (by design — this avoids a reload on every slide navigation), `document.location.href` is always `"about:blank"`, so the key is always `feedback-annotations-blank`, regardless of which deck is loaded.
- Tried seeding `iframe.contentDocument.title` per-slide as a cheap addressing aid. Verified via clipboard interception that Agentation's copy/export payload (`## Page Feedback: blank\n...`) ignores `document.title` entirely — it keys off `document.location` only. The title-seeding effect was a no-op for this purpose and was **reverted** (see `engine/preview-app/src/fixed-slide-canvas.tsx` — net diff back to the `02` commit's state).
- Tried `iframe.contentWindow.history.replaceState(...)` to give the frame a real-looking URL without a reload. Confirmed this throws `SecurityError` in Chrome for any document whose actual URL is `about:blank`, regardless of origin match. Not viable.

**Real bug identified (not fixed, by user decision):** Because the storage key is a constant `blank` string, annotations are **not scoped per deck**. Reusing the same preview port across different `aideck serve --deck <slug>` sessions (same browser profile → same origin → shared `localStorage`) will surface a prior deck's stale annotations in a completely different deck's preview. Live-reproduced: two test annotations added during this session are sitting in `feedback-annotations-blank` unscoped to any deck.

**Two candidate fixes discussed, not implemented (user chose "skip for now"):**
- **A — real `src` per deck:** serve a static shell page, set `iframe.src` once when the deck/template (`source`) changes (not per-slide), so Agentation's own slug becomes deck-specific. One-time reload on deck open only.
- **B — namespace localStorage ourselves:** patch `Storage.prototype.setItem/getItem/removeItem` inside `iframe-agentation-entry.tsx` (already engine-owned) to prefix `feedback-*` keys with the deck slug. No iframe reload, no architecture change.

**Follow-up:** Revisit when cross-deck annotation collisions actually bite someone. Option B is the lighter-weight fix if/when this gets picked back up.
