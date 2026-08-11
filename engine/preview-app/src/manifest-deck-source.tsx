import type { ComponentType } from "react";
import type { PreviewSlide, PreviewSource } from "./preview-types";

type Manifest = {
  title: string;
  slug: string;
  template: { set: string };
  slides: { id: string; type: string; animation?: string }[];
};

type ParsedSection = {
  title: string;
  items: string[];
  table?: string[][];
  code?: string;
  language?: string;
  anchors: string[];
  body?: string;
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
    const section = sections.get(slide.id) ?? emptySection(slide.type);
    const Component = components[slide.type];
    if (!Component) throw new Error(`Template component missing for slide type "${slide.type}".`);
    const metadataItems = arrayMeta<string>(section.metadata, "items");
    const items = metadataItems ?? section.items;
    const [first, ...rest] = items;
    const splitAt = Math.ceil(items.length / 2);
    const layoutVariant = textMeta(section.metadata, "layoutVariant");
    const listDriven = ["rule-list", "two-column", "next-steps"].includes(layoutVariant ?? "");
    return {
      id: slide.id,
      type: slide.type,
      Component,
      morphAnchors: section.anchors,
      layoutVariant,
      props: {
        animation: slide.animation ?? "gentle-rise",
        kicker: textMeta(section.metadata, "kicker"),
        title: section.title,
        body: textMeta(section.metadata, "body") ?? section.body ?? (listDriven ? undefined : first),
        items,
        leftTitle: textMeta(section.metadata, "leftTitle"),
        rightTitle: textMeta(section.metadata, "rightTitle"),
        leftItems: arrayMeta<string>(section.metadata, "leftItems") ?? items.slice(0, splitAt),
        rightItems: arrayMeta<string>(section.metadata, "rightItems") ?? items.slice(splitAt),
        tableColumns: arrayMeta<string>(section.metadata, "tableColumns") ?? section.table?.[0],
        tableRows: arrayMeta<string[]>(section.metadata, "tableRows") ?? section.table?.slice(1),
        code: section.code,
        language: section.language ?? textMeta(section.metadata, "language"),
        highlightLines: arrayMeta<number>(section.metadata, "highlightLines"),
        layoutVariant,
        backgroundVariant: textMeta(section.metadata, "backgroundVariant"),
        highlightPhrase: textMeta(section.metadata, "highlightPhrase"),
        courseName: textMeta(section.metadata, "courseName") ?? manifest.title,
        lessonName: textMeta(section.metadata, "lessonName"),
        sectionName: textMeta(section.metadata, "sectionName"),
        imageSrc: textMeta(section.metadata, "imageSrc"),
        imageAlt: textMeta(section.metadata, "imageAlt"),
        imagePosition: textMeta(section.metadata, "imagePosition"),
        images: arrayMeta(section.metadata, "images"),
        caption: textMeta(section.metadata, "caption"),
        source: textMeta(section.metadata, "source"),
        attribution: textMeta(section.metadata, "attribution"),
        metric: textMeta(section.metadata, "metric"),
        metricLabel: textMeta(section.metadata, "metricLabel"),
        chartData: arrayMeta(section.metadata, "chartData"),
        recommendedColumn: numberMeta(section.metadata, "recommendedColumn"),
        pageCurrent: index + 1,
        pageTotal: total,
        ...(rest.length ? { consequences: rest } : {}),
      },
    };
  });
  return { id: manifest.slug, label: manifest.title, deckClass, slides };
}

function parseSections(content: string): Map<string, ParsedSection> {
  const sections = new Map<string, ParsedSection>();
  for (const part of content.split(/^## Slide \d+: /m).slice(1)) {
    const [title = "Untitled", ...sectionLines] = part.split("\n");
    const text = sectionLines.join("\n");
    const metadataText = text.match(/```ya?ml\n([\s\S]*?)\n```/)?.[1] ?? "";
    const metadata = parseMetadata(metadataText);
    const id = textMeta(metadata, "id");
    if (!id) continue;
    const onSlide = text.match(/### On-Slide Text\n([\s\S]*?)(?=\n### |$)/)?.[1] ?? "";
    const tableRows = [...onSlide.matchAll(/^\|(.+)\|$/gm)].map((row) => row[1].split("|").map((cell) => cell.trim()));
    const table = tableRows.filter((row) => !row.every((cell) => /^-+$/.test(cell)));
    const items = [...onSlide.matchAll(/^[-*]\s+(.+)$/gm)].map((item) => item[1].trim());
    const codeMatch = onSlide.match(/```([\w-]*)\n([\s\S]*?)\n```/);
    const body = onSlide
      .replace(/```[\s\S]*?```/g, "")
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line && !/^[-*]\s+/.test(line) && !/^\|.*\|$/.test(line));
    const anchors = [...metadataText.matchAll(/^\s*morph:\s*["']?([^"'\n]+)/gm)].map((match) => match[1].trim());
    sections.set(id, {
      title: title.trim(),
      items,
      table: table.length ? table : undefined,
      code: codeMatch?.[2],
      language: codeMatch?.[1] || textMeta(metadata, "language"),
      anchors,
      body,
      metadata,
    });
  }
  return sections;
}

function emptySection(title: string): ParsedSection {
  return { title, items: [], anchors: [], metadata: {} };
}

function parseMetadata(yaml: string): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};
  for (const match of yaml.matchAll(/^([A-Za-z][\w-]*):\s*(.*?)\s*$/gm)) {
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (/^[\[{]/.test(value)) {
      try {
        metadata[key] = JSON.parse(value);
        continue;
      } catch {
        // Preserve valid YAML flow text that is not strict JSON.
      }
    }
    if (/^-?\d+(?:\.\d+)?$/.test(value)) metadata[key] = Number(value);
    else if (value === "true" || value === "false") metadata[key] = value === "true";
    else metadata[key] = value;
  }
  return metadata;
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
