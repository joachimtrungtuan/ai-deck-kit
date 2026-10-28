import { useEffect, useRef } from "react";
import { isExportGotoMessage, type ExportStateMessage } from "./export-bridge-messages";
import type { SlideSummary } from "./presenter-channel";

/**
 * Lets an exported deck embedded in the presenter's iframe be driven from outside. Additive only:
 * a standalone export never receives these messages, and nothing about notes crosses this bridge.
 */
export function useExportBridge(slides: SlideSummary[], active: number, go: (index: number) => void): void {
  const goRef = useRef(go);
  goRef.current = go;

  useEffect(() => {
    if (window.parent === window) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      if (isExportGotoMessage(event.data, event.origin, window.location.origin)) goRef.current(event.data.index);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (window.parent === window) return;
    const state: ExportStateMessage = { aideck: "state", index: active, slides };
    window.parent.postMessage(state, window.location.origin);
  }, [active, slides]);
}
