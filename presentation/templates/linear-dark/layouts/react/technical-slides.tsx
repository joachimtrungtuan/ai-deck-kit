import { Fragment } from "react";
import { LinearFrame, LinearIconTile, LinearSmallLabel, type LinearSlideProps } from "./shared";

// Lightweight code rendering: line numbers + optional highlighted rows.
// Comment lines get the muted comment color; the accent is reserved for the highlight row.
// No rainbow tokenizer — restrained, per technical-category rules.
function isComment(line: string) {
  const t = line.trimStart();
  return t.startsWith("//") || t.startsWith("#") || t.startsWith("*") || t.startsWith("/*");
}

export function CodeBlock({ code = "", highlightLines = [], label }: { code?: string; highlightLines?: number[]; label?: string }) {
  const lines = code.replace(/\n$/, "").split("\n").slice(0, 14);
  const highlight = new Set(highlightLines);
  return (
    <div className="ld-panel" style={{ overflow: "hidden", display: "grid", gridTemplateRows: "auto 1fr" }}>
      <div className="ld-chrome">
        <span /><span /><span />
        {label ? <span className="ld-chrome-label">{label}</span> : null}
      </div>
      <pre className="ld-code ld-anim-staggered-list">
        {lines.map((line, i) => (
          <div key={`${i}-${line}`} className={`ld-code-line${highlight.has(i + 1) ? " ld-code-line-highlight" : ""}`}>
            <span className="ld-code-ln">{i + 1}</span>
            <span className={isComment(line) ? "ld-tok-comment" : undefined}>{line || " "}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

export function LinearCodeSnippetSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <div className="ld-rule-top" style={{ gridColumn: "1 / 6", gridRow: "1 / 8", alignSelf: "start" }}>
        <LinearSmallLabel>{props.kicker ?? props.language ?? "Code"}</LinearSmallLabel>
        <h1 className="ld-section-title" style={{ fontSize: "calc(var(--ld-type) * clamp(28px, 3vw, 48px))" }}>{props.title}</h1>
        {props.body ? <p className="ld-body">{props.body}</p> : null}
      </div>
      <div style={{ gridColumn: "6 / 13", gridRow: "1 / 9", display: "grid" }}>
        <CodeBlock code={props.code} highlightLines={props.highlightLines} label={props.caption ?? props.language} />
      </div>
    </LinearFrame>
  );
}

export function LinearTerminalOutputSlide(props: LinearSlideProps) {
  const commands = props.commands ?? [];
  return (
    <LinearFrame animation={props.animation}>
      <header className="ld-rule-top" style={{ gridColumn: "1 / 6", gridRow: "1 / 4" }}>
        <LinearSmallLabel>{props.kicker ?? "Terminal"}</LinearSmallLabel>
        <h1 className="ld-section-title" style={{ fontSize: "calc(var(--ld-type) * clamp(28px, 3vw, 48px))" }}>{props.title}</h1>
      </header>
      <div
        className="ld-panel"
        style={{ gridColumn: "1 / 13", gridRow: "4 / 9", overflow: "hidden", display: "grid", gridTemplateRows: "auto 1fr", background: "var(--ld-terminal-bg)" }}
      >
        <div className="ld-chrome">
          <span /><span /><span />
          <span className="ld-chrome-label">{props.caption ?? "zsh"}</span>
        </div>
        <div className="ld-terminal ld-anim-staggered-list" style={{ padding: "var(--ld-space-3)", overflow: "hidden" }}>
          {commands.map((c, i) => (
            <div key={`${i}-${c.prompt}`} style={{ marginBottom: "10px" }}>
              <div>
                <span className="ld-terminal-prompt">$ </span>
                <span className="ld-terminal-cmd">{c.prompt}</span>
              </div>
              {c.output ? <div className="ld-terminal-output">{c.output}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </LinearFrame>
  );
}

export function LinearArchitectureOverviewSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation ?? "line-draw"}>
      <header className="ld-rule-top" style={{ gridColumn: "1 / 13", gridRow: "1 / 3" }}>
        <LinearSmallLabel>{props.kicker ?? "Architecture"}</LinearSmallLabel>
        <h1 className="ld-section-title" style={{ fontSize: "calc(var(--ld-type) * clamp(28px, 3vw, 48px))" }}>{props.title}</h1>
      </header>
      <div className="ld-panel" style={{ gridColumn: "1 / 13", gridRow: "3 / 8", padding: "40px", display: "grid", placeItems: "center" }}>
        {props.children ?? (
          <div style={{ display: "flex", alignItems: "center", gap: "0", width: "100%", justifyContent: "center" }}>
            {(props.items ?? []).slice(0, 5).map((item, i, arr) => (
              <Fragment key={item}>
                <span className="ld-node" style={{ flexDirection: "column", gap: "10px", padding: "20px" }}>
                  <LinearIconTile name={props.icons?.[i]} />
                  {item}
                </span>
                {i < arr.length - 1 ? <span className="ld-connector" style={{ maxWidth: "72px" }} /> : null}
              </Fragment>
            ))}
          </div>
        )}
      </div>
      {props.items && props.children ? (
        <div className="ld-meta-row" style={{ gridColumn: "1 / 13", gridRow: "8 / 9" }}>
          {props.items.slice(0, 4).map((item, i) => (
            <div key={item}>
              <dt>Component {String(i + 1).padStart(2, "0")}</dt>
              <dd>{item}</dd>
            </div>
          ))}
        </div>
      ) : null}
    </LinearFrame>
  );
}

export function LinearDataFlowSlide(props: LinearSlideProps) {
  const steps = (props.flowSteps ?? []).slice(0, 5);
  return (
    <LinearFrame animation={props.animation}>
      <header className="ld-rule-top" style={{ gridColumn: "1 / 6", gridRow: "1 / 4" }}>
        <LinearSmallLabel>{props.kicker ?? "Data Flow"}</LinearSmallLabel>
        <h1 className="ld-section-title" style={{ fontSize: "calc(var(--ld-type) * clamp(28px, 3vw, 48px))" }}>{props.title}</h1>
      </header>
      <div className="ld-anim-staggered-list" style={{ gridColumn: "1 / 13", gridRow: "4 / 9", display: "grid", gap: "12px", alignContent: "start" }}>
        {steps.map((s, i) => (
          <div className="ld-panel" key={`${i}-${s.label}`} style={{ padding: "18px 24px", display: "grid", gridTemplateColumns: "32px 1fr auto 1fr", alignItems: "center", columnGap: "20px" }}>
            <span className="ld-index" style={{ color: "var(--ld-accent)" }}>{String(i + 1).padStart(2, "0")}</span>
            <span style={{ fontFamily: "var(--ld-font-mono)", color: "var(--ld-ink)" }}>{s.from}</span>
            <span className="ld-connector-arrow" style={{ fontSize: "calc(var(--ld-type) * 20px)" }}>&rarr;</span>
            <span style={{ fontFamily: "var(--ld-font-mono)", color: "var(--ld-ink)" }}>
              {s.to}
              <span className="ld-body" style={{ display: "block", fontSize: "calc(var(--ld-type) * 13px)", fontFamily: "var(--ld-font-body)" }}>{s.label}</span>
            </span>
          </div>
        ))}
      </div>
    </LinearFrame>
  );
}
