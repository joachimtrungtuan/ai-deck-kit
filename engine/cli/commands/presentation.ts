import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { createDeck, parseSections, readDeck, setYamlField, slideContent, titleFromSlug, writeDeck } from "../lib/deck.ts";
import { getTemplate } from "../lib/templates.ts";
import { findWorkspace } from "../lib/workspace.ts";
import type { DeckSlide } from "../lib/types.ts";

export const presentationHelp = `Presentation commands:
  new <slug> [--template <set>]  Create a .deck bundle with a starter slide
  slide add <id> --type <type> [--after <id>] [--deck <slug>]
  slide remove <id> [--deck <slug>]
  slide move <id> --to <position> [--deck <slug>]  Position is 1-based
  anim toggle <id> [--deck <slug>]  Toggle between default animation and none
  transition set <id> <type> [--deck <slug>]
  validate <deck>                 Run the canonical deck validator`;

export function runPresentation(args: string[]): void {
  if (!args.length || args.includes("--help")) return console.log(presentationHelp);
  const workspace = findWorkspace();
  const [command, subcommand, ...rest] = args;
  if (command === "new") return newCommand(workspace, subcommand, rest);
  if (command === "slide") return slideCommand(workspace, subcommand, rest);
  if (command === "anim" && subcommand === "toggle") return animationCommand(workspace, rest);
  if (command === "transition" && subcommand === "set") return transitionCommand(workspace, rest);
  if (command === "validate") return validateCommand(workspace, subcommand);
  throw new Error(`Unknown presentation command: ${command} ${subcommand ?? ""}`);
}

function newCommand(workspace: ReturnType<typeof findWorkspace>, slug: string | undefined, args: string[]): void {
  if (!slug) throw new Error("Usage: aideck new <slug> [--template <set>]");
  const template = valueAfter(args, "--template") ?? "swiss-modern";
  console.log(`Created deck: ${createDeck(workspace, slug, template)}`);
}

function slideCommand(workspace: ReturnType<typeof findWorkspace>, action: string | undefined, args: string[]): void {
  if (!action || args.includes("--help")) throw new Error("Usage: aideck slide add|remove|move ...");
  const deck = valueAfter(args, "--deck") ?? ".";
  const id = args[0];
  const loaded = readDeck(workspace, deck);
  const existing = loaded.manifest.slides.find((slide) => slide.id === id);
  if (action === "add") return addSlide(loaded, id, valueAfter(args, "--type") ?? "text-statement", valueAfter(args, "--after"));
  if (!existing) throw new Error(`Slide not found: ${id}`);
  if (action === "remove") return removeSlide(loaded, id);
  if (action === "move") return moveSlide(loaded, id, Number(valueAfter(args, "--to")));
  throw new Error(`Unknown slide action: ${action}`);
}

function addSlide(loaded: ReturnType<typeof readDeck>, id: string, type: string, after?: string): void {
  if (!id || !/^slide-[a-z0-9-]+$/.test(id)) throw new Error("Slide id must look like slide-02 or slide-summary.");
  if (loaded.manifest.slides.some((slide) => slide.id === id)) throw new Error(`Slide already exists: ${id}`);
  const template = getTemplate(findWorkspace(), loaded.manifest.template.set);
  if (!template.manifest.supportedSlideTypes.includes(type)) throw new Error(`Template does not support slide type "${type}".`);
  const slide: DeckSlide = { id, type, file: `content.md#${id}`, animation: loaded.manifest.defaults.animation, transition: loaded.manifest.defaults.transition };
  const insertAt = after ? loaded.manifest.slides.findIndex((candidate) => candidate.id === after) + 1 : loaded.manifest.slides.length;
  if (after && insertAt === 0) throw new Error(`Slide not found: ${after}`);
  loaded.manifest.slides.splice(insertAt, 0, slide);
  const { prefix, sections } = parseSections(loaded.content);
  const section = slideContent(slide, titleFromSlug(id)).replace("## Slide 01:", `## Slide ${String(insertAt + 1).padStart(2, "0")}:`);
  sections.splice(insertAt, 0, section.trimEnd());
  writeDeck(loaded.root, renumberSlides(loaded.manifest, sections), `${prefix}${sections.map((item, index) => renumberHeading(item, index)).join("\n\n")}\n`);
  console.log(`Added ${id}.`);
}

