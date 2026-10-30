import { useEffect, useRef, useState } from "react";
import { FixedSlideCanvas, STILL_FRAME_CSS } from "../fixed-slide-canvas";
import type { PreviewSource } from "../preview-types";
import { goToSlide } from "../slide-transition-runtime";
import { isExportStateMessage, type ExportGotoMessage } from "./export-bridge-messages";
import type { SlideSummary } from "./presenter-channel";

export type MirrorSourceKind = "live" | "export";

/**
 * Renders one slide position from the live deck source or from the built export iframe. A `still`
 * frame (the presenter's previous/next previews) freezes every entrance animation on its final state.
 */
export function MirrorFrame({ exportUrl, index, kind, onExportState, source, still = false }: {
  exportUrl: string | null;
  index: number;
  kind: MirrorSourceKind;
  onExportState?: (slides: SlideSummary[], index: number) => void;
  source: PreviewSource;
  still?: boolean;
}) {
  if (kind === "live") return <LiveFrame index={index} source={source} still={still} />;
  return <ExportFrame exportUrl={exportUrl} index={index} onState={onExportState} still={still} />;
}

// Moving between indexes goes through the same transition runtime as the editor preview, so the
// audience sees the deck's slide transitions; a still preview just cuts.
function LiveFrame({ index, source, still }: { index: number; source: PreviewSource; still: boolean }) {
  const documentRef = useRef<Document | null>(null);
  const clamp = (value: number) => Math.max(0, Math.min(value, source.slides.length - 1));
  const [shown, setShown] = useState(() => clamp(index));
  const target = clamp(index);

  useEffect(() => {
    if (target === shown) return;
    if (still) { setShown(target); return; }
    goToSlide({
      frameDocument: documentRef.current,
      from: source.slides[shown],
      to: source.slides[target],
      direction: target >= shown ? "forward" : "backward",
      source,
      commit: () => setShown(target),
    });
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  const slideIndex = clamp(shown);
  return <FixedSlideCanvas documentRef={documentRef} slide={source.slides[slideIndex]} slideIndex={slideIndex} source={source} still={still} />;
}

function ExportFrame({ exportUrl, index, onState, still }: { exportUrl: string | null; index: number; onState?: (slides: SlideSummary[], index: number) => void; still: boolean }) {
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

  // The export is same-origin and navigates by message, so a style added once on load persists.
  const freeze = () => {
    const doc = frameRef.current?.contentDocument;
    if (!still || !doc || doc.querySelector("style[data-still-style]")) return;
    const style = doc.createElement("style");
    style.dataset.stillStyle = "";
    style.textContent = STILL_FRAME_CSS;
    doc.head.appendChild(style);
  };

  if (!exportUrl) return <p className="mirror-frame-missing">No export available for this source.</p>;
  return <iframe className="mirror-frame-export" onLoad={freeze} ref={frameRef} src={exportUrl} title="Exported deck" style={{ border: 0, width: "100%", height: "100%", background: "#000" }} />;
}
