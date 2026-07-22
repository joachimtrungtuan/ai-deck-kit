import type { ComponentType } from "react";
import { LinearAgendaSlide, LinearClosingSlide, LinearIconGridSlide, LinearProcessFlowSlide, LinearSpecTableSlide, LinearTextListSlide, LinearTitleSlide } from "../../templates/linear-dark/layouts/react";
import { SwissAgendaSlide, SwissClosingSlide, SwissIconGridSlide, SwissProcessFlowSlide, SwissTextListSlide, SwissTitleSlide } from "../../templates/swiss-modern/layouts/react";
import type { PreviewSource } from "./preview-types";

type Manifest = { title: string; slug: string; template: { set: string }; slides: { id: string; type: string; animation?: string }[] };
type ParsedSection = { title: string; items: string[]; table?: string[][]; icons: string[]; anchors: string[] };

export function createManifestDeckSource(manifest: Manifest, content: string): PreviewSource {
  const sections = parseSections(content);
  const linear = manifest.template.set === "linear-dark";
  return { id: manifest.slug, label: manifest.title, deckClass: linear ? "ld-deck" : "swiss-deck", slides: manifest.slides.map((slide) => {
    const section = sections.get(slide.id) ?? { title: slide.type, items: [], icons: [], anchors: [] };
    const [first, ...rest] = section.items;
    return { id: slide.id, type: slide.type, Component: componentFor(slide.type, linear), morphAnchors: section.anchors, props: {
      animation: slide.animation ?? "gentle-rise", kicker: manifest.title, title: section.title, body: first, items: section.items, icons: section.icons,
      tableColumns: section.table?.[0], tableRows: section.table?.slice(1), leftItems: section.items.slice(0, Math.ceil(section.items.length / 2)), rightItems: section.items.slice(Math.ceil(section.items.length / 2)), ...(rest.length ? { consequences: rest } : {}),
    } };
  }) };
}

function componentFor(type: string, linear: boolean): ComponentType<any> {
  if (linear) return ({ title, ...props }) => {
    if (type === "title") return <LinearTitleSlide title={title} {...props} />;
    if (type === "agenda") return <LinearAgendaSlide title={title} {...props} />;
    if (type === "closing") return <LinearClosingSlide title={title} {...props} />;
    if (type === "icon-grid") return <LinearIconGridSlide title={title} {...props} />;
    if (type === "process-flow") return <LinearProcessFlowSlide title={title} {...props} />;
    if (type === "spec-table" || type === "comparison-table") return <LinearSpecTableSlide title={title} {...props} />;
    return <LinearTextListSlide title={title} {...props} />;
  };
  return ({ title, ...props }) => {
    if (type === "title") return <SwissTitleSlide title={title} {...props} />;
    if (type === "agenda") return <SwissAgendaSlide title={title} {...props} />;
    if (type === "closing") return <SwissClosingSlide title={title} {...props} />;
    if (type === "icon-grid") return <SwissIconGridSlide title={title} {...props} />;
    if (type === "process-flow") return <SwissProcessFlowSlide title={title} {...props} />;
    return <SwissTextListSlide title={title} {...props} />;
  };
}

function parseSections(content: string): Map<string, ParsedSection> {
  const sections = new Map<string, ParsedSection>();
  for (const part of content.split(/^## Slide \d+: /m).slice(1)) {
    const [title = "Untitled", ...body] = part.split("\n");
    const text = body.join("\n");
    const id = text.match(/^id:\s*["']?([^"'\n]+)/m)?.[1];
    if (!id) continue;
    const onSlide = text.match(/### On-Slide Text\n([\s\S]*?)(?=\n### |$)/)?.[1] ?? "";
    const tableRows = [...onSlide.matchAll(/^\|(.+)\|$/gm)].map((row) => row[1].split("|").map((cell) => cell.trim()));
    const table = tableRows.filter((row) => !row.every((cell) => /^-+$/.test(cell)));
    const items = [...onSlide.matchAll(/^[-*]\s+(.+)$/gm)].map((item) => item[1].trim());
    const icons = [...text.matchAll(/^\s*-?\s*["']?([a-z-]+)["']?\s*$/gm)].map((match) => match[1]).filter((value) => /^(target|stack|lightning|shield|database|cloud|branch|code|terminal|plugs|users|chart|rocket|lock|sync|cpu|globe)$/.test(value));
    const anchors = [...text.matchAll(/^\s*morph:\s*["']?([^"'\n]+)/gm)].map((match) => match[1].trim());
    sections.set(id, { title: title.trim(), items, table: table.length ? table : undefined, icons, anchors });
  }
  return sections;
}
