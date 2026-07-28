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

export function ClarityContentTextSlide(props: ClaritySlideProps) {
  const variant = props.layoutVariant ?? "statement";
  if (variant === "rule-list") {
    return (
      <ClarityFrame props={props}>
        <header className="cc-rule-top" style={{ gridColumn: "1 / 6", gridRow: "2 / 6" }}>
          <ClarityTextIntro {...props} />
        </header>
        <div style={{ gridColumn: "7 / 13", gridRow: "2 / 7" }}><ClarityList items={props.items} /></div>
      </ClarityFrame>
    );
  }
  if (variant === "two-column") {
    return (
      <ClarityFrame props={props}>
        <header style={{ gridColumn: "1 / 13", gridRow: "2 / 4" }}>
          <ClarityKicker>{props.kicker}</ClarityKicker>
          <ClarityTitle className="cc-title-compact" highlightPhrase={props.highlightPhrase} title={props.title} />
        </header>
        <section className="cc-panel" style={{ gridColumn: "1 / 7", gridRow: "4 / 7" }}>
          <ClarityKicker>{props.leftTitle ?? "Concept"}</ClarityKicker>
          <ClarityList items={props.leftItems} />
        </section>
        <section className="cc-panel cc-panel-split" style={{ gridColumn: "7 / 13", gridRow: "4 / 7" }}>
          <ClarityKicker>{props.rightTitle ?? "Application"}</ClarityKicker>
          <ClarityList items={props.rightItems} />
        </section>
      </ClarityFrame>
    );
  }
  if (variant === "concept-callout") {
    return (
      <ClarityFrame props={props}>
        <div style={{ gridColumn: "1 / 10", gridRow: "2 / 6", alignSelf: "center" }}>
          <ClarityKicker>{props.kicker}</ClarityKicker>
          <p className="cc-concept">{props.highlightPhrase ?? props.title}</p>
        </div>
        <aside className="cc-rule-top" style={{ gridColumn: "10 / 13", gridRow: "3 / 7" }}>
          <h1 className="cc-section-title">{props.title}</h1>
          <ClarityBody>{props.body}</ClarityBody>
        </aside>
      </ClarityFrame>
    );
  }
  return (
    <ClarityFrame props={props}>
      <div className="cc-rule-top" style={{ gridColumn: "1 / 11", gridRow: "2 / 7", alignSelf: "center" }}>
        <ClarityTextIntro {...props} compact={false} />
        {props.source ? <p className="cc-label" style={{ marginTop: "32px" }}>{props.source}</p> : null}
      </div>
    </ClarityFrame>
  );
}

export function ClarityContentMediaSlide(props: ClaritySlideProps) {
  const variant = props.layoutVariant ?? "split-figure";
  if (variant === "image-grid") {
    const images = (props.images ?? []).slice(0, 4);
    return (
      <ClarityFrame props={props}>
        <header style={{ gridColumn: "1 / 5", gridRow: "2 / 7" }}><ClarityTextIntro {...props} /></header>
        <div className="cc-image-grid" style={{ gridColumn: "6 / 13", gridRow: "2 / 7" }}>
          {images.map((image, index) => (
            <ClarityMedia key={`${index}-${image.src}`} imageSrc={image.src} imageAlt={image.alt} caption={image.caption} />
          ))}
        </div>
      </ClarityFrame>
    );
  }
  if (variant === "captioned-figure") {
    return (
      <ClarityFrame props={props}>
        <div style={{ gridColumn: "1 / 10", gridRow: "2 / 7" }}>
          <ClarityMedia imageSrc={props.imageSrc} imageAlt={props.imageAlt} caption={props.caption} />
        </div>
        <aside className="cc-rule-top" style={{ gridColumn: "10 / 13", gridRow: "2 / 7" }}>
          <ClarityTextIntro {...props} />
        </aside>
      </ClarityFrame>
    );
  }
  const imageLeft = props.imagePosition === "left";
  return (
    <ClarityFrame props={props}>
      <div style={{ gridColumn: imageLeft ? "1 / 8" : "6 / 13", gridRow: "2 / 7" }}>
        <ClarityMedia imageSrc={props.imageSrc} imageAlt={props.imageAlt} caption={props.caption} />
      </div>
      <div className="cc-rule-top" style={{ gridColumn: imageLeft ? "9 / 13" : "1 / 5", gridRow: "2 / 7" }}>
        <ClarityTextIntro {...props} />
      </div>
    </ClarityFrame>
  );
}
