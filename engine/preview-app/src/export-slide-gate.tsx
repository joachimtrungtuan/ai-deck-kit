import { useEffect, useState } from "react";

// A load that finishes inside this window never flashes the gate.
const GATE_DELAY_MS = 150;

/** Stands in for a slide whose images are still arriving: slide number plus how many have loaded. */
export function SlideGate({ slideNumber, done, total, failures = [] }: { slideNumber: number; done: number; total: number; failures?: string[] }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), GATE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="slide-gate" role="status" aria-live="polite">
      <span className="slide-gate-number">{String(slideNumber).padStart(2, "0")}</span>
      {failures.length > 0 && <span className="slide-gate-error">Unable to load: {failures.join(", ")}</span>}
      <div className="slide-gate-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
