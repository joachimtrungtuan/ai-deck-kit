import type { ImageBlockData } from "./contracts";
import { BlockShell } from "./block-shell";

export function ImageBlock({ block }: { block: ImageBlockData }) {
  return <BlockShell block={block} className="primitive-image-block"><img src={block.src} alt={block.alt} />{block.caption ? <figcaption>{block.caption}</figcaption> : null}</BlockShell>;
}
