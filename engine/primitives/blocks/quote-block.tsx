import type { QuoteBlockData } from "./contracts";
import { BlockShell } from "./block-shell";

export function QuoteBlock({ block }: { block: QuoteBlockData }) {
  return <BlockShell block={block} className="primitive-quote-block"><blockquote>“{block.quote}”</blockquote>{block.attribution ? <cite>{block.attribution}</cite> : null}</BlockShell>;
}
