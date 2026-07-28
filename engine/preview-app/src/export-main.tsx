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
import "@fontsource-variable/newsreader/wght.css";
import "@fontsource-variable/newsreader/wght-italic.css";
import "../../templates/swiss-modern.template/design-system.css";
import "../../templates/swiss-modern.template/animation-presets.css";
import "../../templates/linear-dark.template/design-system.css";
import "../../templates/linear-dark.template/animation-presets.css";
import "../../primitives/blocks/primitives.css";
import "./export-shell.css";
import { DeckExport } from "./deck-export";
import { runtimeDeck } from "virtual:aideck-deck";

if (!runtimeDeck) throw new Error("A deck path is required for export.");

if (typeof document !== "undefined") {
  document.title = runtimeDeck.label;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DeckExport source={runtimeDeck} />
  </StrictMode>,
);
