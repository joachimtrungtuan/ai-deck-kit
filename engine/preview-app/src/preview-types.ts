import type { ComponentType } from "react";

export type PreviewSlide = {
  id?: string;
  type: string;
  Component: ComponentType<any>;
  props: Record<string, unknown>;
  morphAnchors?: string[];
  // Surfaced on the slide wrapper as data-layout-variant so an annotation's DOM path names the
  // layout the reviewer is looking at, not just the slide type.
  layoutVariant?: string;
};

export type PreviewSource = {
  id: string;
  label: string;
  deckClass: string;
  slides: PreviewSlide[];
};
