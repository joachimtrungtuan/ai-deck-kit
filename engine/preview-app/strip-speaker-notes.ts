/**
 * Removes every `### Speaker Notes` section from deck content. A section runs until the next
 * `###` heading, the next `## Slide N` heading, or end of file — the same boundary the notes parser
 * uses, so any other heading inside notes is removed too and notes never survive into a shareable export.
 */
export function stripSpeakerNotes(content: string): string {
  return content.replace(/^### Speaker Notes[^\n]*\n[\s\S]*?(?=^### |^## Slide\s+\d|(?![\s\S]))/gm, "");
}
