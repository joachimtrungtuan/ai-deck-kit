import type { TitleDescriptionBlockData } from "./contracts";
import { BlockShell } from "./block-shell";
import { renderRichText } from "./rich-text";

export function TitleDescriptionBlock({ block, className = "" }: { block: TitleDescriptionBlockData; className?: string }) {
  return <BlockShell block={block} className={`primitive-title-description ${className}`.trim()}><h2>{renderRichText(block.title)}</h2>{block.description ? <p>{renderRichText(block.description)}</p> : null}</BlockShell>;
}
