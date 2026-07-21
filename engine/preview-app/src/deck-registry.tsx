import type { ComponentType } from "react";
import { swissModernSlides } from "./swiss-modern-preview";
import { linearDarkSlides } from "./linear-dark-preview";
import { vivimoonWebsiteSlides } from "../../../decks/vivimoon-website.deck/source/vivimoon-website-deck";

// A preview/export source is any registered slide set (template preview or deck).
// Adding a new source = one entry here; the dev shell and the standalone export both read this list.
export type PreviewSlide = { type: string; Component: ComponentType<any>; props: Record<string, unknown> };
export type PreviewSource = { id: string; label: string; deckClass: string; slides: PreviewSlide[] };

export const SOURCES: PreviewSource[] = [
  { id: "swiss-modern", label: "Swiss Modern", deckClass: "swiss-deck", slides: swissModernSlides as PreviewSlide[] },
  { id: "linear-dark", label: "Linear Dark", deckClass: "ld-deck", slides: linearDarkSlides as PreviewSlide[] },
  { id: "vivimoon-website", label: "VIVIMOON Website", deckClass: "ld-deck", slides: vivimoonWebsiteSlides as PreviewSlide[] },
];

export function getSource(id: string): PreviewSource {
  return SOURCES.find((s) => s.id === id) ?? SOURCES[0];
}
