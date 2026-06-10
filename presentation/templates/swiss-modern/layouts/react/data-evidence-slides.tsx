import { SwissFrame, SwissList, SwissSmallLabel, type SwissSlideProps } from "./shared";

export function SwissMetricHighlightSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation ?? "spotlight"}>
      <div className="swiss-rule-top" style={{ gridColumn: "1 / 8", gridRow: "2 / 7" }}>
        <SwissSmallLabel>{props.kicker ?? "Metric"}</SwissSmallLabel>
        <div className="swiss-metric">{props.metric ?? props.title}</div>
        {props.metricLabel ? <p className="swiss-body">{props.metricLabel}</p> : null}
      </div>
      <aside style={{ gridColumn: "9 / 13", gridRow: "4 / 8" }}>
        <SwissList items={props.items} />
      </aside>
    </SwissFrame>
  );
}

export function SwissChartSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <aside className="swiss-rule-top" style={{ gridColumn: "1 / 5", gridRow: "1 / 8" }}>
        <SwissSmallLabel>{props.kicker ?? "Chart"}</SwissSmallLabel>
        <h1 className="swiss-section-title">{props.title}</h1>
        {props.body ? <p className="swiss-body">{props.body}</p> : null}
      </aside>
      <div className="swiss-panel" style={{ gridColumn: "6 / 13", gridRow: "1 / 8", padding: "40px" }}>
        {props.children ?? <SwissSmallLabel>Chart component slot</SwissSmallLabel>}
      </div>
    </SwissFrame>
  );
}

export function SwissEvidenceStackSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <header className="swiss-rule-top" style={{ gridColumn: "1 / 6", gridRow: "1 / 4" }}>
        <SwissSmallLabel>{props.kicker ?? "Evidence"}</SwissSmallLabel>
        <h1 className="swiss-section-title">{props.title}</h1>
      </header>
      <section style={{ gridColumn: "7 / 13", gridRow: "2 / 8" }}>
        <SwissList items={props.items} />
      </section>
    </SwissFrame>
  );
}

export function SwissCaseStudySlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <header className="swiss-rule-top" style={{ gridColumn: "1 / 8", gridRow: "1 / 4" }}>
        <SwissSmallLabel>{props.kicker ?? "Case Study"}</SwissSmallLabel>
        <h1 className="swiss-section-title">{props.title}</h1>
        {props.body ? <p className="swiss-body">{props.body}</p> : null}
      </header>
      {(props.items ?? []).slice(0, 3).map((item, itemIndex) => (
        <section
          className="swiss-panel"
          key={item}
          style={{ gridColumn: `${1 + itemIndex * 4} / ${5 + itemIndex * 4}`, gridRow: "4 / 8", padding: "32px" }}
        >
          <SwissSmallLabel>{["Context", "Action", "Result"][itemIndex]}</SwissSmallLabel>
          <p className="swiss-body">{item}</p>
        </section>
      ))}
    </SwissFrame>
  );
}
