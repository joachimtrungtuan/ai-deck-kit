import type { ComponentType, ReactNode } from "react";
import { ImageBlock, TitleDescriptionBlock } from "../../../../primitives/blocks";
import {
  ArrowsClockwise,
  ChartLine,
  CloudArrowUp,
  Code,
  Cpu,
  Database,
  GitBranch,
  Globe,
  Lightning,
  Lock,
  Plugs,
  Rocket,
  ShieldCheck,
  SquaresFour,
  Stack,
  Target,
  Terminal,
  Users,
} from "@phosphor-icons/react";

// LinearSlideProps is a SUPERSET of SwissSlideProps: every inherited field keeps its
// exact name and type; technical fields (catalog v2) are appended, all optional.
export type LinearSlideProps = {
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
  // Technical (v2)
  code?: string;
  language?: string;
  highlightLines?: number[];
  commands?: { prompt: string; output?: string }[];
  flowSteps?: { from: string; to: string; label: string }[];
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
  // Icons — Phosphor names (see icon-policy.md). `icon` for single-slot slides,
  // `icons` parallel to `items` for multi-slot slides. Unset slots render a placeholder.
  icon?: string;
  icons?: string[];
  titleMeta?: { label: string; value: string }[];
  beforeAfterItemTextStyle?: React.CSSProperties;
  dataFlowPrimaryTextStyle?: React.CSSProperties;
  dataFlowSecondaryTextStyle?: React.CSSProperties;
};

// Curated Phosphor set. Authoring agents pass these names via `icon` / `icons`.
// Unknown or missing names fall back to the SquaresFour placeholder so the slot stays visible.
type IconComponent = ComponentType<{ size?: number; weight?: "regular" }>;

const ICON_MAP: Record<string, IconComponent> = {
  target: Target,
  stack: Stack,
  lightning: Lightning,
  shield: ShieldCheck,
  database: Database,
  cloud: CloudArrowUp,
  branch: GitBranch,
  code: Code,
  terminal: Terminal,
  plugs: Plugs,
  users: Users,
  chart: ChartLine,
  rocket: Rocket,
  lock: Lock,
  sync: ArrowsClockwise,
  cpu: Cpu,
  globe: Globe,
};

export function resolveIcon(name?: string): IconComponent {
  return (name && ICON_MAP[name]) || SquaresFour;
}

// Icon placeholder tile. Renders the named icon, or a neutral placeholder glyph
// signalling "an icon belongs here" when no name is supplied.
export function LinearIconTile({ name, size = 32, compact = false }: { name?: string; size?: number; compact?: boolean }) {
  const Icon = resolveIcon(name);
  return (
    <span className={`ld-icon-tile${compact ? " ld-icon-tile-compact" : ""}${name ? "" : " ld-icon-tile-empty"}`} aria-hidden>
      <Icon size={size} weight="regular" />
    </span>
  );
}

export function LinearFrame({ children, animation = "gentle-rise" }: { children: ReactNode; animation?: string }) {
  return (
    <section className="ld-slide">
      <div className={`ld-frame ld-anim-${animation}`}>{children}</div>
    </section>
  );
}

export function LinearTextBlock({ kicker, title, body }: Pick<LinearSlideProps, "kicker" | "title" | "body">) {
  return (
    <div className="ld-rule-top">
      {kicker ? <p className="ld-kicker ld-kicker-dot">{kicker}</p> : null}
      <TitleDescriptionBlock className="ld-template-title-block" block={{ id: "title", title, description: body }} />
    </div>
  );
}

export function LinearList({
  items = [],
  className = "",
  itemTextStyle,
}: {
  items?: string[];
  className?: string;
  itemTextStyle?: React.CSSProperties;
}) {
  return (
    <ol className={`ld-list ld-anim-staggered-list ${className}`.trim()}>
      {items.map((item, itemIndex) => (
        <li key={item}>
          <span className="ld-index">{String(itemIndex + 1).padStart(2, "0")}</span>
          <span style={itemTextStyle}>{item}</span>
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
