/**
 * Removes every `### Speaker Notes` section from deck content. A section runs until the next
 * `#`, `##` or `###` heading (or end of file) — the same boundary the notes parser uses, so
 * deeper `####` lines inside notes are removed too and notes never survive into a shareable export.
 */
export function stripSpeakerNotes(content: string): string {
  return content.replace(/^### Speaker Notes[^\n]*\n[\s\S]*?(?=^#{1,3} |(?![\s\S]))/gm, "");
}
