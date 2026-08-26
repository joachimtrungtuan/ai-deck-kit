import { readFileSync } from "node:fs";
import { createDeck, parseSections, readDeck, setYamlField, slideContent, writeDeck } from "../lib/deck.ts";
import type { DeckSlide } from "../lib/types.ts";
import { findWorkspace } from "../lib/workspace.ts";

export const generationHelp = `Generation commands:
  gen scaffold <slug> --outline <file> [--template <set>]
                                           Create a deterministic deck skeleton from an approved Markdown outline`;

export function runGeneration(args: string[]): void {
  if (!args.length || args.includes("--help")) return console.log(generationHelp);
  if (args[0] !== "scaffold" || !args[1]) throw new Error("Usage: aideck gen scaffold <slug> [--template <set>]");
  const templateIndex = args.indexOf("--template");
  const template = templateIndex === -1 ? "swiss-modern" : args[templateIndex + 1];
  if (!template) throw new Error("--template requires a template name.");
  const outlinePath = valueAfter(args, "--outline");
  if (!outlinePath) throw new Error("--outline requires an approved Markdown outline file.");
  const workspace = findWorkspace();
  const root = createDeck(workspace, args[1], template);
  applyOutline(workspace, args[1], readFileSync(outlinePath, "utf8"));
  console.log(`Generated deterministic scaffold: ${root}`);
}

function applyOutline(workspace: ReturnType<typeof findWorkspace>, slug: string, outline: string): void {
  const headings = [...outline.matchAll(/^(#{1,2})\s+(.+)$/gm)].map((match) => ({ level: match[1].length, title: match[2].trim() })).filter((heading) => heading.title);
  if (!headings.length) throw new Error("Outline has no Markdown headings.");
  const loaded = readDeck(workspace, slug);
  const sections = parseSections(loaded.content);
  const hasOutlineTitle = headings[0].level === 1;
  const slideHeadings = hasOutlineTitle ? headings.slice(1) : headings;
  if (hasOutlineTitle) {
    loaded.manifest.title = headings[0].title;
    sections.sections[0] = sections.sections[0].replace(/^## Slide\s+\d+.*$/m, "## Slide 01 (slide-01)");
    sections.sections[0] = setYamlField(sections.sections[0], "title", loaded.manifest.title);
  }
  slideHeadings.forEach((heading, index) => {
    const id = `slide-${String(index + 2).padStart(2, "0")}`;
    const slide: DeckSlide = { id, type: "text-statement", file: `content.md#${id}`, animation: loaded.manifest.defaults.animation, transition: loaded.manifest.defaults.transition };
    loaded.manifest.slides.push(slide);
    sections.sections.push(slideContent(slide, heading.title).replace(/^## Slide\s+\d+/, `## Slide ${String(index + 2).padStart(2, "0")}`));
  });
  loaded.manifest.generation = { source: "outline", params: { headings: slideHeadings.map((heading) => heading.title) } };
  writeDeck(loaded.root, loaded.manifest, `${sections.prefix}${sections.sections.join("\n\n")}\n`);
}

function valueAfter(args: string[], option: string): string | undefined {
  const index = args.indexOf(option);
  return index === -1 ? undefined : args[index + 1];
}
