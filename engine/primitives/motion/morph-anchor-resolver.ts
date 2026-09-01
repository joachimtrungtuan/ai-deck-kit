export type MorphAnchor = { id: string; morph?: string };
export type MorphPair = { anchor: string; from: MorphAnchor; to: MorphAnchor };

export function resolveMorphPairs(previous: MorphAnchor[], next: MorphAnchor[]): MorphPair[] {
  const nextByAnchor = new Map();
  for (const item of next.filter((candidate) => candidate.morph)) {
    const matches = nextByAnchor.get(item.morph!) ?? [];
    matches.push(item);
    nextByAnchor.set(item.morph!, matches);
  }
  return previous.flatMap((from) => {
    const matches = from.morph ? nextByAnchor.get(from.morph) : undefined;
    const to = matches?.length === 1 ? matches[0] : undefined;
    return to ? [{ anchor: from.morph!, from, to }] : [];
  });
}

export function animateMorphAnchor(from: HTMLElement, to: HTMLElement, duration = 520): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const start = from.getBoundingClientRect();
  const end = to.getBoundingClientRect();
  // The clone is parented to <body>, but --deck-motion-* live on the deck element, which is a
  // descendant. Custom properties inherit downward only, so the token has to be read off the
  // source element here: an unresolvable var() would invalidate the whole transition at
  // computed-value time and the morph would snap instead of tweening.
  const ease = getComputedStyle(from).getPropertyValue("--deck-motion-ease").trim() || "cubic-bezier(0.22, 1, 0.36, 1)";
  const clone = from.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, { position: "fixed", zIndex: "10", margin: "0", pointerEvents: "none", left: `${start.left}px`, top: `${start.top}px`, width: `${start.width}px`, height: `${start.height}px`, transformOrigin: "top left", transition: `transform ${duration}ms ${ease}, opacity ${duration}ms ${ease}` });
  document.body.append(clone);
  const scaleX = end.width / Math.max(start.width, 1);
  const scaleY = end.height / Math.max(start.height, 1);
  requestAnimationFrame(() => { clone.style.transform = `translate(${end.left - start.left}px, ${end.top - start.top}px) scale(${scaleX}, ${scaleY})`; clone.style.opacity = "0.15"; });
  window.setTimeout(() => clone.remove(), duration + 40);
}
