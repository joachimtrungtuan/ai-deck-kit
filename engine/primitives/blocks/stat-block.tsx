import type { StatBlockData } from "./contracts";
import { BlockShell } from "./block-shell";

export function StatBlock({ block, className = "" }: { block: StatBlockData; className?: string }) {
  return <BlockShell block={block} className={`primitive-stat-block ${className}`.trim()}><strong>{block.value}</strong><span>{block.label}</span>{block.detail ? <small>{block.detail}</small> : null}</BlockShell>;
}