function removeSlide(loaded: ReturnType<typeof readDeck>, id: string): void {
  if (loaded.manifest.slides.length === 1) throw new Error("Cannot remove the last slide.");
  const index = loaded.manifest.slides.findIndex((slide) => slide.id === id);
  const { prefix, sections } = parseSections(loaded.content);
  loaded.manifest.slides.splice(index, 1);
  sections.splice(index, 1);
  writeDeck(loaded.root, renumberSlides(loaded.manifest, sections), `${prefix}${sections.map((item, position) => renumberHeading(item, position)).join("\n\n")}\n`);
  console.log(`Removed ${id}.`);
}

function moveSlide(loaded: ReturnType<typeof readDeck>, id: string, position: number): void {
  if (!Number.isInteger(position) || position < 1 || position > loaded.manifest.slides.length) throw new Error("--to must be a valid 1-based slide position.");
  const from = loaded.manifest.slides.findIndex((slide) => slide.id === id);
  if (from < 0) throw new Error(`Slide not found: ${id}`);
  const { prefix, sections } = parseSections(loaded.content);
  const [slide] = loaded.manifest.slides.splice(from, 1);
  const [section] = sections.splice(from, 1);
  loaded.manifest.slides.splice(position - 1, 0, slide);
  sections.splice(position - 1, 0, section);
  writeDeck(loaded.root, renumberSlides(loaded.manifest, sections), `${prefix}${sections.map((item, index) => renumberHeading(item, index)).join("\n\n")}\n`);
  console.log(`Moved ${id} to position ${position}.`);
}

function animationCommand(workspace: ReturnType<typeof findWorkspace>, args: string[]): void {
  const loaded = readDeck(workspace, valueAfter(args, "--deck") ?? ".");
  const id = args[0];
  const slide = loaded.manifest.slides.find((candidate) => candidate.id === id);
  if (!slide) throw new Error(`Slide not found: ${id}`);
  const next = slide.animation === "none" ? loaded.manifest.defaults.animation : "none";
  slide.animation = next;
  const { prefix, sections } = parseSections(loaded.content);
  const index = loaded.manifest.slides.indexOf(slide);
  sections[index] = setYamlField(sections[index], "animation", next);
  writeDeck(loaded.root, loaded.manifest, `${prefix}${sections.join("\n\n")}\n`);
  console.log(`${id} animation: ${next}`);
}

function transitionCommand(workspace: ReturnType<typeof findWorkspace>, args: string[]): void {
  const loaded = readDeck(workspace, valueAfter(args, "--deck") ?? ".");
  const id = args[0];
  const transition = args[1];
  const slide = loaded.manifest.slides.find((candidate) => candidate.id === id);
  if (!slide || !transition) throw new Error("Usage: aideck transition set <slide-id> <type>");
  slide.transition = transition;
  const { prefix, sections } = parseSections(loaded.content);
  sections[loaded.manifest.slides.indexOf(slide)] = setYamlField(sections[loaded.manifest.slides.indexOf(slide)], "transition", transition);
  writeDeck(loaded.root, loaded.manifest, `${prefix}${sections.join("\n\n")}\n`);
  console.log(`${id} transition: ${transition}`);
}

function validateCommand(workspace: ReturnType<typeof findWorkspace>, deck: string | undefined): void {
  if (!deck) throw new Error("Usage: aideck validate <deck>");
  const loaded = readDeck(workspace, deck);
  if (!existsSync(join(workspace.engineRoot, "skills", "presentation-crafting", "scripts", "validate-slide-content.mjs"))) throw new Error("Canonical deck validator is missing from the engine.");
  const script = join(workspace.engineRoot, "skills", "presentation-crafting", "scripts", "validate-slide-content.mjs");
  const result = spawnSync(process.execPath, [script, loaded.root], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Deck validation failed with exit code ${result.status ?? 1}.`);
}

function renumberSlides(manifest: ReturnType<typeof readDeck>["manifest"], sections: string[]): ReturnType<typeof readDeck>["manifest"] {
  manifest.slides.forEach((slide, index) => { slide.file = `content.md#${slide.id}`; sections[index] = setYamlField(sections[index], "id", slide.id); sections[index] = setYamlField(sections[index], "type", slide.type); });
  return manifest;
}

function renumberHeading(section: string, index: number): string {
  return section.replace(/^## Slide\s+\d+:/, `## Slide ${String(index + 1).padStart(2, "0")}:`);
}

function valueAfter(args: string[], option: string): string | undefined {
  const index = args.indexOf(option);
  return index === -1 ? undefined : args[index + 1];
}
