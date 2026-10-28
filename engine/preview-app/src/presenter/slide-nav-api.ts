// What the presenter needs from whichever view renders slides: move, and learn when a move settled.
// The live canvas implements it over goToSlide; the export frame implements it over postMessage.

export type SlideNavApi = {
  goto: (index: number) => void;
  /** Fires after a transition settles and the slide is on screen. Returns an unsubscribe. */
  onCommit: (callback: (index: number) => void) => () => void;
};

export function createCommitEmitter() {
  const listeners = new Set<(index: number) => void>();
  return {
    onCommit(callback: (index: number) => void) { listeners.add(callback); return () => { listeners.delete(callback); }; },
    emit(index: number) { listeners.forEach((listener) => listener(index)); },
  };
}
