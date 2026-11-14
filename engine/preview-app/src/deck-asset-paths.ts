/**
 * Shared by the export-time collector and the render-time resolver, so both agree on what counts
 * as a deck asset reference: a string that is entirely a deck-relative `assets/<file>` path, or an
 * asset path inside an override's html or css. Paths are allowed to contain spaces, but must look
 * like a file name (have an extension) so prose such as `assets/ is where images live` stays text.
 */
export const embeddedAssetPattern = /(["'])(assets\/[^"']+)\1/g;
const cssUrlAssetPattern = /url\(\s*(assets\/[^)"']+?)\s*\)/g;

/** Keep the original compact-path grammar, and add spaced paths only when they look like file names. */
const wholeAssetPattern = /^assets\/[^\s"']+$/;
const spacedAssetPattern = /^assets\/(?=\S)(?=[^"']*\.[^\s/"']+$)[^"']+$/;

function isAssetKey(value: string): boolean {
  return wholeAssetPattern.test(value) || spacedAssetPattern.test(value);
}

/** Every asset key (`assets/<file>`) a single string refers to. */
export function assetKeysInString(value: string): string[] {
  if (isAssetKey(value)) return [value];
  return [
    ...[...value.matchAll(embeddedAssetPattern)].map((match) => match[2]),
    ...[...value.matchAll(cssUrlAssetPattern)].map((match) => match[1]),
  ].filter(isAssetKey);
}

/** Replaces each asset key in `value` using `lookup`; keys it does not know stay untouched. */
export function replaceAssetKeys(value: string, lookup: (key: string) => string | undefined): string {
  const whole = isAssetKey(value) ? lookup(value) : undefined;
  if (whole !== undefined) return whole;
  return value
    .replace(embeddedAssetPattern, (match, quote: string, key: string) => {
      if (!isAssetKey(key)) return match;
      const replacement = lookup(key);
      return replacement === undefined ? match : `${quote}${replacement}${quote}`;
    })
    .replace(cssUrlAssetPattern, (match, key: string) => {
      if (!isAssetKey(key)) return match;
      const replacement = lookup(key);
      return replacement === undefined ? match : match.replace(key, replacement);
    });
}

function isPlainObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** Visits every string inside plain arrays and objects. Class instances and elements are skipped. */
export function visitStrings(value: unknown, visit: (text: string) => void): void {
  if (typeof value === "string") visit(value);
  else if (Array.isArray(value)) value.forEach((item) => visitStrings(item, visit));
  else if (value && typeof value === "object" && isPlainObject(value)) Object.values(value).forEach((item) => visitStrings(item, visit));
}

/** Returns `value` with every string mapped through `map`; untouched branches keep their identity. */
export function mapStrings<T>(value: T, map: (text: string) => string): T {
  if (typeof value === "string") return map(value) as T;
  if (Array.isArray(value)) {
    const mapped = value.map((item) => mapStrings(item, map));
    return (mapped.some((item, index) => item !== value[index]) ? mapped : value) as T;
  }
  if (value && typeof value === "object" && isPlainObject(value)) {
    const entries = Object.entries(value);
    const mapped = entries.map(([key, item]) => [key, mapStrings(item, map)] as const);
    return (mapped.some(([, item], index) => item !== entries[index][1]) ? Object.fromEntries(mapped) : value) as T;
  }
  return value;
}
