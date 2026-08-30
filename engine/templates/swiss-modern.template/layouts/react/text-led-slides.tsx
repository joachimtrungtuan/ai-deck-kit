import { renderRichText } from "../../../../primitives/blocks";
import { SwissFrame, SwissList, SwissSmallLabel, SwissTextBlock, type SwissSlideProps } from "./shared";

export function SwissTextStatementSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <div style={{ gridColumn: "1 / 11", gridRow: "2 / 7" }}>
        <SwissTextBlock kicker={props.kicker} title={props.title} body={props.body} />
      </div>
      {props.source ? <SwissSmallLabel>{props.source}</SwissSmallLabel> : null}
    </SwissFrame>
  );
}

export function SwissTextListSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <div className="swiss-rule-top" style={{ gridColumn: "1 / 7", gridRow: "1 / 6" }}>
        {props.kicker ? <SwissSmallLabel>{renderRichText(props.kicker)}</SwissSmallLabel> : null}
        <h1 className="swiss-section-title">{renderRichText(props.title)}</h1>
        {props.body ? <p className="swiss-body">{renderRichText(props.body)}</p> : null}
      </div>
      <div style={{ gridColumn: "8 / 13", gridRow: "1 / 8" }}>
        <SwissList items={props.items} />
      </div>
    </SwissFrame>
  );
}

export function SwissTwoColumnTextSlide(props: SwissSlideProps) {
  const left = (props.items ?? []).filter((item) => item.column === "left");
  const right = (props.items ?? []).filter((item) => item.column !== "left");
  return (
    <SwissFrame animation={props.animation}>
      <header style={{ gridColumn: "1 / 13", gridRow: "1 / 3" }}>
        <div className="swiss-rule-top">
          {props.kicker ? <SwissSmallLabel>{props.kicker}</SwissSmallLabel> : null}
          <h1 className="swiss-section-title">{renderRichText(props.title)}</h1>
        </div>
      </header>
      <section className="swiss-panel" style={{ gridColumn: "1 / 7", gridRow: "4 / 8", padding: "32px" }}>
        <SwissSmallLabel>{props.leftTitle ?? "Left"}</SwissSmallLabel>
        <SwissList items={left} />
      </section>
      <section className="swiss-panel" style={{ gridColumn: "7 / 13", gridRow: "4 / 8", padding: "32px" }}>
        <SwissSmallLabel>{props.rightTitle ?? "Right"}</SwissSmallLabel>
        <SwissList items={right} />
      </section>
    </SwissFrame>
  );
}

export function SwissQuoteSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation ?? "masked-reveal"}>
      <blockquote style={{ gridColumn: "2 / 12", gridRow: "2 / 7", margin: 0 }}>
        <p className="swiss-title swiss-title-compact">{renderRichText(props.title)}</p>
        {props.attribution ? <footer className="swiss-kicker">{props.attribution}</footer> : null}
      </blockquote>
    </SwissFrame>
  );
}

export function SwissNumberedFrameworkSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <div className="swiss-rule-top" style={{ gridColumn: "1 / 5", gridRow: "1 / 8" }}>
        <SwissSmallLabel>{renderRichText(props.kicker ?? "Framework")}</SwissSmallLabel>
        <h1 className="swiss-section-title">{renderRichText(props.title)}</h1>
        {props.body ? <p className="swiss-body">{renderRichText(props.body)}</p> : null}
      </div>
      <div style={{ gridColumn: "6 / 13", gridRow: "1 / 8" }}>
        <SwissList items={props.items} />
      </div>
    </SwissFrame>
  );
}
