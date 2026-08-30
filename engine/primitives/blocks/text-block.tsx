import type { TextBlockData } from "./contracts";
import { BlockShell } from "./block-shell";
import { renderRichText } from "./rich-text";

export function TextBlock({ block, className = "" }: { block: TextBlockData; className?: string }) {
  return <BlockShell block={block} className={`primitive-text-block ${className}`.trim()}><p>{renderRichText(block.text)}</p></BlockShell>;
}
