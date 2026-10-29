/**
 * Removes every `### Speaker Notes` section from deck content. A section runs until the next
 * heading of any level (or end of file), so notes never survive into a shareable export.
 */
export function stripSpeakerNotes(content: string): string {
  return content.replace(/^### Speaker Notes[^\n]*\n[\s\S]*?(?=^#{1,6} |(?![\s\S]))/gm, "");
}
