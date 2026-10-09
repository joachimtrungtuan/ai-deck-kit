/** Turns a slide's `tableColumnWidths` into CSS percentage widths for the first `count` columns.
 * Accepts all-positive numbers (fractions, normalized over the visible columns) or all percentage
 * strings (kept as written). Returns undefined for anything else so the table keeps auto widths. */
export function tableColumnWidthPercentages(widths: unknown, count: number): string[] | undefined {
  if (!Array.isArray(widths) || count <= 0 || widths.length < count) return undefined;
  const visible = widths.slice(0, count);
  if (visible.every((value) => typeof value === "number" && Number.isFinite(value) && value > 0)) {
    const total = (visible as number[]).reduce((sum, value) => sum + value, 0);
    return (visible as number[]).map((value) => `${(value / total) * 100}%`);
  }
  if (visible.every((value) => typeof value === "string" && /^\s*\d+(\.\d+)?\s*%\s*$/.test(value))) {
    return (visible as string[]).map((value) => value.replace(/\s+/g, ""));
  }
  return undefined;
}
