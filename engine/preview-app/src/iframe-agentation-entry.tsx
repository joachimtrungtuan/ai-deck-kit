import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Agentation } from "agentation";

// Loaded as a <script type="module"> injected directly into the slide iframe's document (see
// fixed-slide-canvas.tsx), never imported from main.tsx. A module script's `document`/`window`
// are bound to whichever document loaded it, so Agentation's own click-picker — which listens on
// the global `document` — ends up listening on the iframe's document, where the actual slide
// elements live, instead of the shell's parent document.
const container = document.createElement("div");
document.body.appendChild(container);

createRoot(container).render(
  <StrictMode>
    <Agentation />
  </StrictMode>,
);
