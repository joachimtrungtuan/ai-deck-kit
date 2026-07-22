export type BlockAnimation = "none" | "fade" | "gentle-rise" | "morph";

export type BlockBase = {
  id: string;
  animation?: BlockAnimation;
  morph?: string;
};

export type TextBlockData = BlockBase & { text: string };
export type TitleDescriptionBlockData = BlockBase & { title: string; description?: string };
export type ImageBlockData = BlockBase & { src: string; alt: string; caption?: string };
export type ChartSeriesItem = { label: string; value: number };
export type ChartBlockData = BlockBase & { kind: "bar"; series: ChartSeriesItem[]; label?: string };
export type TableBlockData = BlockBase & { columns: string[]; rows: string[][]; caption?: string };
export type IconTextCardBlockData = BlockBase & { icon: string; title: string; description: string };
export type QuoteBlockData = BlockBase & { quote: string; attribution?: string };
export type StatBlockData = BlockBase & { value: string; label: string; detail?: string };
export type ListBlockData = BlockBase & { items: string[]; ordered?: boolean };
export type CodeBlockData = BlockBase & { code: string; language?: string; caption?: string };

export type PrimitiveBlockData =
  | TextBlockData
  | TitleDescriptionBlockData
  | ImageBlockData
  | ChartBlockData
  | TableBlockData
  | IconTextCardBlockData
  | QuoteBlockData
  | StatBlockData
  | ListBlockData
  | CodeBlockData;
