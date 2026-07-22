import { swissModernSlides } from "./swiss-modern-preview";
import { linearDarkSlides } from "./linear-dark-preview";
import type { PreviewSlide, PreviewSource } from "./preview-types";

// Registry entries are template previews only. Deck preview/export sources resolve from a selected
// .deck manifest through the Vite virtual module, not by adding a per-deck import here.
export const SOURCES: PreviewSource[] = [
  { id: "swiss-modern", label: "Swiss Modern", deckClass: "swiss-deck", slides: swissModernSlides as PreviewSlide[] },
  { id: "linear-dark", label: "Linear Dark", deckClass: "ld-deck", slides: linearDarkSlides as PreviewSlide[] },
];

export function getSource(id: string): PreviewSource {
  return SOURCES.find((s) => s.id === id) ?? SOURCES[0];
}
