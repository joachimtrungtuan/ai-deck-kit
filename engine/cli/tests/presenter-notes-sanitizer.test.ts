import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { notesSanitizeSchema } from "../../preview-app/src/presenter/notes-sanitize-schema.ts";

const render = (markdown: string) =>
  renderToStaticMarkup(createElement(Markdown, { rehypePlugins: [rehypeRaw, [rehypeSanitize, notesSanitizeSchema]] }, markdown));

test("scripts, handlers, embeds and styles are stripped", () => {
  const html = render('<script>alert(1)</script><p onclick="x()" style="color:red">hi</p><iframe src="https://x"></iframe><img src=x onerror=y>');
  assert.doesNotMatch(html, /script|onclick|iframe|onerror|<img|style=/i);
  assert.match(html, /<p>hi<\/p>/);
});

test("allow-listed tags and markdown survive", () => {
  const html = render("## Title\n\n- **bold** and <mark>marked</mark> and <u>under</u>\n\n> quote\n\n`code`");
  for (const tag of ["<h2>", "<ul>", "<li>", "<strong>", "<mark>", "<u>", "<blockquote>", "<code>"]) assert.ok(html.includes(tag), tag);
});

test("javascript: links lose their href", () => {
  assert.doesNotMatch(render("[x](javascript:alert(1))"), /javascript:/i);
});
