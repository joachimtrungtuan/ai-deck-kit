import { renderRichText } from "../../../../primitives/blocks";
import { SwissFrame, SwissSmallLabel, type SwissSlideProps } from "./shared";

function SwissCodePanel({ code, label }: { code?: string; label: string }) {
  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: "10px", minHeight: 0 }}>
      <SwissSmallLabel>{label}</SwissSmallLabel>
      <pre className="swiss-panel" style={{ margin: 0, padding: "20px", overflow: "hidden", whiteSpace: "pre-wrap", fontFamily: "var(--swiss-font-mono)", fontSize: "clamp(12px, 0.95vw, 15px)", lineHeight: 1.45 }}>{code ?? ""}</pre>
    </div>
  );
}

function SwissTable({ columns = [], rows = [], recommendedColumn }: { columns?: string[]; rows?: string[][]; recommendedColumn?: number }) {
  const visibleColumns = columns.slice(0, 5);
  return (
    <div className="swiss-panel" style={{ overflow: "hidden", padding: "12px 24px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>{visibleColumns.map((column, index) => <th key={column} style={{ padding: "12px 8px", borderBottom: "2px solid var(--swiss-ink)", background: recommendedColumn === index ? "var(--swiss-ink)" : undefined, color: recommendedColumn === index ? "var(--swiss-emphasis-ink)" : undefined, fontFamily: "var(--swiss-font-mono)", fontSize: "11px", textAlign: "left", textTransform: "uppercase" }}>{column}</th>)}</tr>
        </thead>
        <tbody className="primitive-anim-staggered-list">
          {rows.slice(0, 6).map((row, rowIndex) => <tr key={`${rowIndex}-${row[0]}`}>{row.slice(0, 5).map((cell, columnIndex) => <td key={`${columnIndex}-${cell}`} style={{ padding: "12px 8px", borderBottom: "var(--swiss-rule)", background: recommendedColumn === columnIndex ? "color-mix(in srgb, var(--swiss-ink) 8%, transparent)" : undefined, fontSize: "clamp(12px, 0.95vw, 16px)" }}>{cell}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export function SwissApiEndpointSlide(props: SwissSlideProps) {
  return (
    <SwissFrame animation={props.animation}>
      <header className="swiss-rule-top" style={{ gridColumn: "1 / 13", gridRow: "1 / 3" }}>
        <SwissSmallLabel>{renderRichText(props.kicker ?? "API")}</SwissSmallLabel>
        <h1 className="swiss-section-title"><span className="swiss-index" style={{ marginRight: "16px" }}>{props.method}</span><span style={{ fontFamily: "var(--swiss-font-mono)" }}>{props.path ?? props.title}</span></h1>
        {props.body ? <p className="swiss-body">{renderRichText(props.body)}</p> : null}
      </header>
      <div style={{ gridColumn: "1 / 7", gridRow: "3 / 9" }}><SwissCodePanel label="Request" code={props.requestExample} /></div>
      <div style={{ gridColumn: "7 / 13", gridRow: "3 / 9" }}><SwissCodePanel label="Response" code={props.responseExample} /></div>
    </SwissFrame>
  );
}

function SwissTableSlide(props: SwissSlideProps & { recommendedColumn?: number; label: string }) {
  return (
    <SwissFrame animation={props.animation}>
      <header className="swiss-rule-top" style={{ gridColumn: "1 / 13", gridRow: "1 / 3" }}>
        <SwissSmallLabel>{renderRichText(props.kicker ?? props.label)}</SwissSmallLabel>
        <h1 className="swiss-section-title">{renderRichText(props.title)}</h1>
      </header>
      <div style={{ gridColumn: "1 / 13", gridRow: "3 / 9" }}><SwissTable columns={props.tableColumns} rows={props.tableRows} recommendedColumn={props.recommendedColumn} /></div>
    </SwissFrame>
  );
}

export function SwissSpecTableSlide(props: SwissSlideProps) {
  return <SwissTableSlide {...props} label="Specification" />;
}

export function SwissComparisonTableSlide(props: SwissSlideProps) {
  return <SwissTableSlide {...props} label="Comparison" recommendedColumn={props.recommendedColumn ?? 1} />;
}

export function SwissDecisionRecordSlide(props: SwissSlideProps) {
  const panels = [
    { label: "Context", content: props.context },
    { label: "Decision", content: props.decision },
    { label: "Consequences", content: (props.consequences ?? []).map((entry, index) => `${String(index + 1).padStart(2, "0")} ${entry}`).join("\n") },
  ];
  return (
    <SwissFrame animation={props.animation}>
      <header className="swiss-rule-top" style={{ gridColumn: "1 / 13", gridRow: "1 / 3" }}>
        <SwissSmallLabel>{renderRichText(props.kicker ?? "Decision record")}</SwissSmallLabel>
        <h1 className="swiss-section-title">{renderRichText(props.title)}</h1>
      </header>
      {panels.map((panel, index) => <section className="swiss-panel" key={panel.label} style={{ gridColumn: `${1 + index * 4} / ${5 + index * 4}`, gridRow: "3 / 9", padding: "28px", borderTop: index === 1 ? "3px solid var(--swiss-ink)" : undefined }}><SwissSmallLabel>{panel.label}</SwissSmallLabel><p className="swiss-body" style={{ marginTop: "24px", whiteSpace: "pre-wrap" }}>{renderRichText(panel.content)}</p></section>)}
    </SwissFrame>
  );
}
