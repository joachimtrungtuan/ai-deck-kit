import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// The export shell's own typefaces, named literally in export-shell.css. A deck's typefaces are not
// here: they come from its template's manifest through virtual:aideck-deck.
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
// The deck's own template styles arrive through virtual:aideck-deck, so no template is named here.
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
