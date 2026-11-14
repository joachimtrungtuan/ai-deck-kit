import { mapStrings, replaceAssetKeys } from "./deck-asset-paths.ts";

/** The deck's shared asset table: `assets/<file>` -> data URI, one entry per distinct file. */
export type DeckAssetTable = Record<string, string>;

const resolvedByTable = new WeakMap<DeckAssetTable, WeakMap<object, unknown>>();

/**
 * Swaps every `assets/<file>` reference in a slide's render props (or override) for its data URI
 * from the shared table. Memoised per props object so re-renders hand layouts a stable reference.
 */
export function resolveSlideAssets<T>(value: T, table: DeckAssetTable): T {
  if (!value || typeof value !== "object" || Object.keys(table).length === 0) return value;
  let cache = resolvedByTable.get(table);
  if (!cache) resolvedByTable.set(table, (cache = new WeakMap()));
  if (cache.has(value)) return cache.get(value) as T;
  const resolved = mapStrings(value, (text) => replaceAssetKeys(text, (key) => table[key]));
  cache.set(value, resolved);
  return resolved;
}
