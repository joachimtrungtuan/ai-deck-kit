import type { StatBlockData } from "./contracts";
import { BlockShell } from "./block-shell";

export function StatBlock({ block }: { block: StatBlockData }) {
  return <BlockShell block={block} className="primitive-stat-block"><strong>{block.value}</strong><span>{block.label}</span>{block.detail ? <small>{block.detail}</small> : null}</BlockShell>;
}
