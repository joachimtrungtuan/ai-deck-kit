import type { ReactNode } from "react";
import { ImageBlock, TitleDescriptionBlock } from "../../../../primitives/blocks";

export type SwissSlideProps = {
  index?: string;
  kicker?: string;
  title: string;
  body?: string;
  items?: string[];
  leftTitle?: string;
  rightTitle?: string;
  leftItems?: string[];
  rightItems?: string[];
  attribution?: string;
  imageSrc?: string;
  imageAlt?: string;
  caption?: string;
  metric?: string;
  metricLabel?: string;
  source?: string;
  animation?: string;
  children?: ReactNode;
};

export function SwissFrame({ children, animation = "gentle-rise" }: { children: ReactNode; animation?: string }) {
  return (
    <section className="swiss-slide">
      <div className={`swiss-frame swiss-anim-${animation}`}>{children}</div>
    </section>
  );
}

export function SwissTextBlock({ kicker, title, body }: Pick<SwissSlideProps, "kicker" | "title" | "body">) {
  return (
    <div className="swiss-rule-top">
      {kicker ? <p className="swiss-kicker">{kicker}</p> : null}
      <TitleDescriptionBlock className="swiss-template-title-block" block={{ id: "title", title, description: body }} />
    </div>
  );
}

export function SwissList({ items = [] }: { items?: string[] }) {
  return (
    <ol className="swiss-list swiss-anim-staggered-list">
      {items.map((item, itemIndex) => (
        <li key={item}>
          <span className="swiss-index">{String(itemIndex + 1).padStart(2, "0")}</span>
          <span>{item}</span>
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
