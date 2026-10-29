// Pure speaker-notes parsing for the presenter window. No JSX or path aliases so node:test can import it.
export type Pacing = "FOCUS" | "BRIEF" | "SKIM" | "ON-DEMAND";

export interface ParsedSpeakerNotes {
  pacing?: Pacing;
  targetSeconds?: number;
  cue?: string;
  /** Raw Markdown + HTML left after the header lines. */
  body: string;
  /** Header values that did not parse (kept for validators and the presenter UI). */
  invalid: string[];
}

export const PACING_VALUES: readonly Pacing[] = ["FOCUS", "BRIEF", "SKIM", "ON-DEMAND"];

const HEADER = /^(Pacing|Target|Cue)\s*:\s*(.*)$/i;
const TARGET = /^(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?$/i;

export function parseTargetSeconds(value: string): number | undefined {
  const text = value.trim();
  const match = TARGET.exec(text);
  if (!text || !match || (match[1] === undefined && match[2] === undefined)) return undefined;
  return Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0);
}

export function parseSpeakerNotes(raw: string | undefined): ParsedSpeakerNotes {
  const result: ParsedSpeakerNotes = { body: "", invalid: [] };
  const lines = (raw ?? "").replace(/\r\n?/g, "\n").split("\n");
  let index = 0;
  const seen = new Set<string>();
  for (; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line && seen.size === 0) continue; // blank lines before the first header
    const match = HEADER.exec(line);
    if (!match) break;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    seen.add(key);
    if (key === "pacing") {
      const pacing = value.toUpperCase();
      if ((PACING_VALUES as readonly string[]).includes(pacing)) result.pacing = pacing as Pacing;
      else result.invalid.push(`Pacing: ${value}`);
    } else if (key === "target") {
      const seconds = parseTargetSeconds(value);
      if (seconds === undefined) result.invalid.push(`Target: ${value}`);
      else result.targetSeconds = seconds;
    } else if (value) result.cue = value;
  }
  result.body = lines.slice(index).join("\n").trim();
  return result;
}

/** Next slide index in `direction` that is not ON-DEMAND, or `from` when none is left. */
export function nextPresentableIndex(pacings: ReadonlyArray<Pacing | undefined>, from: number, direction: 1 | -1): number {
  for (let i = from + direction; i >= 0 && i < pacings.length; i += direction) {
    if (pacings[i] !== "ON-DEMAND") return i;
  }
  return from;
}
