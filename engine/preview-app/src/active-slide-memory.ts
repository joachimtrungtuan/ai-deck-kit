import type { PreviewSource } from "./preview-types";

export function readActiveSlideIndex(source: PreviewSource): number {
  const activeSlideId = sessionStorage.getItem(storageKey(source));
  const index = source.slides.findIndex((slide) => slide.id === activeSlideId);
  return index === -1 ? 0 : index;
}

export function rememberActiveSlide(source: PreviewSource, index: number): void {
  const slideId = source.slides[index]?.id;
  if (slideId) sessionStorage.setItem(storageKey(source), slideId);
}

function storageKey(source: PreviewSource): string {
  return `aideck.preview.activeSlide--${source.id}`;
}
