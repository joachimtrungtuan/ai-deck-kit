import type { ReactNode } from "react";
import { ImageBlock, TitleDescriptionBlock, renderRichText } from "../../../../primitives/blocks";

// Canonical v2 list/card entry (content-schema-v2). Every layout consumes list
// data through one `items[]` prop of these; two-column layouts filter on
// `column` themselves.
export type SlideItem = {
  title: string;
  description?: string;
  icon?: string;
  column?: "left" | "right";
};

export type SwissSlideProps = {
  index?: string;
  kicker?: string;
  title: string;
  body?: string;
  items?: SlideItem[];
  leftTitle?: string;
  rightTitle?: string;
  attribution?: string;
  imageSrc?: string;
  imageAlt?: string;
  caption?: string;
  metric?: string;
  metricLabel?: string;
  source?: string;
  chartData?: { label: string; value: number }[];
  images?: { src: string; alt?: string; caption?: string }[];
  animation?: string;
  children?: ReactNode;
  code?: string;
  language?: string;
  highlightLines?: number[];
  commands?: { prompt: string; output?: string }[];
  flowSteps?: { from: string; to: string; label: string; icon?: string }[];
  method?: string;
  path?: string;
  requestExample?: string;
  responseExample?: string;
  tableColumns?: string[];
  tableRows?: string[][];
  recommendedColumn?: number;
  context?: string;
  decision?: string;
  consequences?: string[];
};

export function SwissFrame({ children, animation = "gentle-rise" }: { children: ReactNode; animation?: string }) {
  return (
    <section className="swiss-slide">
      <div className={`swiss-frame primitive-anim-${animation}`}>{children}</div>
    </section>
  );
}

export function SwissTextBlock({ kicker, title, body }: Pick<SwissSlideProps, "kicker" | "title" | "body">) {
  return (
    <div className="swiss-rule-top">
      {kicker ? <p className="swiss-kicker">{renderRichText(kicker)}</p> : null}
      <TitleDescriptionBlock className="swiss-template-title-block" block={{ id: "title", title, description: body }} />
    </div>
  );
}

export function SwissList({ items = [] }: { items?: SlideItem[] }) {
  return (
    <ol className="swiss-list primitive-anim-staggered-list">
      {items.map((item, itemIndex) => (
        <li key={`${itemIndex}-${item.title}`}>
          <span className="swiss-index">{String(itemIndex + 1).padStart(2, "0")}</span>
          <span>
            {renderRichText(item.title)}
            {item.description ? <span className="swiss-body" style={{ display: "block" }}>{renderRichText(item.description)}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function SwissMedia({ imageSrc, imageAlt = "", caption }: Pick<SwissSlideProps, "imageSrc" | "imageAlt" | "caption">) {
  return (
    <figure className="swiss-media">
      {imageSrc ? <ImageBlock className="swiss-template-image-block" block={{ id: "media", src: imageSrc, alt: imageAlt, caption }} /> : null}
    </figure>
  );
}

export function SwissSmallLabel({ children }: { children: ReactNode }) {
  return <p className="swiss-kicker">{children}</p>;
}
