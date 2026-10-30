import type { KeyboardEvent, PointerEvent, RefObject } from "react";

const KEY_STEP_PERCENT = 2;

/**
 * A draggable divider between two columns of `containerRef`. Reports the left column's width as a
 * percentage, clamped so neither column drops below its minimum pixel width.
 */
export function ColumnSplitter({ containerRef, minLeftPx, minRightPx, onChange, percent }: {
  containerRef: RefObject<HTMLElement | null>;
  minLeftPx: number;
  minRightPx: number;
  onChange: (percent: number) => void;
  percent: number;
}) {
  const clampTo = (leftPx: number) => {
    const width = containerRef.current?.getBoundingClientRect().width ?? 0;
    if (width <= minLeftPx + minRightPx) return;
    onChange((Math.max(minLeftPx, Math.min(width - minRightPx, leftPx)) / width) * 100);
  };
  const toPx = (value: number) => ((containerRef.current?.getBoundingClientRect().width ?? 0) * value) / 100;

  // Slide iframes would swallow pointer moves mid-drag, so they ignore the pointer while resizing.
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.classList.add("present-resizing");
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    clampTo(event.clientX - (containerRef.current?.getBoundingClientRect().left ?? 0));
  };
  const onPointerEnd = () => document.body.classList.remove("present-resizing");
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    event.stopPropagation();
    clampTo(toPx(percent + (event.key === "ArrowRight" ? KEY_STEP_PERCENT : -KEY_STEP_PERCENT)));
  };

  return <div
    aria-label="Resize slides and notes columns" aria-orientation="vertical" aria-valuenow={Math.round(percent)}
    className="present-splitter" onKeyDown={onKeyDown} onLostPointerCapture={onPointerEnd} onPointerDown={onPointerDown}
    onPointerMove={onPointerMove} onPointerUp={onPointerEnd} role="separator" tabIndex={0}
  />;
}
