import type { TitleDescriptionBlockData } from "./contracts";
import { BlockShell } from "./block-shell";

export function TitleDescriptionBlock({ block }: { block: TitleDescriptionBlockData }) {
  return <BlockShell block={block} className="primitive-title-description"><h2>{block.title}</h2>{block.description ? <p>{block.description}</p> : null}</BlockShell>;
}
