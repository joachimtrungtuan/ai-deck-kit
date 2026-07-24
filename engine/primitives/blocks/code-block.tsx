import type { CodeBlockData } from "./contracts";
import { BlockShell } from "./block-shell";

export function CodeBlock({ block, className = "" }: { block: CodeBlockData; className?: string }) {
  return <BlockShell block={block} className={`primitive-code-block ${className}`.trim()}>{block.caption ? <p className="primitive-label">{block.caption}</p> : null}<pre><code className={block.language ? `language-${block.language}` : undefined}>{block.code}</code></pre></BlockShell>;
}
