import { renderRichText, tableColumnWidthPercentages } from "../../../../primitives/blocks";
import { LinearFrame, LinearSmallLabel, type LinearSlideProps } from "./shared";
import { CodeBlock } from "./technical-slides";

export function LinearApiEndpointSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <header className="ld-rule-top" style={{ gridColumn: "1 / 13", gridRow: "1 / 3" }}>
        <LinearSmallLabel>{renderRichText(props.kicker ?? "API")}</LinearSmallLabel>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "var(--ld-space-2)" }}>
          {props.method ? <span className="ld-chip ld-chip-accent">{props.method}</span> : null}
          <span style={{ fontFamily: "var(--ld-font-mono)", fontSize: "calc(var(--ld-type) * clamp(20px, 2.4vw, 38px))", color: "var(--ld-ink)" }}>{props.path ?? props.title}</span>
        </div>
        {props.body ? <p className="ld-body" style={{ marginTop: "var(--ld-space-2)" }}>{renderRichText(props.body)}</p> : null}
      </header>
      <div style={{ gridColumn: "1 / 7", gridRow: "3 / 9", display: "grid", gridTemplateRows: "auto 1fr", gap: "12px" }}>
        <LinearSmallLabel>Request</LinearSmallLabel>
        <CodeBlock code={props.requestExample} label="request" />
      </div>
      <div style={{ gridColumn: "7 / 13", gridRow: "3 / 9", display: "grid", gridTemplateRows: "auto 1fr", gap: "12px" }}>
        <LinearSmallLabel>Response</LinearSmallLabel>
        <CodeBlock code={props.responseExample} label="response" />
      </div>
    </LinearFrame>
  );
}

function LinearTable(props: LinearSlideProps & { recommendedColumn?: number; gridRow?: string }) {
  const columns = (props.tableColumns ?? []).slice(0, 5);
  const rows = (props.tableRows ?? []).slice(0, 6);
  const widths = tableColumnWidthPercentages(props.tableColumnWidths, columns.length);
  const rec = props.recommendedColumn;
  return (
    <div className="ld-panel" style={{ gridColumn: "1 / 13", gridRow: props.gridRow ?? "3 / 9", padding: "8px 24px 14px", overflow: "hidden", alignSelf: "start" }}>
      <table className="ld-table" style={widths ? { tableLayout: "fixed" } : undefined}>
        {widths ? <colgroup>{widths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup> : null}
        <thead>
          <tr>
            {columns.map((col, c) => (
              <th key={col} className={rec === c ? "ld-table-col-recommended" : undefined}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody className="primitive-anim-staggered-list">
          {rows.map((row, r) => (
            <tr key={`${r}-${row[0]}`}>
              {row.slice(0, 5).map((cell, c) => (
                <td key={`${c}-${cell}`} className={rec === c ? "ld-table-col-recommended" : undefined}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LinearSpecTableSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <header className="ld-rule-top" style={{ gridColumn: "1 / 13", gridRow: "1 / 3" }}>
        <LinearSmallLabel>{renderRichText(props.kicker ?? "Specification")}</LinearSmallLabel>
        <h1 className="ld-section-title" style={{ fontSize: "calc(var(--ld-type) * clamp(28px, 3vw, 48px))" }}>{renderRichText(props.title)}</h1>
      </header>
      <LinearTable {...props} gridRow="3 / 8" />
    </LinearFrame>
  );
}

export function LinearComparisonTableSlide(props: LinearSlideProps) {
  return (
    <LinearFrame animation={props.animation}>
      <header className="ld-rule-top" style={{ gridColumn: "1 / 13", gridRow: "1 / 3" }}>
        <LinearSmallLabel>{renderRichText(props.kicker ?? "Comparison")}</LinearSmallLabel>
        <h1 className="ld-section-title" style={{ fontSize: "calc(var(--ld-type) * clamp(28px, 3vw, 48px))" }}>{renderRichText(props.title)}</h1>
      </header>
      <LinearTable {...props} recommendedColumn={props.recommendedColumn ?? 1} />
    </LinearFrame>
  );
}

export function LinearDecisionRecordSlide(props: LinearSlideProps) {
  const panels = [
    { label: "Context", body: props.context, accent: false },
    { label: "Decision", body: props.decision, accent: true },
    { label: "Consequences", body: null, accent: false },
  ];
  return (
    <LinearFrame animation={props.animation}>
      <header className="ld-rule-top" style={{ gridColumn: "1 / 13", gridRow: "1 / 3" }}>
        <LinearSmallLabel>{renderRichText(props.kicker ?? "Decision Record")}</LinearSmallLabel>
        <h1 className="ld-section-title" style={{ fontSize: "calc(var(--ld-type) * clamp(28px, 3vw, 48px))" }}>{renderRichText(props.title)}</h1>
      </header>
      {panels.map((p, i) => (
        <section
          className={`ld-panel${p.accent ? " ld-panel-accent" : ""}`}
          key={p.label}
          style={{ gridColumn: `${1 + i * 4} / ${5 + i * 4}`, gridRow: "3 / 9", padding: "28px", display: "grid", gridTemplateRows: "auto 1fr", gap: "16px" }}
        >
          <LinearSmallLabel>{p.label}</LinearSmallLabel>
          {p.label === "Consequences" ? (
            <ol className="ld-list">
              {(props.consequences ?? []).map((c, ci) => (
                <li key={c}>
                  <span className="ld-index">{String(ci + 1).padStart(2, "0")}</span>
                  <span>{renderRichText(c)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="ld-body" style={{ color: p.accent ? "var(--ld-ink)" : undefined }}>{renderRichText(p.body)}</p>
          )}
        </section>
      ))}
    </LinearFrame>
  );
}
