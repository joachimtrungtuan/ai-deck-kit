import type { IconTextCardBlockData } from "./contracts";
import { BlockShell } from "./block-shell";
import { renderRichText } from "./rich-text";

export function IconTextCardBlock({ block, className = "" }: { block: IconTextCardBlockData; className?: string }) {
  return <BlockShell block={block} className={`primitive-icon-text-card ${className}`.trim()}><span aria-hidden className="primitive-icon">{block.icon}</span><div><h3>{renderRichText(block.title)}</h3><p>{renderRichText(block.description)}</p></div></BlockShell>;
}
