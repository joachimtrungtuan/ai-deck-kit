import type { ComponentType, ReactNode } from "react";
import { ImageBlock, TitleDescriptionBlock, renderRichText } from "../../../../primitives/blocks";
import * as PhosphorIcons from "@phosphor-icons/react";

// Canonical v2 list/card entry (content-schema-v2). Every layout consumes list
// data through one `items[]` prop of these; two-column layouts filter on
// `column` themselves. Icons ride on the entry they decorate (`item.icon`,
// `flowSteps[].icon`) — there is no flat positional `icons[]`.
export type SlideItem = {
  title: string;
  description?: string;
  icon?: string;
  column?: "left" | "right";
};

// LinearSlideProps is a SUPERSET of SwissSlideProps: every inherited field keeps its
// exact name and type; technical fields (catalog v2) are appended, all optional.
export type LinearSlideProps = {
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
  // Technical (v2)
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
  // Icons — Phosphor names (see icon-policy.md). Icons live on the data entries
  // they decorate: `items[].icon`, `flowSteps[].icon`, `items[0].icon` for the
  // single-slot metric tile. Unset slots render a placeholder.
  titleMeta?: { label: string; value: string }[];
  beforeAfterItemTextStyle?: React.CSSProperties;
  dataFlowPrimaryTextStyle?: React.CSSProperties;
  dataFlowSecondaryTextStyle?: React.CSSProperties;
};

// Resolve against the complete Phosphor namespace so content authors can use any shipped icon.
type IconComponent = ComponentType<{ size?: number; weight?: "regular" }>;
const MISSING_ICON = PhosphorIcons.SquaresFour as IconComponent;
const REACT_FORWARD_REF = Symbol.for("react.forward_ref");

function toPhosphorExportName(name: string): string {
  return name
    .split("-")
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join("");
}

function isIconComponent(value: unknown): value is IconComponent {
  if (typeof value === "function") return true;
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { $$typeof?: symbol; render?: unknown };
  return candidate.$$typeof === REACT_FORWARD_REF && typeof candidate.render === "function";
}

export function resolveIcon(name?: string): IconComponent | null {
  const value = name?.trim();
  if (!value) return null;
  const exportName = toPhosphorExportName(value);
  if (exportName === "IconBase") return null;
  const icon = PhosphorIcons[exportName as keyof typeof PhosphorIcons];
  return isIconComponent(icon) ? icon : null;
}

// Missing names keep the neutral placeholder; invalid names stay visible and actionable.
export function LinearIconTile({ name, size = 32, compact = false }: { name?: string; size?: number; compact?: boolean }) {
  const value = name?.trim();
  const Icon = resolveIcon(value);
  const RenderedIcon = Icon ?? MISSING_ICON;
  const className = `ld-icon-tile${compact ? " ld-icon-tile-compact" : ""}${value ? "" : " ld-icon-tile-empty"}`;
  if (value && !Icon) {
    return (
      <span
        className={`${className} ld-icon-tile-error`}
        role="img"
        aria-label={`Unresolved Phosphor icon: ${value}`}
        title={`Unresolved Phosphor icon: ${value}`}
      >
        {value}
      </span>
    );
  }
  return (
    <span className={className} aria-hidden>
      <RenderedIcon size={size} weight="regular" />
    </span>
  );
}

export function LinearFrame({ children, animation = "gentle-rise" }: { children: ReactNode; animation?: string }) {
  return (
    <section className="ld-slide">
      <div className={`ld-frame primitive-anim-${animation}`}>{children}</div>
    </section>
  );
}

export function LinearTextBlock({ kicker, title, body }: Pick<LinearSlideProps, "kicker" | "title" | "body">) {
  return (
    <div className="ld-rule-top">
      {kicker ? <p className="ld-kicker ld-kicker-dot">{renderRichText(kicker)}</p> : null}
      <TitleDescriptionBlock className="ld-template-title-block" block={{ id: "title", title, description: body }} />
    </div>
  );
}

export function LinearList({
  items = [],
  className = "",
  itemTextStyle,
}: {
  items?: SlideItem[];
  className?: string;
  itemTextStyle?: React.CSSProperties;
}) {
  return (
    <ol className={`ld-list primitive-anim-staggered-list ${className}`.trim()}>
      {items.map((item, itemIndex) => (
        <li key={`${itemIndex}-${item.title}`}>
          <span className="ld-index">{String(itemIndex + 1).padStart(2, "0")}</span>
          <span style={itemTextStyle}>
            {renderRichText(item.title)}
            {item.description ? <span className="ld-body" style={{ display: "block", fontWeight: 400 }}>{renderRichText(item.description)}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function LinearMedia({
  imageSrc,
  imageAlt = "",
  caption,
  scrim = false,
}: Pick<LinearSlideProps, "imageSrc" | "imageAlt" | "caption"> & { scrim?: boolean }) {
  return (
    <figure className={`ld-media${scrim ? " ld-media-scrim" : ""}`}>
      {imageSrc ? <ImageBlock className="ld-template-image-block" block={{ id: "media", src: imageSrc, alt: imageAlt, caption }} /> : null}
    </figure>
  );
}

export function LinearSmallLabel({ children }: { children: ReactNode }) {
  return <p className="ld-kicker">{children}</p>;
}

export function LinearPanel({
  children,
  accent = false,
  style,
  className = "",
}: {
  children: ReactNode;
  accent?: boolean;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={`ld-panel${accent ? " ld-panel-accent" : ""} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
