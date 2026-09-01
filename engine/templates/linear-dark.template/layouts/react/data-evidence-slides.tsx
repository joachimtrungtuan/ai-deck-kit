import { LinearFrame, LinearIconTile, LinearList, LinearSmallLabel, type LinearSlideProps } from "./shared";
import { StatBlock, renderRichText } from "../../../../primitives/blocks";

export function LinearMetricHighlightSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation ?? "spotlight"}>
      <div className="ld-rule-top" style={{ gridColumn: "1 / 8", gridRow: "2 / 7" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ld-space-2)" }}>
          <LinearIconTile name={props.items?.[0]?.icon} />
          <LinearSmallLabel>{renderRichText(props.kicker ?? "Metric")}</LinearSmallLabel>
        </div>
        <div className="ld-metric primitive-anim-spotlight"><StatBlock className="ld-template-stat-block" block={{ id: "metric", value: props.metric ?? props.title, label: props.metricLabel ?? "" }} /></div>
      </div>
      <aside style={{ gridColumn: "9 / 13", gridRow: "4 / 8" }}>
        <LinearList items={props.items} />
      </aside>
    </LinearFrame>
  );
}

export function LinearChartSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <aside className="ld-rule-top" style={{ gridColumn: "1 / 5", gridRow: "1 / 8" }}>
        <LinearSmallLabel>{renderRichText(props.kicker ?? "Chart")}</LinearSmallLabel>
        <h1 className="ld-section-title">{renderRichText(props.title)}</h1>
        {props.body ? <p className="ld-body">{renderRichText(props.body)}</p> : null}
      </aside>
      <div className="ld-panel" style={{ gridColumn: "6 / 13", gridRow: "1 / 8", padding: "40px", display: "grid", alignContent: "center" }}>
        {props.children ?? <LinearSmallLabel>Chart component slot</LinearSmallLabel>}
      </div>
    </LinearFrame>
  );
}

export function LinearEvidenceStackSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <header className="ld-rule-top" style={{ gridColumn: "1 / 6", gridRow: "1 / 4" }}>
        <LinearSmallLabel>{renderRichText(props.kicker ?? "Evidence")}</LinearSmallLabel>
        <h1 className="ld-section-title">{renderRichText(props.title)}</h1>
      </header>
      <section style={{ gridColumn: "7 / 13", gridRow: "2 / 8" }}>
        <LinearList items={props.items} />
      </section>
    </LinearFrame>
  );
}

export function LinearCaseStudySlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <header className="ld-rule-top" style={{ gridColumn: "1 / 8", gridRow: "1 / 4" }}>
        <LinearSmallLabel>{renderRichText(props.kicker ?? "Case Study")}</LinearSmallLabel>
        <h1 className="ld-section-title">{renderRichText(props.title)}</h1>
        {props.body ? <p className="ld-body">{renderRichText(props.body)}</p> : null}
      </header>
      {(props.items ?? []).slice(0, 3).map((item, itemIndex) => (
        <section
          className="ld-panel"
          key={`${itemIndex}-${item.title}`}
          style={{ gridColumn: `${1 + itemIndex * 4} / ${5 + itemIndex * 4}`, gridRow: "4 / 8", padding: "32px", display: "grid", gap: "var(--ld-space-2)", alignContent: "start" }}
        >
          <LinearIconTile name={item.icon} />
          <LinearSmallLabel>{renderRichText(item.title)}</LinearSmallLabel>
          {item.description ? <p className="ld-body">{renderRichText(item.description)}</p> : null}
        </section>
      ))}
    </LinearFrame>
  );
}
