import { ClarityBody, ClarityFrame, ClarityKicker, ClarityList, ClarityTextIntro, type ClaritySlideProps } from "./shared";

export function ClarityTableSlide(props: ClaritySlideProps) {
  const comparison = (props.layoutVariant ?? "reference-table") === "comparison-table";
  const columns = (props.tableColumns ?? []).slice(0, 5);
  const rows = (props.tableRows ?? []).slice(0, 6);
  const recommended = comparison ? (props.recommendedColumn ?? 1) : -1;
  return (
    <ClarityFrame props={props}>
      <header style={{ gridColumn: "1 / 13", gridRow: "2 / 4" }}><ClarityTextIntro {...props} /></header>
      <div className="cc-table-wrap" style={{ gridColumn: "1 / 13", gridRow: "4 / 8" }}>
        <table className="cc-table">
          <thead><tr>{columns.map((column, index) => <th className={index === recommended ? "cc-table-recommended" : ""} key={column}>{column}</th>)}</tr></thead>
          <tbody>{rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row[0]}`}>{row.slice(0, 5).map((cell, index) => <td className={index === recommended ? "cc-table-recommended" : ""} key={`${index}-${cell}`}>{cell}</td>)}</tr>
          ))}</tbody>
        </table>
      </div>
    </ClarityFrame>
  );
}

export function ClarityCodeSlide(props: ClaritySlideProps) {
  const focus = (props.layoutVariant ?? "explain-and-code") === "focus-lines";
  const highlighted = new Set((props.highlightLines ?? []).slice(0, 3));
  const lines = (props.code ?? "").replace(/\n$/, "").split("\n").slice(0, 14);
  const code = (
    <pre className="cc-code">
      {lines.map((line, index) => (
        <span className={`cc-code-line${highlighted.has(index + 1) ? " cc-code-line-highlight" : ""}`} key={`${index}-${line}`}>
          <span className="cc-index">{String(index + 1).padStart(2, "0")}</span><span>{line || " "}</span>
        </span>
      ))}
    </pre>
  );
  return (
    <ClarityFrame props={props}>
      {focus ? (
        <>
          <header style={{ gridColumn: "1 / 13", gridRow: "2 / 3" }}><ClarityKicker>{props.kicker ?? props.language}</ClarityKicker></header>
          <div style={{ gridColumn: "1 / 13", gridRow: "3 / 8" }}>{code}</div>
        </>
      ) : (
        <>
          <aside style={{ gridColumn: "1 / 5", gridRow: "2 / 7" }}><ClarityTextIntro {...props} /></aside>
          <div style={{ gridColumn: "6 / 13", gridRow: "2 / 8" }}>{code}</div>
        </>
      )}
    </ClarityFrame>
  );
}

export function ClarityDataVisualSlide(props: ClaritySlideProps) {
  const variant = props.layoutVariant ?? "metric-highlight";
  if (variant === "comparison-chart") {
    const data = (props.chartData ?? []).slice(0, 5);
    const max = Math.max(...data.map((item) => item.value), 1);
    return (
      <ClarityFrame props={props}>
        <aside style={{ gridColumn: "1 / 5", gridRow: "2 / 7" }}><ClarityTextIntro {...props} /></aside>
        <div style={{ gridColumn: "6 / 13", gridRow: "2 / 7", paddingBottom: "34px" }}>
          <div className="cc-chart">
            {data.map((item, index) => (
              <div className={`cc-chart-bar${index === data.length - 1 ? " is-accent" : ""}`} key={item.label} style={{ height: `${Math.max(12, (item.value / max) * 100)}%` }}>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </ClarityFrame>
    );
  }
  if (variant === "concept-diagram") {
    return (
      <ClarityFrame props={props}>
        <header style={{ gridColumn: "1 / 5", gridRow: "2 / 6" }}><ClarityTextIntro {...props} /></header>
        <div className="cc-diagram" style={{ gridColumn: "6 / 13", gridRow: "2 / 7" }}>
          {props.children ?? (props.items ?? []).slice(0, 4).map((item, index) => (
            <div className="cc-diagram-node" key={item}><span className="cc-index">{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></div>
          ))}
        </div>
      </ClarityFrame>
    );
  }
  return (
    <ClarityFrame props={props}>
      <div style={{ gridColumn: "1 / 9", gridRow: "2 / 6", alignSelf: "center" }}>
        <ClarityKicker>{props.kicker}</ClarityKicker>
        <p className="cc-metric">{props.metric ?? props.title}</p>
        <ClarityBody>{props.metricLabel ?? props.body}</ClarityBody>
      </div>
      <aside style={{ gridColumn: "9 / 13", gridRow: "3 / 7" }}><ClarityList items={props.items} /></aside>
    </ClarityFrame>
  );
}
