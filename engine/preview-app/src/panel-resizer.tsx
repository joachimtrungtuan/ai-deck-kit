import type { PointerEvent as ReactPointerEvent } from "react";

type PanelResizerProps = {
  collapsed: boolean;
  maxWidth: number;
  minWidth: number;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onToggle: () => void;
  side: "left" | "right";
  width: number;
};

export function PanelResizer({ collapsed, maxWidth, minWidth, onPointerDown, onToggle, side, width }: PanelResizerProps) {
  const isLeft = side === "left";
  const name = isLeft ? "slide sidebar" : "slide editor";
  const arrow = collapsed ? (isLeft ? "▸" : "◂") : (isLeft ? "◂" : "▸");
  return (
    <div
      aria-label={`Resize ${name}`}
      aria-disabled={collapsed}
      aria-orientation="vertical"
      aria-valuemax={maxWidth}
      aria-valuemin={minWidth}
      aria-valuenow={collapsed ? undefined : width}
      className={`preview-sidebar-resizer${collapsed ? " is-disabled" : ""}`}
      onPointerDown={collapsed ? undefined : onPointerDown}
      role="separator"
    >
      <button
        aria-expanded={!collapsed}
        aria-label={collapsed ? `Expand ${name}` : `Collapse ${name}`}
        className="preview-sidebar-toggle"
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") event.stopPropagation();
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onToggle}
        type="button"
      >
        {arrow}
      </button>
    </div>
  );
}
