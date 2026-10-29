import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { notesSanitizeSchema } from "./notes-sanitize-schema";

// Sanitize runs after rehype-raw so embedded HTML is filtered by the same allow-list as Markdown output.
export function SpeakerNotesRenderer({ markdown }: { markdown: string }) {
  if (!markdown.trim()) return <p className="notes-empty">No speaker notes for this slide.</p>;
  return <Markdown rehypePlugins={[rehypeRaw, [rehypeSanitize, notesSanitizeSchema]]}>{markdown}</Markdown>;
}
