import type { ComponentType } from "react";

export type PreviewSlide = {
  id?: string;
  type: string;
  Component: ComponentType<any>;
  props: Record<string, unknown>;
  morphAnchors?: string[];
};

export type PreviewSource = {
  id: string;
  label: string;
  deckClass: string;
  slides: PreviewSlide[];
};
