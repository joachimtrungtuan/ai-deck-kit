import type { CSSProperties, ReactNode } from "react";

export type ClarityBackgroundVariant = "white" | "orange" | "black";

export type ClaritySlideProps = {
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
  layoutVariant?: string;
  backgroundVariant?: ClarityBackgroundVariant;
  highlightPhrase?: string;
  courseName?: string;
  lessonName?: string;
  sectionName?: string;
  pageCurrent?: string | number;
  pageTotal?: string | number;
  imagePosition?: "left" | "right";
  images?: { src: string; alt: string; caption?: string }[];
  tableColumns?: string[];
  tableRows?: string[][];
  recommendedColumn?: number;
  code?: string;
  language?: string;
  highlightLines?: number[];
  chartData?: { label: string; value: number }[];
};

export function ClarityFrame({
  children,
  hideFooter = false,
  hideHeader = false,
  props,
}: {
  children: ReactNode;
  hideFooter?: boolean;
  hideHeader?: boolean;
  props: ClaritySlideProps;
}) {
  const background = props.backgroundVariant ?? "white";
  const animation = props.animation ?? "gentle-rise";
  const layout = props.layoutVariant ? ` cc-layout-${props.layoutVariant}` : "";
  return (
    <section className={`cc-slide cc-bg-${background}${layout}`}>
      <div className={`cc-frame cc-anim-${animation}`}>
        {!hideHeader ? <ClarityHeader courseName={props.courseName} lessonName={props.lessonName} /> : null}
        {children}
        {!hideFooter ? <ClarityFooter {...props} /> : null}
      </div>
    </section>
  );
}

export function ClarityHeader({ courseName, lessonName }: Pick<ClaritySlideProps, "courseName" | "lessonName">) {
  if (!courseName && !lessonName) return null;
  return (
    <header className="cc-header">
      <span>{courseName}</span>
      <span>{lessonName}</span>
    </header>
  );
}

export function ClarityFooter({
  pageCurrent,
  pageTotal,
  sectionName,
}: Pick<ClaritySlideProps, "pageCurrent" | "pageTotal" | "sectionName">) {
  if (!sectionName && pageCurrent === undefined && pageTotal === undefined) return null;
  return (
    <footer className="cc-footer">
      <span>{sectionName}</span>
      <span>{pageCurrent ?? "—"} / {pageTotal ?? "—"}</span>
    </footer>
  );
}

export function ClarityTitle({
  className = "",
  highlightPhrase,
  title,
}: Pick<ClaritySlideProps, "highlightPhrase" | "title"> & { className?: string }) {
  const matchAt = highlightPhrase ? title.indexOf(highlightPhrase) : -1;
  if (!highlightPhrase || matchAt < 0) return <h1 className={`cc-title ${className}`.trim()}>{title}</h1>;
  return (
    <h1 className={`cc-title ${className}`.trim()}>
      {title.slice(0, matchAt)}
      <span className="cc-title-accent">{highlightPhrase}</span>
      {title.slice(matchAt + highlightPhrase.length)}
    </h1>
  );
}

export function ClarityKicker({ children }: { children?: ReactNode }) {
  return children ? <p className="cc-kicker">{children}</p> : null;
}

export function ClarityBody({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return children ? <p className="cc-body" style={style}>{children}</p> : null;
}

export function ClarityList({ items = [] }: { items?: string[] }) {
  return (
    <ol className="cc-list">
      {items.slice(0, 5).map((item, index) => (
        <li key={`${index}-${item}`}>
          <span className="cc-index">{String(index + 1).padStart(2, "0")}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function ClarityMedia({
  caption,
  imageAlt = "",
  imageSrc,
}: Pick<ClaritySlideProps, "caption" | "imageAlt" | "imageSrc">) {
  return (
    <figure className="cc-media">
      {imageSrc ? <img alt={imageAlt} src={imageSrc} /> : <div className="cc-media-placeholder" aria-label="Image placeholder" />}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export function ClarityTextIntro({
  compact = true,
  ...props
}: ClaritySlideProps & { compact?: boolean }) {
  return (
    <>
      <ClarityKicker>{props.kicker}</ClarityKicker>
      <ClarityTitle
        className={compact ? "cc-title-compact" : ""}
        highlightPhrase={props.highlightPhrase}
        title={props.title}
      />
      <ClarityBody>{props.body}</ClarityBody>
    </>
  );
}
