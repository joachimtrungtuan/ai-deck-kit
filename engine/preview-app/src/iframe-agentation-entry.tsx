import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Agentation } from "agentation";

// Loaded as a <script type="module"> injected directly into the slide iframe's document (see
// fixed-slide-canvas.tsx), never imported from main.tsx. A module script's `document`/`window`
// are bound to whichever document loaded it, so Agentation's own click-picker — which listens on
// the global `document` — ends up listening on the iframe's document, where the actual slide
// elements live, instead of the shell's parent document.
// Agentation buckets annotations in localStorage under a key slugified from document.location.
// This frame has no src, so that is always "feedback-annotations-blank" — every deck previewed on
// this origin shares one bucket and a prior deck's notes resurface in an unrelated deck. Scoping
// the annotation bucket to the deck slug (set by fixed-slide-canvas.tsx) keeps them apart. Toolbar
// preferences stay unscoped on purpose, so a chosen output mode survives switching decks. Patching
// the prototype only touches this frame's realm, not the shell's.
const deckSlug = (window as unknown as { __aideckDeckSlug?: string }).__aideckDeckSlug;
if (deckSlug) {
  const scope = (key: string) => (key.startsWith("feedback-annotations") ? `${key}--${deckSlug}` : key);
  const { getItem, setItem, removeItem } = Storage.prototype;
  Storage.prototype.getItem = function (key: string) { return getItem.call(this, scope(key)); };
  Storage.prototype.setItem = function (key: string, value: string) { setItem.call(this, scope(key), value); };
  Storage.prototype.removeItem = function (key: string) { removeItem.call(this, scope(key)); };
}

const container = document.createElement("div");
document.body.appendChild(container);

createRoot(container).render(
  <StrictMode>
    <Agentation />
  </StrictMode>,
);
