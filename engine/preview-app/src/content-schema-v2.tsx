import { parse as parseYaml } from "yaml";
import type { ComponentType } from "react";
import type { PreviewSlide, PreviewSource, SlideOverride } from "./preview-types";

type Manifest = {
  title: string;
  slug: string;
  template: { set: string };
  defaults?: { animation?: string; transition?: string };
  slides: { id: string; type: string; animation?: string; transition?: string }[];
};

type SlideItem = {
  title: string;
  description?: string;
  icon?: string;
  column?: "left" | "right";
};

type ParsedSection = {
  anchors: string[];
  metadata: Record<string, unknown>;
};

type ReaderContext = { index: number; manifest: Manifest; metadata: Record<string, unknown>; total: number };

const layoutPropReaders: Record<string, (context: ReaderContext) => unknown> = {
  kicker: ({ metadata }) => textMeta(metadata, "kicker"), title: ({ metadata }) => textMeta(metadata, "title") ?? "Untitled", description: ({ metadata }) => textMeta(metadata, "description"), items: ({ metadata }) => arrayMeta<SlideItem>(metadata, "items") ?? [], leftTitle: ({ metadata }) => textMeta(metadata, "leftTitle"), rightTitle: ({ metadata }) => textMeta(metadata, "rightTitle"), tableColumns: ({ metadata }) => arrayMeta<string>(metadata, "tableColumns"), tableRows: ({ metadata }) => arrayMeta<string[]>(metadata, "tableRows"), tableColumnWidths: ({ metadata }) => arrayMeta<number | string>(metadata, "tableColumnWidths"), code: ({ metadata }) => textMeta(metadata, "code"), language: ({ metadata }) => textMeta(metadata, "language"), highlightLines: ({ metadata }) => arrayMeta<number>(metadata, "highlightLines"), commands: ({ metadata }) => arrayMeta<{ prompt: string; output?: string }>(metadata, "commands"), flowSteps: ({ metadata }) => arrayMeta<{ from: string; to: string; label: string; icon?: string }>(metadata, "flowSteps"), method: ({ metadata }) => textMeta(metadata, "method"), path: ({ metadata }) => textMeta(metadata, "path"), requestExample: ({ metadata }) => textMeta(metadata, "requestExample"), responseExample: ({ metadata }) => textMeta(metadata, "responseExample"), layoutVariant: ({ metadata }) => textMeta(metadata, "layoutVariant"), backgroundVariant: ({ metadata }) => textMeta(metadata, "backgroundVariant"), highlightPhrase: ({ metadata }) => textMeta(metadata, "highlightPhrase"), courseName: ({ metadata, manifest }) => textMeta(metadata, "courseName") ?? manifest.title, lessonName: ({ metadata }) => textMeta(metadata, "lessonName"), sectionName: ({ metadata }) => textMeta(metadata, "sectionName"), imageSrc: ({ metadata }) => textMeta(metadata, "imageSrc"), imageAlt: ({ metadata }) => textMeta(metadata, "imageAlt"), imagePosition: ({ metadata }) => textMeta(metadata, "imagePosition"), images: ({ metadata }) => arrayMeta(metadata, "images"), caption: ({ metadata }) => textMeta(metadata, "caption"), source: ({ metadata }) => textMeta(metadata, "source"), attribution: ({ metadata }) => textMeta(metadata, "attribution"), metric: ({ metadata }) => textMeta(metadata, "metric"), metricLabel: ({ metadata }) => textMeta(metadata, "metricLabel"), chartData: ({ metadata }) => arrayMeta(metadata, "chartData"), stats: ({ metadata }) => arrayMeta(metadata, "stats"), regionSeries: ({ metadata }) => arrayMeta(metadata, "regionSeries"), index: ({ metadata }) => numberMeta(metadata, "index"), recommendedColumn: ({ metadata }) => numberMeta(metadata, "recommendedColumn"), context: ({ metadata }) => textMeta(metadata, "context"), decision: ({ metadata }) => textMeta(metadata, "decision"), consequences: ({ metadata }) => arrayMeta<string>(metadata, "consequences"),
};

