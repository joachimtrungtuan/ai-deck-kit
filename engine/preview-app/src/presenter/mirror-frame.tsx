import { useEffect, useRef } from "react";
import { FixedSlideCanvas } from "../fixed-slide-canvas";
import type { PreviewSource } from "../preview-types";
import { isExportStateMessage, type ExportGotoMessage } from "./export-bridge-messages";
import type { SlideSummary } from "./presenter-channel";

export type MirrorSourceKind = "live" | "export";

/** Renders one slide position from the live deck source or from the built export iframe. */
export function MirrorFrame({ exportUrl, index, kind, onExportState, source }: {
  exportUrl: string | null;
  index: number;
  kind: MirrorSourceKind;
  onExportState?: (slides: SlideSummary[], index: number) => void;
  source: PreviewSource;
}) {
  if (kind === "live") {
    const slide = source.slides[Math.min(index, source.slides.length - 1)];
    return <FixedSlideCanvas slide={slide} slideIndex={index} source={source} />;
  }
  return <ExportFrame exportUrl={exportUrl} index={index} onState={onExportState} />;
}

function ExportFrame({ exportUrl, index, onState }: { exportUrl: string | null; index: number; onState?: (slides: SlideSummary[], index: number) => void }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const indexRef = useRef(index);
  indexRef.current = index;

  const sendGoto = (target: number) => {
    const message: ExportGotoMessage = { aideck: "goto", index: target };
    frameRef.current?.contentWindow?.postMessage(message, window.location.origin);
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isExportStateMessage(event.data, event.origin, window.location.origin)) return;
      onState?.(event.data.slides, event.data.index);
      if (event.data.index !== indexRef.current) sendGoto(indexRef.current);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onState]);

  useEffect(() => sendGoto(index), [index]);

  if (!exportUrl) return <p className="mirror-frame-missing">No export available for this source.</p>;
  return <iframe className="mirror-frame-export" ref={frameRef} src={exportUrl} title="Exported deck" style={{ border: 0, width: "100%", height: "100%", background: "#000" }} />;
}
