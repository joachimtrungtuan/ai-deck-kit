import { SwissFrame, SwissList, SwissSmallLabel, type SwissSlideProps } from "./shared";

export function SwissProcessFlowSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation ?? "line-draw"}>
      <header className="swiss-rule-top" style={{ gridColumn: "1 / 6", gridRow: "1 / 4" }}>
        <SwissSmallLabel>{props.kicker ?? "Process"}</SwissSmallLabel>
        <h1 className="swiss-section-title">{props.title}</h1>
        {props.body ? <p className="swiss-body">{props.body}</p> : null}
      </header>
      <div style={{ gridColumn: "1 / 13", gridRow: "5 / 8", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
        {(props.items ?? []).slice(0, 4).map((item, itemIndex) => (
          <section className="swiss-panel" key={`${itemIndex}-${item.title}`} style={{ padding: "24px" }}>
            <SwissSmallLabel>{String(itemIndex + 1).padStart(2, "0")}</SwissSmallLabel>
            <p className="swiss-body">{item.title}</p>
          </section>
        ))}
      </div>
    </SwissFrame>
  );
}

export function SwissBeforeAfterSlide(props: SwissSlideProps) {
  const before = (props.items ?? []).filter((item) => item.column === "left");
  const after = (props.items ?? []).filter((item) => item.column !== "left");
  return (
    <SwissFrame animation={props.animation}>
      <header className="swiss-rule-top" style={{ gridColumn: "1 / 7", gridRow: "1 / 4" }}>
        <SwissSmallLabel>{props.kicker ?? "Before / After"}</SwissSmallLabel>
        <h1 className="swiss-section-title">{props.title}</h1>
      </header>
      <section className="swiss-panel" style={{ gridColumn: "1 / 6", gridRow: "4 / 9", padding: "32px" }}>
        <SwissSmallLabel>{props.leftTitle ?? "Before"}</SwissSmallLabel>
        <SwissList items={before} />
      </section>
      <div style={{ gridColumn: "6 / 8", gridRow: "5 / 7", alignSelf: "center" }}>
        <p className="swiss-number" style={{ fontSize: "clamp(64px, 7vw, 112px)" }}>&rarr;</p>
      </div>
      <section className="swiss-panel" style={{ gridColumn: "8 / 13", gridRow: "4 / 9", padding: "32px" }}>
        <SwissSmallLabel>{props.rightTitle ?? "After"}</SwissSmallLabel>
        <SwissList items={after} />
      </section>
    </SwissFrame>
  );
}

export function SwissUiShowcaseSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation ?? "soft-scale"}>
      <div className="swiss-media" style={{ gridColumn: "1 / 8", gridRow: "1 / 9" }}>
        {props.imageSrc ? <img src={props.imageSrc} alt={props.imageAlt ?? ""} /> : null}
      </div>
      <aside className="swiss-rule-top" style={{ gridColumn: "9 / 13", gridRow: "2 / 8" }}>
        <SwissSmallLabel>{props.kicker ?? "UI"}</SwissSmallLabel>
        <h1 className="swiss-section-title">{props.title}</h1>
        {props.body ? <p className="swiss-body">{props.body}</p> : null}
        <SwissList items={props.items} />
      </aside>
    </SwissFrame>
  );
}

export function SwissTimelineSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <header className="swiss-rule-top" style={{ gridColumn: "1 / 6", gridRow: "1 / 4" }}>
        <SwissSmallLabel>{props.kicker ?? "Timeline"}</SwissSmallLabel>
        <h1 className="swiss-section-title">{props.title}</h1>
        {props.body ? <p className="swiss-body">{props.body}</p> : null}
      </header>
      <div style={{ gridColumn: "7 / 13", gridRow: "2 / 8" }}>
        <SwissList items={props.items} />
      </div>
    </SwissFrame>
  );
}
