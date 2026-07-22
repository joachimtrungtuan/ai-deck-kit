import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChartBlock, CodeBlock, IconTextCardBlock, ImageBlock, ListBlock, QuoteBlock, StatBlock, TableBlock, TextBlock, TitleDescriptionBlock } from ".";

const meta = { title: "Primitives/Blocks", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Text: Story = { render: () => <TextBlock block={{ id: "text", text: "Prose stays compact and legible across template skins." }} /> };
export const TitleDescription: Story = { render: () => <TitleDescriptionBlock block={{ id: "title-description", title: "A stable vocabulary", description: "Templates compose primitives rather than recreating their data contracts." }} /> };
export const Image: Story = { render: () => <ImageBlock block={{ id: "image", src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'%3E%3Crect width='1200' height='675' fill='%23111214'/%3E%3Cpath d='M0 520 320 240l200 190 210-270 470 360' fill='%235d5d57'/%3E%3C/svg%3E", alt: "Abstract monochrome landscape", caption: "Local or embedded asset" }} /> };
export const Chart: Story = { render: () => <ChartBlock block={{ id: "chart", kind: "bar", label: "Quarterly revenue", series: [{ label: "Q1", value: 12 }, { label: "Q2", value: 22 }, { label: "Q3", value: 34 }] }} /> };
export const Table: Story = { render: () => <TableBlock block={{ id: "table", caption: "Structured data", columns: ["Block", "Required data"], rows: [["Chart", "series[]"], ["Stat", "value + label"]] }} /> };
export const IconTextCard: Story = { render: () => <IconTextCardBlock block={{ id: "icon-text-card", icon: "◈", title: "Token skinned", description: "The component uses the base token contract, not Swiss-specific values." }} /> };
export const Quote: Story = { render: () => <QuoteBlock block={{ id: "quote", quote: "The primitive makes common composition consistent without taking design ownership from templates.", attribution: "AI Deck Kit" }} /> };
export const Stat: Story = { render: () => <StatBlock block={{ id: "stat", value: "42ms", label: "p95 render time", detail: "Structured metric" }} /> };
export const List: Story = { render: () => <ListBlock block={{ id: "list", ordered: true, items: ["Stable contract", "Template skin", "Deck composition"] }} /> };
export const Code: Story = { render: () => <CodeBlock block={{ id: "code", language: "yaml", caption: "content.md", code: "type: chart\nmorph: revenue\ndata: { kind: bar }" }} /> };
export const MorphPair: Story = { render: () => <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "24px" }}><ChartBlock block={{ id: "revenue-before", morph: "revenue", kind: "bar", label: "Slide N", series: [{ label: "Q1", value: 12 }, { label: "Q2", value: 22 }] }} /><ChartBlock block={{ id: "revenue-after", morph: "revenue", kind: "bar", label: "Slide N+1", series: [{ label: "Q1", value: 12 }, { label: "Q2", value: 48 }] }} /></div> };
