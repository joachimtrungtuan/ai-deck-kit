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

export function createManifestDeckSource(
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
    const items = arrayMeta<SlideItem>(metadata, "items") ?? [];
    const layoutVariant = textMeta(metadata, "layoutVariant");
    const parsedSlide = {
      id: slide.id,
      type: slide.type,
      Component,
      morphAnchors: section.anchors,
      layoutVariant,
      transition: slide.transition as PreviewSlide["transition"],
      override: objectMeta<SlideOverride>(metadata, "override"),
      props: {
        animation: slide.animation ?? "gentle-rise",
        kicker: textMeta(metadata, "kicker"),
        title: textMeta(metadata, "title") ?? "Untitled",
        body: textMeta(metadata, "description"),
        items,
        leftTitle: textMeta(metadata, "leftTitle"),
        rightTitle: textMeta(metadata, "rightTitle"),
        tableColumns: arrayMeta<string>(metadata, "tableColumns"),
        tableRows: arrayMeta<string[]>(metadata, "tableRows"),
        code: textMeta(metadata, "code"),
        language: textMeta(metadata, "language"),
        highlightLines: arrayMeta<number>(metadata, "highlightLines"),
        layoutVariant,
        backgroundVariant: textMeta(metadata, "backgroundVariant"),
        highlightPhrase: textMeta(metadata, "highlightPhrase"),
        courseName: textMeta(metadata, "courseName") ?? manifest.title,
        lessonName: textMeta(metadata, "lessonName"),
        sectionName: textMeta(metadata, "sectionName"),
        imageSrc: textMeta(metadata, "imageSrc"),
        imageAlt: textMeta(metadata, "imageAlt"),
        imagePosition: textMeta(metadata, "imagePosition"),
        images: arrayMeta(metadata, "images"),
        caption: textMeta(metadata, "caption"),
        source: textMeta(metadata, "source"),
        attribution: textMeta(metadata, "attribution"),
        metric: textMeta(metadata, "metric"),
        metricLabel: textMeta(metadata, "metricLabel"),
        chartData: arrayMeta(metadata, "chartData"),
        stats: arrayMeta(metadata, "stats"),
        regionSeries: arrayMeta(metadata, "regionSeries"),
        index: numberMeta(metadata, "index"),
        recommendedColumn: numberMeta(metadata, "recommendedColumn"),
        consequences: arrayMeta<string>(metadata, "consequences"),
        pageCurrent: index + 1,
        pageTotal: total,
      },
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
