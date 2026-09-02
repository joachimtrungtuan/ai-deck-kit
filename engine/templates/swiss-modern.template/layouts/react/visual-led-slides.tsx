import { renderRichText } from "../../../../primitives/blocks";
import { SwissFrame, SwissList, SwissMedia, SwissSmallLabel, type SwissSlideProps } from "./shared";

export function SwissFullBleedImageSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation ?? "soft-scale"}>
      <div style={{ gridColumn: "1 / 13", gridRow: "1 / 9" }}>
        <SwissMedia imageSrc={props.imageSrc} imageAlt={props.imageAlt} caption={props.caption} />
      </div>
      <div style={{ gridColumn: "1 / 7", gridRow: "2 / 5", zIndex: 1 }}>
        <h1 className="swiss-section-title swiss-title-emphasis" style={{ fontSize: "clamp(34px, 4vw, 62px)" }}>
          {renderRichText(props.title)}
        </h1>
      </div>
    </SwissFrame>
  );
}

export function SwissImageTextSplitSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <div style={{ gridColumn: "1 / 8", gridRow: "1 / 9" }}>
        <SwissMedia imageSrc={props.imageSrc} imageAlt={props.imageAlt} caption={props.caption} />
      </div>
      <div className="swiss-rule-top" style={{ gridColumn: "9 / 13", gridRow: "2 / 8" }}>
        {props.kicker ? <SwissSmallLabel>{renderRichText(props.kicker)}</SwissSmallLabel> : null}
        <h1 className="swiss-section-title">{renderRichText(props.title)}</h1>
        {props.body ? <p className="swiss-body">{renderRichText(props.body)}</p> : null}
      </div>
    </SwissFrame>
  );
}

export function SwissImageGridSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <header className="swiss-rule-top" style={{ gridColumn: "1 / 5", gridRow: "1 / 4" }}>
        {props.kicker ? <SwissSmallLabel>{renderRichText(props.kicker)}</SwissSmallLabel> : null}
        <h1 className="swiss-section-title">{renderRichText(props.title)}</h1>
      </header>
      <div style={{ gridColumn: "6 / 13", gridRow: "1 / 9", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
        {props.images?.length
          ? props.images.slice(0, 6).map((image, imageIndex) => (
              <SwissMedia key={`${imageIndex}-${image.src}`} imageSrc={image.src} imageAlt={image.alt ?? ""} caption={image.caption} />
            ))
          : (props.items ?? []).slice(0, 6).map((item, itemIndex) => (
              <SwissMedia key={`${itemIndex}-${item.title}`} caption={item.title} />
            ))}
      </div>
    </SwissFrame>
  );
}

export function SwissIconGridSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <div className="swiss-rule-top" style={{ gridColumn: "1 / 5", gridRow: "1 / 4" }}>
        {props.kicker ? <SwissSmallLabel>{renderRichText(props.kicker)}</SwissSmallLabel> : null}
        <h1 className="swiss-section-title">{renderRichText(props.title)}</h1>
        {props.body ? <p className="swiss-body">{renderRichText(props.body)}</p> : null}
      </div>
      <div style={{ gridColumn: "6 / 13", gridRow: "2 / 8" }}>
        <SwissList items={props.items} />
      </div>
    </SwissFrame>
  );
}

export function SwissDiagramSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation ?? "line-draw"}>
      <header className="swiss-rule-top" style={{ gridColumn: "1 / 5", gridRow: "1 / 4" }}>
        <SwissSmallLabel>{renderRichText(props.kicker ?? "Diagram")}</SwissSmallLabel>
        <h1 className="swiss-section-title">{renderRichText(props.title)}</h1>
      </header>
      <div className="swiss-panel" style={{ gridColumn: "6 / 13", gridRow: "3 / 8", padding: "48px" }}>
        {props.children ?? <SwissList items={props.items} />}
      </div>
    </SwissFrame>
  );
}
