import type { TitleDescriptionBlockData } from "./contracts";
import { BlockShell } from "./block-shell";

export function TitleDescriptionBlock({ block, className = "" }: { block: TitleDescriptionBlockData; className?: string }) {
  return <BlockShell block={block} className={`primitive-title-description ${className}`.trim()}><h2>{block.title}</h2>{block.description ? <p>{block.description}</p> : null}</BlockShell>;
}
