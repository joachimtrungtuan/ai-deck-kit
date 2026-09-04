import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { copyTree, readJson, writeJson, writeText } from "./fs.ts";
import { writeDeckSchemaGuidance } from "./schema-guidance.ts";
import { resolveTemplate } from "./templates.ts";
import type { DeckManifest, DeckSlide, Workspace } from "./types.ts";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function deckPath(workspace: Workspace, slugOrPath: string): string {
  if (!isAbsolute(slugOrPath) && slugOrPath.endsWith(".deck") && !slugOrPath.includes("/")) return join(workspace.decksRoot, slugOrPath);
  const candidate = resolve(workspace.root, slugOrPath);
  if (candidate.endsWith(".deck") || slugOrPath.includes("/")) {
    const decksRoot = resolve(workspace.decksRoot);
    if (!candidate.startsWith(`${decksRoot}/`) && candidate !== decksRoot) throw new Error(`Deck path must stay inside ${workspace.decksRoot}.`);
    return candidate;
  }
  if (!SLUG_RE.test(slugOrPath)) throw new Error(`Invalid deck slug "${slugOrPath}". Use kebab-case.`);
  return join(workspace.decksRoot, `${slugOrPath}.deck`);
}

export function readDeck(workspace: Workspace, slugOrPath: string): { root: string; manifest: DeckManifest; content: string } {
  const root = deckPath(workspace, slugOrPath);
  const manifest = readJson<DeckManifest>(join(root, "deck.json"));
  const content = readFileSync(join(root, "content.md"), "utf8");
  return { root, manifest, content };
}

export function writeDeck(root: string, manifest: DeckManifest, content: string): void {
  writeJson(join(root, "deck.json"), manifest);
  writeText(join(root, "content.md"), content);
}

export function createDeck(workspace: Workspace, slug: string, templateName: string, title = titleFromSlug(slug)): string {
  if (!SLUG_RE.test(slug)) throw new Error(`Invalid deck slug "${slug}". Use kebab-case.`);
  const root = deckPath(workspace, slug);
  if (existsSync(root)) throw new Error(`Deck already exists: ${root}`);
  const template = resolveTemplate(workspace, templateName);
  mkdirSync(join(root, "assets"), { recursive: true });
  copyTree(template.root, join(root, "template"));
  const firstType = template.manifest.supportedSlideTypes.includes("title") ? "title" : template.manifest.supportedSlideTypes[0];
  if (!firstType) throw new Error(`Template "${templateName}" declares no supported slide types.`);
  const defaultTransition = template.manifest.defaultTransition ?? "none";
  const firstSlide: DeckSlide = { id: "slide-01", type: firstType, file: "content.md#slide-01", animation: template.manifest.defaultAnimation, transition: defaultTransition };
  const manifest: DeckManifest = {
    schema: "ai-deck-kit/deck@1.0.0",
    title,
    slug,
    audience: "",
    goal: "",
    template: { set: template.manifest.name, version: template.manifest.templateVersion, origin: template.origin },
    slideTypeCatalog: template.manifest.slideTypeCatalog,
    blockCatalog: template.manifest.blockCatalog ?? "v1",
    contentSchemaVersion: template.manifest.contentSchemaVersion,
    outputMode: "react-and-static-html",
    status: "draft",
    defaults: { animation: template.manifest.defaultAnimation, transition: defaultTransition },
    slides: [firstSlide],
  };
  writeDeck(root, manifest, slideContent(firstSlide, title, template.manifest.contentSchemaVersion));
  writeDeckSchemaGuidance(root, manifest);
  return root;
}

export function titleFromSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function parseSections(content: string): { prefix: string; sections: string[] } {
  const matches = [...content.matchAll(/^## Slide\s+\d+.*$/gm)];
  if (!matches.length) throw new Error("content.md has no slide sections.");
  const prefix = content.slice(0, matches[0].index);
  const sections = matches.map((match, index) => content.slice(match.index, matches[index + 1]?.index ?? content.length).trimEnd());
  return { prefix, sections };
}

export function sectionId(section: string): string {
  const match = section.match(/^```ya?ml\n[\s\S]*?^id:\s*["']?([^"'\n]+)["']?/m);
  if (!match) throw new Error("A slide section is missing metadata id.");
  return match[1].trim();
}

export function setYamlField(section: string, field: string, value: string): string {
  const line = `${field}: ${JSON.stringify(value)}`;
  const pattern = new RegExp(`^${field}:.*$`, "m");
  return pattern.test(section) ? section.replace(pattern, line) : section.replace(/^```ya?ml\n/, (opening) => `${opening}${line}\n`);
}

export function slideContent(slide: DeckSlide, title: string, contentSchemaVersion = "3.0.0"): string {
  const major = parseContentSchemaMajor(contentSchemaVersion);
  if (major === 1) return legacySlideContent(slide, title);
  if (major === 2 || major === 3) return canonicalSlideContent(slide, title);
  throw new Error(`Unsupported content schema version "${contentSchemaVersion}". Supported schema majors: 1, 2, 3.`);
}

function parseContentSchemaMajor(version: string): number | undefined {
  const match = /^(\d+)\.\d+\.\d+$/.exec(version);
  return match ? Number(match[1]) : undefined;
}

function legacySlideContent(slide: DeckSlide, title: string): string {
  return `## Slide 01: ${title}\n\n\`\`\`yaml\nid: "${slide.id}"\ntype: "${slide.type}"\nstatus: "draft"\nintent: "Describe the purpose of this slide."\nanimation: "${slide.animation ?? "gentle-rise"}"\ntransition: "${slide.transition ?? "none"}"\nicons: []\nassets: []\noverride:\n  layout: "none"\n  animation: "none"\n  reason: ""\n\`\`\`\n\n### On-Slide Text\n\n- Add visible slide copy.\n\n### Visual Direction\n\nDescribe the visual treatment.\n\n### Speaker Notes\n\nAdd presenter notes.\n\n### Design Notes\n\nAdd layout constraints.\n\n### Review Questions\n\n- None.\n`;
}

function canonicalSlideContent(slide: DeckSlide, title: string): string {
  return `## Slide 01 (${slide.id})\n\n\`\`\`yaml\nid: "${slide.id}"\ntype: "${slide.type}"\nstatus: "draft"\nintent: "Describe the purpose of this slide."\nanimation: "${slide.animation ?? "gentle-rise"}"\ntransition: "${slide.transition ?? "none"}"\n\ntitle: ${JSON.stringify(title)}\ndescription: ""\nitems: []\n\noverride:\n  layout: "none"\n  animation: "none"\n  css: ""\n  html: ""\n  reason: ""\n\nassets: []\n\`\`\`\n\n### Speaker Notes\n\nAdd presenter notes.\n\n### Design Notes\n\nAdd layout constraints.\n\n### Review Questions\n\n- None.\n`;
}
