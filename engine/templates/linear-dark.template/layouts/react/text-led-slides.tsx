import { LinearFrame, LinearList, LinearSmallLabel, LinearTextBlock, type LinearSlideProps } from "./shared";

export function LinearTextStatementSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <div style={{ gridColumn: "1 / 11", gridRow: "2 / 7" }}>
        <LinearTextBlock kicker={props.kicker} title={props.title} body={props.body} />
      </div>
      {props.source ? (
        <div style={{ gridColumn: "1 / 11", gridRow: "7 / 8" }}>
          <LinearSmallLabel>{props.source}</LinearSmallLabel>
        </div>
      ) : null}
    </LinearFrame>
  );
}

export function LinearTextListSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <div className="ld-rule-top" style={{ gridColumn: "1 / 7", gridRow: "1 / 6" }}>
        {props.kicker ? <LinearSmallLabel>{props.kicker}</LinearSmallLabel> : null}
        <h1 className="ld-section-title">{props.title}</h1>
        {props.body ? <p className="ld-body">{props.body}</p> : null}
      </div>
      <div style={{ gridColumn: "8 / 13", gridRow: "1 / 8" }}>
        <LinearList items={props.items} />
      </div>
    </LinearFrame>
  );
}

export function LinearTwoColumnTextSlide(props: LinearSlideProps) {
  const left = (props.items ?? []).filter((item) => item.column === "left");
  const right = (props.items ?? []).filter((item) => item.column !== "left");
  return (
    <LinearFrame animation={props.animation}>
      <header style={{ gridColumn: "1 / 13", gridRow: "1 / 3" }}>
        <div className="ld-rule-top">
          {props.kicker ? <LinearSmallLabel>{props.kicker}</LinearSmallLabel> : null}
          <h1 className="ld-section-title">{props.title}</h1>
        </div>
      </header>
      <section className="ld-panel" style={{ gridColumn: "1 / 7", gridRow: "4 / 8", padding: "32px" }}>
        <LinearSmallLabel>{props.leftTitle ?? "Left"}</LinearSmallLabel>
        <LinearList items={left} />
      </section>
      <section className="ld-panel" style={{ gridColumn: "7 / 13", gridRow: "4 / 8", padding: "32px" }}>
        <LinearSmallLabel>{props.rightTitle ?? "Right"}</LinearSmallLabel>
        <LinearList items={right} />
      </section>
    </LinearFrame>
  );
}

export function LinearQuoteSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation ?? "masked-reveal"}>
      <span
        aria-hidden
        style={{
          gridColumn: "1 / 3",
          gridRow: "1 / 4",
          fontFamily: "var(--ld-font-display)",
          fontSize: "calc(var(--ld-type) * clamp(180px, 22vw, 360px))",
          fontWeight: 700,
          lineHeight: 0.7,
          color: "var(--ld-panel)",
          userSelect: "none",
        }}
      >
        &ldquo;
      </span>
      <blockquote style={{ gridColumn: "2 / 12", gridRow: "2 / 7", margin: 0, zIndex: 1 }}>
        <p className="ld-title ld-title-compact">{props.title}</p>
        {props.attribution ? <footer className="ld-kicker" style={{ marginTop: "var(--ld-space-3)" }}>{props.attribution}</footer> : null}
      </blockquote>
    </LinearFrame>
  );
}

export function LinearNumberedFrameworkSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <div className="ld-rule-top" style={{ gridColumn: "1 / 5", gridRow: "1 / 8" }}>
        <LinearSmallLabel>{props.kicker ?? "Framework"}</LinearSmallLabel>
        <h1 className="ld-section-title">{props.title}</h1>
        {props.body ? <p className="ld-body">{props.body}</p> : null}
      </div>
      <div style={{ gridColumn: "6 / 13", gridRow: "1 / 8" }}>
        <LinearList items={props.items} />
      </div>
    </LinearFrame>
  );
}
