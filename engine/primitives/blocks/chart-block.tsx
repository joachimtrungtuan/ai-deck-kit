import type { ChartBlockData } from "./contracts";
import { BlockShell } from "./block-shell";

export function ChartBlock({ block }: { block: ChartBlockData }) {
  const maximum = Math.max(...block.series.map((item) => item.value), 1);
  return (
    <BlockShell block={block} className="primitive-chart-block">
      {block.label ? <p className="primitive-label">{block.label}</p> : null}
      <div className="primitive-chart-bars" aria-label={block.label ?? "Bar chart"} role="img">
        {block.series.map((item) => <div className="primitive-chart-column" key={item.label}><span style={{ height: `${(item.value / maximum) * 100}%` }} /><small>{item.label}</small></div>)}
      </div>
    </BlockShell>
  );
}
