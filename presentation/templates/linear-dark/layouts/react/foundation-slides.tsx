import { LinearFrame, LinearList, LinearTextBlock, type LinearSlideProps } from "./shared";

export function LinearTitleSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <div style={{ gridColumn: "1 / 8", gridRow: "2 / 8" }}>
        <LinearTextBlock kicker={props.kicker} title={props.title} body={props.body} />
      </div>
      <dl className="ld-meta-row" style={{ gridColumn: "8 / 13", gridRow: "2 / 4" }}>
        <div>
          <dt>Template</dt>
          <dd>Linear Dark</dd>
        </div>
        <div>
          <dt>System</dt>
          <dd>Dark SaaS</dd>
        </div>
        <div>
          <dt>Typography</dt>
          <dd>Inter / JetBrains Mono</dd>
        </div>
        <div>
          <dt>Emphasis</dt>
          <dd>Hairlines and glow</dd>
        </div>
      </dl>
    </LinearFrame>
  );
}

export function LinearSectionDividerSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation ?? "masked-reveal"}>
      <div style={{ gridColumn: "1 / 4", gridRow: "5 / 7", alignSelf: "end" }}>
        <p className="ld-number">{props.index ?? "01"}</p>
      </div>
      <div className="ld-rule-top" style={{ gridColumn: "5 / 13", gridRow: "2 / 8" }}>
        <h1 className="ld-section-title">{props.title}</h1>
        {props.body ? <p className="ld-body">{props.body}</p> : null}
        <div className="ld-progress-bar ld-anim-line-draw" style={{ marginTop: "var(--ld-space-4)", maxWidth: "240px" }} />
      </div>
    </LinearFrame>
  );
}

export function LinearClosingSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <div style={{ gridColumn: "1 / 8", gridRow: "2 / 8" }}>
        <LinearTextBlock kicker={props.kicker ?? "Closing"} title={props.title} body={props.body} />
      </div>
      <aside className="ld-panel" style={{ gridColumn: "8 / 13", gridRow: "5 / 8", padding: "32px" }}>
        <LinearList items={props.items} />
      </aside>
    </LinearFrame>
  );
}

export function LinearAgendaSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <div style={{ gridColumn: "1 / 6", gridRow: "1 / 4" }}>
        <LinearTextBlock kicker={props.kicker ?? "Agenda"} title={props.title} body={props.body} />
      </div>
      <div style={{ gridColumn: "7 / 13", gridRow: "3 / 8" }}>
        <LinearList items={props.items} />
      </div>
    </LinearFrame>
  );
}
