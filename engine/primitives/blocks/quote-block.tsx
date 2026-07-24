import type { QuoteBlockData } from "./contracts";
import { BlockShell } from "./block-shell";

export function QuoteBlock({ block, className = "" }: { block: QuoteBlockData; className?: string }) {
  return <BlockShell block={block} className={`primitive-quote-block ${className}`.trim()}><blockquote>“{block.quote}”</blockquote>{block.attribution ? <cite>{block.attribution}</cite> : null}</BlockShell>;
}
