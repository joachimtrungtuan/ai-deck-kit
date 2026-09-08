import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type PanelResizeOptions = {
  defaultWidth: number;
  direction: "left" | "right";
  maxWidth: number;
  minWidth: number;
  widthStorageKey: string;
};

export function usePanelResize({ defaultWidth, direction, maxWidth, minWidth, widthStorageKey }: PanelResizeOptions) {
  const clamp = useCallback((width: number) => Math.max(minWidth, Math.min(maxWidth, width)), [maxWidth, minWidth]);
  const [width, setWidth] = useState(() => readWidth(widthStorageKey, defaultWidth, clamp));
  const widthRef = useRef(width);
  const cleanupRef = useRef<(() => void) | null>(null);

  const updateWidth = useCallback((nextWidth: number) => {
    const next = clamp(nextWidth);
    widthRef.current = next;
    setWidth(next);
  }, [clamp]);

  const startResize = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    cleanupRef.current?.();
    const handle = event.currentTarget;
    const pointerId = event.pointerId;
    handle.setPointerCapture(pointerId);
    const startX = event.clientX;
    const startWidth = widthRef.current;
    const multiplier = direction === "left" ? 1 : -1;
    let active = true;
    const onMove = (moveEvent: PointerEvent) => updateWidth(startWidth + (moveEvent.clientX - startX) * multiplier);
    const cleanup = () => {
      if (!active) return;
      active = false;
      localStorage.setItem(widthStorageKey, String(widthRef.current));
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
      if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
      if (cleanupRef.current === cleanup) cleanupRef.current = null;
    };
    cleanupRef.current = cleanup;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", cleanup);
    window.addEventListener("pointercancel", cleanup);
  }, [direction, updateWidth, widthStorageKey]);

  useEffect(() => () => cleanupRef.current?.(), []);
  return { startResize, width };
}

function readWidth(key: string, fallback: number, clamp: (width: number) => number): number {
  const stored = localStorage.getItem(key);
  const width = stored === null ? Number.NaN : Number(stored);
  return Number.isFinite(width) ? clamp(width) : fallback;
}
