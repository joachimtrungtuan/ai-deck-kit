import { renderRichText } from "../../../../primitives/blocks";
import { LinearFrame, LinearIconTile, LinearList, LinearMedia, LinearSmallLabel, type LinearSlideProps } from "./shared";

export function LinearFullBleedImageSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation ?? "soft-scale"}>
      <div style={{ gridColumn: "1 / 13", gridRow: "1 / 9" }}>
        <LinearMedia imageSrc={props.imageSrc} imageAlt={props.imageAlt} caption={props.caption} scrim />
      </div>
      <div style={{ gridColumn: "1 / 8", gridRow: "6 / 9", zIndex: 1, alignSelf: "end" }}>
        {props.kicker ? <p className="ld-kicker ld-kicker-dot">{renderRichText(props.kicker)}</p> : null}
        <h1 className="ld-section-title" style={{ fontSize: "calc(var(--ld-type) * clamp(34px, 4vw, 62px))" }}>
          {renderRichText(props.title)}
        </h1>
      </div>
    </LinearFrame>
  );
}

export function LinearImageTextSplitSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <div style={{ gridColumn: "1 / 8", gridRow: "1 / 9" }}>
        <LinearMedia imageSrc={props.imageSrc} imageAlt={props.imageAlt} caption={props.caption} />
      </div>
      <div className="ld-rule-top" style={{ gridColumn: "9 / 13", gridRow: "2 / 8" }}>
        {props.kicker ? <LinearSmallLabel>{renderRichText(props.kicker)}</LinearSmallLabel> : null}
        <h1 className="ld-section-title">{renderRichText(props.title)}</h1>
        {props.body ? <p className="ld-body">{renderRichText(props.body)}</p> : null}
      </div>
    </LinearFrame>
  );
}

export function LinearImageGridSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <header className="ld-rule-top" style={{ gridColumn: "1 / 5", gridRow: "1 / 4" }}>
        {props.kicker ? <LinearSmallLabel>{renderRichText(props.kicker)}</LinearSmallLabel> : null}
        <h1 className="ld-section-title">{renderRichText(props.title)}</h1>
      </header>
      <div style={{ gridColumn: "6 / 13", gridRow: "1 / 9", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
        {props.images?.length
          ? props.images.slice(0, 6).map((image, imageIndex) => (
              <LinearMedia key={`${imageIndex}-${image.src}`} imageSrc={image.src} imageAlt={image.alt ?? ""} caption={image.caption} />
            ))
          : (props.items ?? []).slice(0, 6).map((item, itemIndex) => (
              <LinearMedia key={`${itemIndex}-${item.title}`} caption={item.title} />
            ))}
      </div>
    </LinearFrame>
  );
}

export function LinearIconGridSlide(props: LinearSlideProps) {
  const items = (props.items ?? []).slice(0, 6);
  return (
    <LinearFrame animation={props.animation}>
      <div className="ld-rule-top" style={{ gridColumn: "1 / 6", gridRow: "1 / 4" }}>
        {props.kicker ? <LinearSmallLabel>{renderRichText(props.kicker)}</LinearSmallLabel> : null}
        <h1 className="ld-section-title">{renderRichText(props.title)}</h1>
        {props.body ? <p className="ld-body">{renderRichText(props.body)}</p> : null}
      </div>
      <div
        className="primitive-anim-staggered-list"
        style={{ gridColumn: "7 / 13", gridRow: "1 / 9", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px", alignContent: "center" }}
      >
        {items.map((item, i) => (
          <div className="ld-panel" key={`${i}-${item.title}`} style={{ padding: "24px", display: "grid", gap: "16px" }}>
            <LinearIconTile name={item.icon} />
            <p className="ld-body" style={{ color: "var(--ld-ink)", fontWeight: 500 }}>{renderRichText(item.title)}</p>
          </div>
        ))}
      </div>
    </LinearFrame>
  );
}

export function LinearDiagramSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation ?? "line-draw"}>
      <header className="ld-rule-top" style={{ gridColumn: "1 / 5", gridRow: "1 / 4" }}>
        <LinearSmallLabel>{renderRichText(props.kicker ?? "Diagram")}</LinearSmallLabel>
        <h1 className="ld-section-title">{renderRichText(props.title)}</h1>
      </header>
      <div className="ld-panel" style={{ gridColumn: "6 / 13", gridRow: "3 / 8", padding: "48px", display: "grid", alignContent: "center" }}>
        {props.children ?? <LinearList items={props.items} />}
      </div>
    </LinearFrame>
  );
}
