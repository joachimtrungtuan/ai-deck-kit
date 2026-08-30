import { renderRichText } from "../../../../primitives/blocks";
import { SwissFrame, SwissList, SwissSmallLabel, SwissTextBlock, type SwissSlideProps } from "./shared";

export function SwissTitleSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <div style={{ gridColumn: "1 / 8", gridRow: "2 / 8" }}>
        <SwissTextBlock kicker={props.kicker} title={props.title} body={props.body} />
      </div>
      <dl className="swiss-meta-row" style={{ gridColumn: "8 / 13", gridRow: "2 / 4" }}>
        <div>
          <dt>Template</dt>
          <dd>Swiss Modern</dd>
        </div>
        <div>
          <dt>System</dt>
          <dd>Editorial grid</dd>
        </div>
        <div>
          <dt>Typography</dt>
          <dd>Inter / JetBrains Mono</dd>
        </div>
        <div>
          <dt>Emphasis</dt>
          <dd>Scale and rules</dd>
        </div>
      </dl>
    </SwissFrame>
  );
}

export function SwissSectionDividerSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation ?? "masked-reveal"}>
      <div style={{ gridColumn: "1 / 4", gridRow: "5 / 7", alignSelf: "end" }}>
        <p className="swiss-number">{props.index ?? "01"}</p>
      </div>
      <div className="swiss-rule-top" style={{ gridColumn: "5 / 13", gridRow: "2 / 8" }}>
        <h1 className="swiss-section-title swiss-title-emphasis">{renderRichText(props.title)}</h1>
        {props.body ? <p className="swiss-body">{renderRichText(props.body)}</p> : null}
      </div>
    </SwissFrame>
  );
}

export function SwissClosingSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <div style={{ gridColumn: "1 / 8", gridRow: "2 / 8" }}>
        <SwissTextBlock kicker={props.kicker ?? "Closing"} title={props.title} body={props.body} />
      </div>
      <aside className="swiss-panel" style={{ gridColumn: "8 / 13", gridRow: "5 / 8", padding: "32px" }}>
        <SwissList items={props.items} />
      </aside>
    </SwissFrame>
  );
}

export function SwissAgendaSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <div style={{ gridColumn: "1 / 6", gridRow: "1 / 4" }}>
        <SwissTextBlock kicker={props.kicker ?? "Agenda"} title={props.title} body={props.body} />
      </div>
      <div style={{ gridColumn: "7 / 13", gridRow: "3 / 8" }}>
        <SwissList items={props.items} />
      </div>
    </SwissFrame>
  );
}
