import type { ImageBlockData } from "./contracts";
import { BlockShell } from "./block-shell";

export function ImageBlock({ block, className = "" }: { block: ImageBlockData; className?: string }) {
  return <BlockShell block={block} className={`primitive-image-block ${className}`.trim()}><img src={block.src} alt={block.alt} />{block.caption ? <figcaption>{block.caption}</figcaption> : null}</BlockShell>;
}
