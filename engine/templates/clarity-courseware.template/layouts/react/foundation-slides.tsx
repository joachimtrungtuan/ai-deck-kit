import {
  ClarityBody,
  ClarityFrame,
  ClarityKicker,
  ClarityList,
  ClarityMedia,
  ClarityTextIntro,
  ClarityTitle,
  type ClaritySlideProps,
} from "./shared";

export function ClarityTitleSlide(props: ClaritySlideProps) {
  const variant = props.layoutVariant ?? "editorial-left";
  if (variant === "orange-statement") {
    return (
      <ClarityFrame hideFooter props={props}>
        <div style={{ gridColumn: "1 / 12", gridRow: "3 / 8", alignSelf: "end" }}>
          <ClarityKicker>{props.kicker ?? props.courseName}</ClarityKicker>
          <ClarityTitle highlightPhrase={props.highlightPhrase} title={props.title} />
          <ClarityBody>{props.body}</ClarityBody>
        </div>
      </ClarityFrame>
    );
  }
  if (variant === "black-hero") {
    return (
      <ClarityFrame hideFooter props={props}>
        <div style={{ gridColumn: "1 / 8", gridRow: "2 / 8", alignSelf: "center" }}>
          <ClarityKicker>{props.kicker ?? props.index}</ClarityKicker>
          <ClarityTitle highlightPhrase={props.highlightPhrase} title={props.title} />
          <ClarityBody>{props.body}</ClarityBody>
        </div>
        <div style={{ gridColumn: "9 / 13", gridRow: "2 / 8" }}>
          <ClarityMedia imageSrc={props.imageSrc} imageAlt={props.imageAlt} caption={props.caption} />
        </div>
      </ClarityFrame>
    );
  }
  return (
    <ClarityFrame hideFooter props={props}>
      <div style={{ gridColumn: "1 / 9", gridRow: "2 / 8", alignSelf: "center" }}>
        <ClarityKicker>{props.kicker}</ClarityKicker>
        <ClarityTitle highlightPhrase={props.highlightPhrase} title={props.title} />
        <ClarityBody>{props.body}</ClarityBody>
      </div>
      <div style={{ gridColumn: "10 / 13", gridRow: "2 / 8" }}>
        <ClarityMedia imageSrc={props.imageSrc} imageAlt={props.imageAlt} caption={props.caption} />
      </div>
    </ClarityFrame>
  );
}

export function ClaritySectionDividerSlide(props: ClaritySlideProps) {
  const variant = props.layoutVariant ?? "number-led";
  return (
    <ClarityFrame props={props}>
      {variant === "chapter-band" ? <div className="cc-band" style={{ gridColumn: "1 / 2", gridRow: "2 / 8" }} /> : null}
      <div style={{ gridColumn: variant === "chapter-band" ? "3 / 12" : "1 / 4", gridRow: "3 / 7", alignSelf: "end" }}>
        {variant === "number-led" ? <p className="cc-metric">{props.index ?? "01"}</p> : <ClarityKicker>{props.kicker}</ClarityKicker>}
      </div>
      <div className="cc-rule-top" style={{ gridColumn: variant === "chapter-band" ? "3 / 12" : "5 / 13", gridRow: "2 / 7" }}>
        <ClarityTitle className="cc-title-compact" highlightPhrase={props.highlightPhrase} title={props.title} />
        <ClarityBody>{props.body}</ClarityBody>
      </div>
    </ClarityFrame>
  );
}

export function ClarityFullBleedImageSlide(props: ClaritySlideProps) {
  const variant = props.layoutVariant ?? "editorial-overlay";
  return (
    <ClarityFrame hideFooter hideHeader props={props}>
      <div style={{ gridColumn: "1 / 13", gridRow: "1 / 9", margin: "-64px" }}>
        <ClarityMedia imageSrc={props.imageSrc} imageAlt={props.imageAlt} />
      </div>
      {variant === "caption-strip" ? (
        <div className="cc-image-caption-strip" style={{ gridColumn: "1 / 13", gridRow: "7 / 9", alignSelf: "end" }}>
          <ClarityKicker>{props.kicker}</ClarityKicker>
          <h1 className="cc-section-title">{props.title}</h1>
          <ClarityBody>{props.caption ?? props.body}</ClarityBody>
        </div>
      ) : (
        <div className="cc-image-overlay" style={{ gridColumn: "1 / 7", gridRow: "2 / 7", alignSelf: "center" }}>
          <ClarityKicker>{props.kicker}</ClarityKicker>
          <ClarityTitle className="cc-title-compact" highlightPhrase={props.highlightPhrase} title={props.title} />
        </div>
      )}
    </ClarityFrame>
  );
}

export function ClarityQuoteSlide(props: ClaritySlideProps) {
  const variant = props.layoutVariant ?? "centered-quote";
  return (
    <ClarityFrame props={props}>
      <blockquote style={{ gridColumn: variant === "pull-quote" ? "1 / 8" : "2 / 12", gridRow: "2 / 7", margin: 0, alignSelf: "center" }}>
        <ClarityTitle className="cc-quote" highlightPhrase={props.highlightPhrase} title={props.title} />
        {props.attribution ? <footer className="cc-label" style={{ marginTop: "32px" }}>{props.attribution}</footer> : null}
      </blockquote>
      {variant === "pull-quote" ? (
        <aside className="cc-rule-top" style={{ gridColumn: "9 / 13", gridRow: "3 / 7" }}>
          <ClarityKicker>{props.kicker ?? "Context"}</ClarityKicker>
          <ClarityBody>{props.body}</ClarityBody>
        </aside>
      ) : null}
    </ClarityFrame>
  );
}

export function ClarityClosingSlide(props: ClaritySlideProps) {
  const variant = props.layoutVariant ?? "next-steps";
  return (
    <ClarityFrame props={props}>
      <div style={{ gridColumn: variant === "final-statement" ? "1 / 11" : "1 / 8", gridRow: "2 / 7", alignSelf: "center" }}>
        <ClarityTextIntro {...props} compact={variant !== "final-statement"} />
      </div>
      {variant === "next-steps" ? (
        <div style={{ gridColumn: "9 / 13", gridRow: "3 / 7" }}>
          <ClarityList items={props.items} />
        </div>
      ) : null}
    </ClarityFrame>
  );
}
