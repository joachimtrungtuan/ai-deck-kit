import type { ComponentType } from "react";
// Replace this import with each template preview or working-file deck source.
// Example:
// import { myDeckSlides } from "../../working-files/my-deck/source/my-deck";

export type PreviewSlide = { type: string; Component: ComponentType<any>; props: Record<string, unknown> };
export type PreviewSource = { id: string; label: string; deckClass: string; slides: PreviewSlide[] };

export const SOURCES: PreviewSource[] = [
  // Example:
  // { id: "my-deck", label: "My Deck", deckClass: "ld-deck", slides: myDeckSlides as PreviewSlide[] },
];

export function getSource(id: string): PreviewSource {
  const source = SOURCES.find((s) => s.id === id);
  if (!source) {
    throw new Error(`Unknown presentation source: ${id}`);
  }
  return source;
}
