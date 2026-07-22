import type { IconTextCardBlockData } from "./contracts";
import { BlockShell } from "./block-shell";

export function IconTextCardBlock({ block }: { block: IconTextCardBlockData }) {
  return <BlockShell block={block} className="primitive-icon-text-card"><span aria-hidden className="primitive-icon">{block.icon}</span><div><h3>{block.title}</h3><p>{block.description}</p></div></BlockShell>;
}
