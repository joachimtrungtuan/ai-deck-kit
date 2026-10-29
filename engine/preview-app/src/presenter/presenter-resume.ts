// Position survives a reload of either window. Keyed by deck id; clamped when the deck shrank.

type StorageLike = Pick<Storage, "getItem" | "setItem">;

const key = (deckId: string) => `aideck.present.position--${deckId}`;

export function readResumeIndex(storage: StorageLike, deckId: string, total: number): number {
  const raw = Number.parseInt(storage.getItem(key(deckId)) ?? "", 10);
  if (!Number.isFinite(raw) || total <= 0) return 0;
  return Math.max(0, Math.min(total - 1, raw));
}

export function writeResumeIndex(storage: StorageLike, deckId: string, index: number): void {
  storage.setItem(key(deckId), String(index));
}
