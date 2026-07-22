import type { TextBlockData } from "./contracts";
import { BlockShell } from "./block-shell";

export function TextBlock({ block }: { block: TextBlockData }) {
  return <BlockShell block={block} className="primitive-text-block"><p>{block.text}</p></BlockShell>;
}
