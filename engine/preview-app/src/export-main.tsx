import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Latin + Latin-ext + Vietnamese subsets only (decks may use Vietnamese diacritics).
// Cyrillic/Greek are intentionally excluded to keep the inlined single-file export small.
import "@fontsource/inter/latin-300.css";
import "@fontsource/inter/latin-ext-300.css";
import "@fontsource/inter/vietnamese-300.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-ext-400.css";
import "@fontsource/inter/vietnamese-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-ext-500.css";
import "@fontsource/inter/vietnamese-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-ext-600.css";
import "@fontsource/inter/vietnamese-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-ext-700.css";
import "@fontsource/inter/vietnamese-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/vietnamese-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "@fontsource/jetbrains-mono/vietnamese-500.css";
import "../../templates/swiss-modern/design-system.css";
import "../../templates/swiss-modern/animation-presets.css";
import "../../templates/linear-dark/design-system.css";
import "../../templates/linear-dark/animation-presets.css";
import "./export-shell.css";
import { getSource } from "./deck-registry";
import { DeckExport } from "./deck-export";

// Deck id is injected at build time by vite.export.config (define), one build per deck.
declare const __EXPORT_DECK_ID__: string;
const source = getSource(__EXPORT_DECK_ID__);

if (typeof document !== "undefined") {
  document.title = source.label;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DeckExport source={source} />
  </StrictMode>,
);
