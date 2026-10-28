import { useState } from "react";
import { rehearsalMarkdown, type RehearsalRow } from "./rehearsal-log";

const mmss = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** Actual vs target time per slide, with a copy button; never writes to the deck. */
export function RehearsalLogPanel({ onClose, rows }: { onClose: () => void; rows: RehearsalRow[] }) {
  const [copied, setCopied] = useState<"ok" | "failed" | null>(null);
  const copy = () => navigator.clipboard.writeText(rehearsalMarkdown(rows)).then(() => setCopied("ok"), () => setCopied("failed"));
  return <section aria-label="Rehearsal log" className="present-rehearsal">
    <header><h2>Rehearsal log</h2><button onClick={copy} type="button">Copy as Markdown</button><button onClick={onClose} type="button">Close</button>{copied && <span role="status">{copied === "ok" ? "Copied" : "Copy blocked by the browser"}</span>}</header>
    {rows.length === 0 ? <p>Nothing recorded yet. Present a few slides first.</p> : <table>
      <thead><tr><th>#</th><th>Slide</th><th>Actual</th><th>Target</th></tr></thead>
      <tbody>{rows.map((row, i) => <tr key={row.slideId}><td>{i + 1}</td><td>{row.title}</td><td>{mmss(row.actualSeconds)}</td><td>{row.targetSeconds === undefined ? "–" : mmss(row.targetSeconds)}</td></tr>)}</tbody>
    </table>}
  </section>;
}
