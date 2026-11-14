export function runHtmlCspHeadlessCheck(options: {
  htmlPath: string;
  chrome?: string;
  slideCount?: number;
}): { skipped: boolean; elapsedMs: number };

export function countExportSlides(htmlPath: string): number;