/** Authoring keys the deck contract owns: the validator requires them and the CLI scaffolds
 * them, but the renderer reads them from deck.json rather than from the slide fence. They are
 * recognized so the editor does not flag them as unread. */
const authoringSlideYamlKeys = ["status", "intent", "animation", "transition", "assets", "icons"];

/** Navigation-only keys: read into the slide record for the slide list, never passed to layouts,
 * so they cannot appear on the slide itself. */
const navigationSlideYamlKeys = ["tocTitle"];

export const recognizedSlideYamlKeys = new Set(["id", "type", "override", ...authoringSlideYamlKeys, ...navigationSlideYamlKeys, ...Object.keys(layoutPropReaders)]);

export function createManifestDeckSourceV2(
  manifest: Manifest,
  content: string,
  deckClass: string,
  components: Record<string, ComponentType<any>>,
): PreviewSource {
  const sections = parseSections(content);
  const total = manifest.slides.length;
  const slides: PreviewSlide[] = manifest.slides.map((slide, index) => {
    const section = sections.get(slide.id) ?? emptySection();
    const metadata = section.metadata;
    const Component = components[slide.type];
    if (!Component) throw new Error(`Template component missing for slide type "${slide.type}".`);
    const layoutVariant = textMeta(metadata, "layoutVariant");
    const parsedSlide = {
      id: slide.id,
      type: slide.type,
      tocTitle: textMeta(metadata, "tocTitle"),
      Component,
      morphAnchors: section.anchors,
      layoutVariant,
      transition: slide.transition as PreviewSlide["transition"],
      override: objectMeta<SlideOverride>(metadata, "override"),
      props: createLayoutProps(metadata, manifest, slide.animation, index, total),
    };
    return parsedSlide;
  });
  return {
    id: manifest.slug,
    label: manifest.title,
    deckClass,
    slides,
    defaultTransition: manifest.defaults?.transition as PreviewSource["defaultTransition"],
  };
}

function createLayoutProps(metadata: Record<string, unknown>, manifest: Manifest, animation: string | undefined, index: number, total: number): Record<string, unknown> {
  const context = { metadata, manifest, index, total };
  return { animation: animation ?? "gentle-rise", body: layoutPropReaders.description(context), ...Object.fromEntries(Object.entries(layoutPropReaders).filter(([key]) => key !== "description").map(([key, read]) => [key, read(context)])), pageCurrent: index + 1, pageTotal: total };
}

function parseSections(content: string): Map<string, ParsedSection> {
  const sections = new Map<string, ParsedSection>();
  const headers = [...content.matchAll(/^## Slide\s+\d+.*$/gm)];
  headers.forEach((header, index) => {
    const start = header.index ?? 0;
    const end = headers[index + 1]?.index ?? content.length;
    const text = content.slice(start, end);
    const metadataText = text.match(/```ya?ml\n([\s\S]*?)\n```/)?.[1] ?? "";
    const metadata = parseMetadata(metadataText);
    const id = textMeta(metadata, "id");
    if (!id) return;
    sections.set(id, { anchors: collectMorphAnchors(metadata), metadata });
  });
  return sections;
}

function emptySection(): ParsedSection {
  return { anchors: [], metadata: {} };
}

function parseMetadata(yamlText: string): Record<string, unknown> {
  if (!yamlText.trim()) return {};
  const parsed = parseYaml(yamlText);
  return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
}

function collectMorphAnchors(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) node.forEach((item) => collectMorphAnchors(item, out));
  else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (key === "morph" && typeof value === "string") out.push(value);
      else collectMorphAnchors(value, out);
    }
  }
  return out;
}

function textMeta(metadata: Record<string, unknown>, key: string): string | undefined {
  const value = metadata[key];
  return typeof value === "string" && value ? value : undefined;
}

function numberMeta(metadata: Record<string, unknown>, key: string): number | undefined {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function arrayMeta<T = unknown>(metadata: Record<string, unknown>, key: string): T[] | undefined {
  const value = metadata[key];
  return Array.isArray(value) ? value as T[] : undefined;
}

function objectMeta<T = Record<string, unknown>>(metadata: Record<string, unknown>, key: string): T | undefined {
  const value = metadata[key];
  return value && typeof value === "object" && !Array.isArray(value) ? value as T : undefined;
}
