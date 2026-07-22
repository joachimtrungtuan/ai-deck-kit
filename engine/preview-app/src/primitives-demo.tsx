import { useRef, useState } from "react";
import { ChartBlock, CodeBlock, IconTextCardBlock, ImageBlock, ListBlock, QuoteBlock, StatBlock, TableBlock, TextBlock, TitleDescriptionBlock } from "../../primitives/blocks";
import { animateMorphAnchor, resolveMorphPairs } from "../../primitives/motion";
import "../../primitives/blocks/primitives.css";
import "./primitives-demo.css";

const chartBefore = { id: "revenue-before", morph: "revenue", kind: "bar" as const, label: "Q1–Q3 revenue", series: [{ label: "Q1", value: 12 }, { label: "Q2", value: 22 }, { label: "Q3", value: 34 }] };
const chartAfter = { id: "revenue-after", morph: "revenue", kind: "bar" as const, label: "Q1–Q3 revenue forecast", series: [{ label: "Q1", value: 12 }, { label: "Q2", value: 22 }, { label: "Q3", value: 48 }] };

export function PrimitivesDemo() {
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const [showAfter, setShowAfter] = useState(false);
  const pair = resolveMorphPairs([chartBefore], [chartAfter])[0];
  function runMorph() {
    const from = showAfter ? afterRef.current : beforeRef.current;
    const to = showAfter ? beforeRef.current : afterRef.current;
    if (from && to) animateMorphAnchor(from, to);
    setShowAfter((current) => !current);
  }
  return <main className="primitives-demo swiss-deck">
    <header className="primitives-demo-header"><p>AI Deck Kit / Phase 03</p><h1>Design primitives</h1><span>{pair ? `Resolved morph anchor: ${pair.anchor}` : "No morph pair"}</span></header>
    <section className="primitives-demo-grid" aria-label="Block catalog v1">
      <TitleDescriptionBlock block={{ id: "title", title: "Blocks stay neutral", description: "Templates own skin and composition; primitives own stable data contracts.", animation: "gentle-rise" }} />
      <TextBlock block={{ id: "text", text: "Text remains compact and readable across template systems.", animation: "fade" }} />
      <StatBlock block={{ id: "stat", value: "42ms", label: "p95 render time", detail: "Structured metric block" }} />
      <IconTextCardBlock block={{ id: "card", icon: "◈", title: "Token driven", description: "No template-specific color or type value in the component." }} />
      <QuoteBlock block={{ id: "quote", quote: "The primitive should make the common case easy, not make every case possible.", attribution: "AI Deck Kit principle" }} />
      <ListBlock block={{ id: "list", items: ["One vocabulary", "Stable contracts", "Template composition"], ordered: true }} />
      <TableBlock block={{ id: "table", columns: ["Block", "Data"], rows: [["Chart", "series[]"], ["Stat", "value + label"]], caption: "Structured blocks" }} />
      <CodeBlock block={{ id: "code", caption: "content.md", language: "yaml", code: "type: chart\nmorph: revenue\ndata: { kind: bar }" }} />
      <ImageBlock block={{ id: "image", src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'%3E%3Crect width='1200' height='675' fill='%23111214'/%3E%3Cpath d='M0 520 320 240l200 190 210-270 470 360' fill='%235d5d57'/%3E%3C/svg%3E", alt: "Abstract monochrome landscape", caption: "Image block" }} />
    </section>
    <section className="primitives-morph-demo" aria-label="Morph demo"><div className={`primitives-morph-slide ${showAfter ? "is-hidden" : ""}`}><p>Slide N</p><div ref={beforeRef}><ChartBlock block={chartBefore} /></div></div><div className="primitives-morph-controls"><button type="button" onClick={runMorph}>{showAfter ? "← Morph back" : "Morph chart →"}</button><span>same `morph: revenue`</span></div><div className={`primitives-morph-slide ${showAfter ? "" : "is-hidden"}`}><p>Slide N+1</p><div ref={afterRef}><ChartBlock block={chartAfter} /></div></div></section>
  </main>;
}
