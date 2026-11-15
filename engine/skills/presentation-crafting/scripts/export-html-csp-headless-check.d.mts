export function runHtmlCspHeadlessCheck(options: {
  htmlPath: string;
  chrome?: string;
  slideCount?: number;
}): { skipped: boolean; elapsedMs: number };

export function countExportSlides(htmlPath: string): number;

export function chromeDumpIsJudgeable(result: {
  error?: (Error & { code?: string }) | undefined;
  status?: number | null;
  stdout?: string | null;
}): boolean;
