import type { TextBlockData } from "./contracts";
import { BlockShell } from "./block-shell";

export function TextBlock({ block, className = "" }: { block: TextBlockData; className?: string }) {
  return <BlockShell block={block} className={`primitive-text-block ${className}`.trim()}><p>{block.text}</p></BlockShell>;
}
