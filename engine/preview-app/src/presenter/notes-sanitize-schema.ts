// Allow-list for rendered speaker notes: Markdown plus a small set of inline/block HTML tags.
// Scripts, event handlers, embeds and styles never survive. No JSX so node:test can import it.
import { defaultSchema, type Options } from "rehype-sanitize";

export const NOTES_ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "strong", "b", "em", "i", "u", "mark",
  "br", "p", "span", "code", "pre", "blockquote", "hr", "a",
] as const;

export const notesSanitizeSchema: Options = {
  ...defaultSchema,
  tagNames: [...NOTES_ALLOWED_TAGS],
  attributes: { a: ["href", "title"], code: [["className", /^language-[\w-]+$/]] },
  protocols: { href: ["http", "https", "mailto"] },
};
