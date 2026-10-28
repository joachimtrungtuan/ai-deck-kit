// postMessage contract between the presenter and an exported deck loaded in an iframe. The export
// side only ever listens for goto and reports state; it never receives or sends notes.

import type { SlideSummary } from "./presenter-channel";

export type ExportGotoMessage = { aideck: "goto"; index: number };
export type ExportStateMessage = { aideck: "state"; index: number; slides: SlideSummary[] };

export function isExportGotoMessage(data: unknown, origin: string, selfOrigin: string): data is ExportGotoMessage {
  if (origin !== selfOrigin) return false;
  const message = data as Partial<ExportGotoMessage> | null;
  return !!message && typeof message === "object" && message.aideck === "goto" && Number.isInteger(message.index);
}

export function isExportStateMessage(data: unknown, origin: string, selfOrigin: string): data is ExportStateMessage {
  if (origin !== selfOrigin) return false;
  const message = data as Partial<ExportStateMessage> | null;
  return !!message && typeof message === "object" && message.aideck === "state"
    && Number.isInteger(message.index) && Array.isArray(message.slides);
}
