import { renderRichText } from "../../../../primitives/blocks";
import { SwissFrame, SwissList, SwissSmallLabel, type SwissSlideProps } from "./shared";

function SwissCodeBlock({ code = "", highlightLines = [], label }: { code?: string; highlightLines?: number[]; label?: string }) {
  const highlighted = new Set(highlightLines);
  const lines = code.replace(/\n$/, "").split("\n").slice(0, 14);
  return (
    <section className="swiss-panel" style={{ display: "grid", gridTemplateRows: "auto 1fr", minHeight: 0, overflow: "hidden" }}>
      <SwissSmallLabel>{label ?? "Code"}</SwissSmallLabel>
      <pre style={{ margin: 0, padding: "20px 24px", overflow: "hidden", fontFamily: "var(--swiss-font-mono)", fontSize: "clamp(12px, 1vw, 16px)", lineHeight: 1.45 }}>
        {lines.map((line, index) => (
          <div key={`${index}-${line}`} style={{ background: highlighted.has(index + 1) ? "var(--swiss-ink)" : undefined, color: highlighted.has(index + 1) ? "var(--swiss-emphasis-ink)" : undefined, padding: "0 8px" }}>
            <span style={{ display: "inline-block", width: "3ch", color: highlighted.has(index + 1) ? "inherit" : "var(--swiss-soft)" }}>{index + 1}</span>
            {line || " "}
          </div>
        ))}
      </pre>
    </section>
  );
}

export function SwissCodeSnippetSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <header className="swiss-rule-top" style={{ gridColumn: "1 / 6", gridRow: "1 / 8" }}>
        <SwissSmallLabel>{renderRichText(props.kicker ?? props.language ?? "Code")}</SwissSmallLabel>
        <h1 className="swiss-section-title">{renderRichText(props.title)}</h1>
        {props.body ? <p className="swiss-body">{renderRichText(props.body)}</p> : null}
      </header>
      <div style={{ gridColumn: "6 / 13", gridRow: "1 / 9", minHeight: 0 }}>
        <SwissCodeBlock code={props.code} highlightLines={props.highlightLines} label={props.caption ?? props.language} />
      </div>
    </SwissFrame>
  );
}

export function SwissTerminalOutputSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <header className="swiss-rule-top" style={{ gridColumn: "1 / 7", gridRow: "1 / 4" }}>
        <SwissSmallLabel>{renderRichText(props.kicker ?? "Terminal")}</SwissSmallLabel>
        <h1 className="swiss-section-title">{renderRichText(props.title)}</h1>
      </header>
      <section className="swiss-panel primitive-anim-staggered-list" style={{ gridColumn: "1 / 13", gridRow: "4 / 9", padding: "28px 32px", overflow: "hidden", fontFamily: "var(--swiss-font-mono)", fontSize: "clamp(13px, 1.1vw, 18px)", lineHeight: 1.5 }}>
        {(props.commands ?? []).map((command, index) => (
          <div key={`${index}-${command.prompt}`} style={{ marginBottom: "14px" }}>
            <div><strong>$</strong> {command.prompt}</div>
            {command.output ? <div style={{ color: "var(--swiss-muted)", whiteSpace: "pre-wrap" }}>{command.output}</div> : null}
          </div>
        ))}
      </section>
    </SwissFrame>
  );
}

export function SwissArchitectureOverviewSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation ?? "line-draw"}>
      <header className="swiss-rule-top" style={{ gridColumn: "1 / 13", gridRow: "1 / 3" }}>
        <SwissSmallLabel>{renderRichText(props.kicker ?? "Architecture")}</SwissSmallLabel>
        <h1 className="swiss-section-title">{renderRichText(props.title)}</h1>
      </header>
      <section className="swiss-panel" style={{ gridColumn: "1 / 13", gridRow: "3 / 9", padding: "40px", display: "grid", placeItems: "center" }}>
        {props.children ?? <SwissList items={props.items} />}
      </section>
    </SwissFrame>
  );
}

export function SwissDataFlowSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <header className="swiss-rule-top" style={{ gridColumn: "1 / 7", gridRow: "1 / 4" }}>
        <SwissSmallLabel>{renderRichText(props.kicker ?? "Data flow")}</SwissSmallLabel>
        <h1 className="swiss-section-title">{renderRichText(props.title)}</h1>
      </header>
      <div className="primitive-anim-staggered-list" style={{ gridColumn: "1 / 13", gridRow: "4 / 9", display: "grid", alignContent: "start", gap: "12px" }}>
        {(props.flowSteps ?? []).slice(0, 5).map((step, index) => (
          <div className="swiss-panel" key={`${index}-${step.label}`} style={{ display: "grid", gridTemplateColumns: "48px 1fr auto 1fr", gap: "16px", alignItems: "center", padding: "16px 20px" }}>
            <span className="swiss-index">{String(index + 1).padStart(2, "0")}</span>
            <span style={{ fontFamily: "var(--swiss-font-mono)" }}>{step.from}</span>
            <span aria-hidden>&rarr;</span>
            <span><strong>{step.to}</strong><span className="swiss-body" style={{ display: "block" }}>{step.label}</span></span>
          </div>
        ))}
      </div>
    </SwissFrame>
  );
}
