import type { ListBlockData } from "./contracts";
import { BlockShell } from "./block-shell";

export function ListBlock({ block, className = "" }: { block: ListBlockData; className?: string }) {
  const List = block.ordered ? "ol" : "ul";
  return <BlockShell block={block} className={`primitive-list-block ${className}`.trim()}><List>{block.items.map((item) => <li key={item}>{item}</li>)}</List></BlockShell>;
}
