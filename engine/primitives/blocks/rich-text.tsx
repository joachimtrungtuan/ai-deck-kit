import { Fragment, type ReactNode } from "react";

// Whitelist-only inline markup for authored text (slide body/description,
// item title/description, kicker). Only these six tags are recognized; every
// other tag-like substring (including <script>, <img onerror=...>, etc.)
// falls through as literal visible text because it never matches TAG_PATTERN.
// No dangerouslySetInnerHTML anywhere in this file.
const TAG_PATTERN = /<(\/?)(b|i|ul|ol|li|br)\s*\/?>/gi;

type RichNode = { tag: string; children: RichNode[] } | { text: string };

function parseRichText(input: string): RichNode[] {
  const root: { tag: string; children: RichNode[] } = { tag: "root", children: [] };
  const stack = [root];
  let lastIndex = 0;
  TAG_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TAG_PATTERN.exec(input))) {
    const [full, closing, tagRaw] = match;
    const tag = tagRaw.toLowerCase();
    const top = stack[stack.length - 1];
    if (match.index > lastIndex) top.children.push({ text: input.slice(lastIndex, match.index) });
    lastIndex = match.index + full.length;

    if (tag === "br") {
      top.children.push({ tag: "br", children: [] });
      continue;
    }
    if (closing) {
      const openDepth = stack.map((node) => ("tag" in node ? node.tag : "")).lastIndexOf(tag);
      if (openDepth === -1) {
        top.children.push({ text: full });
        continue;
      }
      stack.length = openDepth;
    } else {
      const node: RichNode = { tag, children: [] };
      top.children.push(node);
      stack.push(node as { tag: string; children: RichNode[] });
    }
  }
  if (lastIndex < input.length) stack[0].children.push({ text: input.slice(lastIndex) });
  return root.children;
}

function renderRichNodes(nodes: RichNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if ("text" in node) return node.text ? <Fragment key={key}>{node.text}</Fragment> : null;
    const children = renderRichNodes(node.children, key);
    switch (node.tag) {
      case "br": return <br key={key} />;
      case "b": return <b key={key}>{children}</b>;
      case "i": return <i key={key}>{children}</i>;
      case "ul": return <ul key={key}>{children}</ul>;
      case "ol": return <ol key={key}>{children}</ol>;
      case "li": return <li key={key}>{children}</li>;
      default: return null;
    }
  });
}

// Renders <b> <i> <ul> <ol> <li> <br> from authored text as React elements.
// Unrecognized tags are never parsed as markup — they render as plain text.
export function renderRichText(text?: string | null): ReactNode {
  if (!text) return null;
  return renderRichNodes(parseRichText(text), "rt");
}
