// Rehearsal log: time spent per slide across visits, compared to Target. Never written to content.md.
export type RehearsalLog = ReadonlyArray<{ slideId: string; ms: number }>;
export type RehearsalSlide = { id: string; title: string; targetSeconds?: number };
export type RehearsalRow = { slideId: string; title: string; actualSeconds: number; targetSeconds?: number };

export function recordVisit(log: RehearsalLog, slideId: string, ms: number): RehearsalLog {
  if (ms <= 0) return log;
  const found = log.some((entry) => entry.slideId === slideId);
  return found ? log.map((entry) => (entry.slideId === slideId ? { ...entry, ms: entry.ms + ms } : entry)) : [...log, { slideId, ms }];
}

/** Rows in deck order; slides never visited are left out. */
export function rehearsalRows(log: RehearsalLog, slides: ReadonlyArray<RehearsalSlide>): RehearsalRow[] {
  return slides.flatMap((slide) => {
    const entry = log.find((candidate) => candidate.slideId === slide.id);
    return entry ? [{ slideId: slide.id, title: slide.title, actualSeconds: Math.round(entry.ms / 1000), targetSeconds: slide.targetSeconds }] : [];
  });
}

const mmss = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function rehearsalMarkdown(rows: ReadonlyArray<RehearsalRow>): string {
  const lines = ["| # | Slide | Actual | Target | Diff |", "|---|---|---|---|---|"];
  rows.forEach((row, i) => {
    const diff = row.targetSeconds === undefined ? "–" : `${row.actualSeconds >= row.targetSeconds ? "+" : "-"}${mmss(Math.abs(row.actualSeconds - row.targetSeconds))}`;
    lines.push(`| ${i + 1} | ${row.title.replace(/\|/g, "\\|")} | ${mmss(row.actualSeconds)} | ${row.targetSeconds === undefined ? "–" : mmss(row.targetSeconds)} | ${diff} |`);
  });
  const total = rows.reduce((sum, row) => sum + row.actualSeconds, 0);
  lines.push(`| | **Total** | **${mmss(total)}** | | |`);
  return lines.join("\n");
}
