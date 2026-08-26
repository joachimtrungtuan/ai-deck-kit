import type { ComponentType } from "react";

// The full slide-transition catalog. "none" is the hard-cut baseline every deck gets when no tier
// (slide, deck defaults, template default) sets anything, so existing decks render unchanged.
export type SlideTransitionType =
  | "none"
  | "crossfade"
  | "blur-crossfade"
  | "push"
  | "zoom"
  | "wipe"
  | "iris"
  | "flip"
  | "page-turn";

export type SlideOverride = {
  layout?: string;
  animation?: string;
  css?: string;
  html?: string;
  reason?: string;
};

export type PreviewSlide = {
  id?: string;
  type: string;
  Component: ComponentType<any>;
  props: Record<string, unknown>;
  morphAnchors?: string[];
  // Surfaced on the slide wrapper as data-layout-variant so an annotation's DOM path names the
  // layout the reviewer is looking at, not just the slide type.
  layoutVariant?: string;
  // Transition to play when navigating INTO this slide. Falls back to source.defaultTransition.
  transition?: SlideTransitionType;
  override?: SlideOverride;
};

export type PreviewSource = {
  id: string;
  label: string;
  deckClass: string;
  slides: PreviewSlide[];
  defaultTransition?: SlideTransitionType;
};
