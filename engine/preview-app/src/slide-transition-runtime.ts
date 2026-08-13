import { flushSync } from "react-dom";
import { resolveMorphPairs } from "../../primitives/motion/morph-anchor-resolver";
import type { PreviewSlide, PreviewSource } from "./preview-types";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready?: Promise<void>; finished?: Promise<void> };
};

function hasMorph(from: PreviewSlide, to: PreviewSlide): boolean {
  const previousAnchors = from.morphAnchors?.map((anchor) => ({ id: anchor, morph: anchor })) ?? [];
  const nextAnchors = to.morphAnchors?.map((anchor) => ({ id: anchor, morph: anchor })) ?? [];
  return resolveMorphPairs(previousAnchors, nextAnchors).length > 0;
}

/**
 * Shared slide-navigation core for both the live preview and the export view. Morph anchors take
 * priority — a shared-element transition always wins over a plain slide transition, and plays with
 * the browser's default root cross-fade exactly as it did before slide transitions existed. Otherwise
 * the resolved transition (per-slide, falling back to the deck/template default) drives the CSS in
 * slide-transitions.css through data-slide-transition/data-slide-direction on the transitioning
 * document. "none" (the default when nothing is configured anywhere) stays a hard cut.
 */
export function goToSlide(options: {
  frameDocument: Document | null;
  from: PreviewSlide;
  to: PreviewSlide;
  direction: "forward" | "backward";
  source: PreviewSource;
  commit: () => void;
}): void {
  const { frameDocument, from, to, direction, source, commit } = options;
  const doc = frameDocument as ViewTransitionDocument | null;
  if (!doc?.startViewTransition) {
    commit();
    return;
  }
  if (hasMorph(from, to)) {
    const morphResult = doc.startViewTransition(() => flushSync(commit));
    void morphResult.ready?.catch(() => {});
    return;
  }
  const transition = to.transition ?? source.defaultTransition ?? "none";
  if (transition === "none") {
    commit();
    return;
  }
  doc.documentElement.dataset.slideTransition = transition;
  doc.documentElement.dataset.slideDirection = direction;
  const result = doc.startViewTransition(() => flushSync(commit));
  void result.ready?.catch(() => {});
  void result.finished?.finally(() => {
    delete doc.documentElement.dataset.slideTransition;
    delete doc.documentElement.dataset.slideDirection;
  });
}
