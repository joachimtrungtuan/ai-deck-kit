import type { ReactNode } from "react";
import type { BlockBase } from "./contracts";

export function BlockShell({ block, children, className = "" }: { block: BlockBase; children: ReactNode; className?: string }) {
  return (
    <section
      className={`primitive-block primitive-anim-${block.animation ?? "none"} ${className}`.trim()}
      data-morph-anchor={block.morph}
      data-primitive-block={block.id}
    >
      {children}
    </section>
  );
}
