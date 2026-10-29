export type SlideIdentity = { id?: string; tocTitle?: string; type: string };

/** Compares the deck's current slide list with the export's and describes the first differences. */
export function exportDrift(live: SlideIdentity[], exported: SlideIdentity[], limit = 3): string[] {
  const mismatches: string[] = [];
  if (live.length !== exported.length) mismatches.push(`Slide count differs: deck has ${live.length}, export has ${exported.length}.`);
  const shared = Math.min(live.length, exported.length);
  for (let i = 0; i < shared && mismatches.length < limit; i += 1) {
    const a = live[i];
    const b = exported[i];
    if (a.id !== b.id || a.tocTitle !== b.tocTitle || a.type !== b.type) {
      mismatches.push(`Slide ${i + 1} differs: deck "${a.tocTitle ?? a.id ?? a.type}" (${a.type}) vs export "${b.tocTitle ?? b.id ?? b.type}" (${b.type}).`);
    }
  }
  return mismatches.slice(0, limit);
}
