import { Fragment } from "react";
import { LinearFrame, LinearIconTile, LinearList, LinearSmallLabel, type LinearSlideProps } from "./shared";

export function LinearProcessFlowSlide(props: LinearSlideProps) {
  const steps = (props.items ?? []).slice(0, 4);
  return (
    <LinearFrame animation={props.animation ?? "line-draw"}>
      <header className="ld-rule-top" style={{ gridColumn: "1 / 8", gridRow: "1 / 4" }}>
        <LinearSmallLabel>{props.kicker ?? "Process"}</LinearSmallLabel>
        <h1 className="ld-section-title">{props.title}</h1>
        {props.body ? <p className="ld-body">{props.body}</p> : null}
      </header>
      <div style={{ gridColumn: "1 / 13", gridRow: "5 / 8", display: "flex", alignItems: "stretch", gap: "16px" }}>
        {steps.map((item, i) => (
          <Fragment key={item}>
            <div
              className="ld-panel ld-anim-gentle-rise"
              style={{ flex: 1, padding: "24px", display: "grid", gridTemplateRows: "auto 1fr", gap: "16px", animationDelay: `calc(var(--ld-stagger) * ${i})` }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <LinearIconTile name={props.icons?.[i]} />
                <span className="ld-index" style={{ color: "var(--ld-accent)" }}>{String(i + 1).padStart(2, "0")}</span>
              </div>
              <p className="ld-body" style={{ color: "var(--ld-ink)", fontWeight: 500, alignSelf: "stretch" }}>{item}</p>
            </div>
            {i < steps.length - 1 ? (
              <span
                className="ld-connector-arrow ld-anim-gentle-rise"
                style={{ display: "flex", alignItems: "center", animationDelay: `calc(var(--ld-stagger) * ${i} + 40ms)` }}
                aria-hidden
              >
                &rarr;
              </span>
            ) : null}
          </Fragment>
        ))}
      </div>
    </LinearFrame>
  );
}

export function LinearBeforeAfterSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <header className="ld-rule-top" style={{ gridColumn: "1 / 10", gridRow: "1 / 4" }}>
        <LinearSmallLabel>{props.kicker ?? "Before / After"}</LinearSmallLabel>
        <h1 className="ld-section-title">{props.title}</h1>
      </header>
      <section className="ld-panel" style={{ gridColumn: "1 / 6", gridRow: "4 / 8", padding: "24px 32px" }}>
        <LinearSmallLabel>{props.leftTitle ?? "Before"}</LinearSmallLabel>
        <LinearList items={props.leftItems} className="ld-list-compact-tall-text" itemTextStyle={props.beforeAfterItemTextStyle} />
      </section>
      <div style={{ gridColumn: "6 / 8", gridRow: "4 / 8", alignSelf: "center", textAlign: "center" }}>
        <p className="ld-connector-arrow" style={{ margin: 0, fontSize: "calc(var(--ld-type) * clamp(56px, 6vw, 96px))", fontWeight: 400 }}>&rarr;</p>
      </div>
      <section className="ld-panel ld-panel-accent" style={{ gridColumn: "8 / 13", gridRow: "4 / 8", padding: "24px 32px" }}>
        <LinearSmallLabel>{props.rightTitle ?? "After"}</LinearSmallLabel>
        <LinearList items={props.rightItems} className="ld-list-compact-tall-text" itemTextStyle={props.beforeAfterItemTextStyle} />
      </section>
    </LinearFrame>
  );
}

export function LinearUiShowcaseSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation ?? "soft-scale"}>
      <div className="ld-panel" style={{ gridColumn: "1 / 8", gridRow: "1 / 9", overflow: "hidden", display: "grid", gridTemplateRows: "auto 1fr" }}>
        <div className="ld-chrome">
          <span /><span /><span />
          <span className="ld-chrome-label">{props.caption ?? "app.linear.dark"}</span>
        </div>
        <div className="ld-media" style={{ border: "none", borderRadius: 0 }}>
          {props.imageSrc ? <img src={props.imageSrc} alt={props.imageAlt ?? ""} /> : null}
        </div>
      </div>
      <aside className="ld-rule-top" style={{ gridColumn: "8 / 13", gridRow: "2 / 8" }}>
        <LinearSmallLabel>{props.kicker ?? "UI"}</LinearSmallLabel>
        <h1 className="ld-section-title">{props.title}</h1>
        {props.body ? <p className="ld-body">{props.body}</p> : null}
        <LinearList items={props.items} />
      </aside>
    </LinearFrame>
  );
}

export function LinearTimelineSlide(props: LinearSlideProps) {
  const items = (props.items ?? []).slice(0, 5);
  return (
    <LinearFrame animation={props.animation}>
      <header className="ld-rule-top" style={{ gridColumn: "1 / 8", gridRow: "1 / 4" }}>
        <LinearSmallLabel>{props.kicker ?? "Timeline"}</LinearSmallLabel>
        <h1 className="ld-section-title">{props.title}</h1>
        {props.body ? <p className="ld-body">{props.body}</p> : null}
      </header>
      <div style={{ gridColumn: "1 / 13", gridRow: "5 / 8", display: "flex", alignItems: "flex-start", gap: "0" }}>
        {items.map((item, i) => (
          <div key={item} style={{ flex: 1, display: "grid", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--ld-accent)", boxShadow: "0 0 12px var(--ld-accent-glow)", flexShrink: 0 }} />
              {i < items.length - 1 ? <span className="ld-connector" /> : null}
            </div>
            <div style={{ display: "grid", gap: "10px" }}>
              <LinearIconTile name={props.icons?.[i]} />
              <span className="ld-index" style={{ color: "var(--ld-accent)" }}>{String(i + 1).padStart(2, "0")}</span>
              <p className="ld-body" style={{ color: "var(--ld-ink)", fontWeight: 500, maxWidth: "18ch" }}>{item}</p>
            </div>
          </div>
        ))}
      </div>
    </LinearFrame>
  );
}
