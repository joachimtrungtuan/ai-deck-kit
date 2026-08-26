import type { SlideOverride } from "./preview-types";

// Renders a slide's optional css/html overrides as siblings of <slide.Component> inside the
// deck wrapper div. The `<style>` tag works as a direct JSX child inside the portaled frame body;
// the overlay div is absolutely positioned because .fixed-slide-canvas's wrapper fills the native
// 1600x900 frame. pointerEvents "none" keeps overlays from blocking Agentation click-to-annotate;
// authors who need an interactive element set pointer-events:auto on it inline.
export function SlideOverrideLayer({ override }: { override?: SlideOverride }) {
  if (!override?.css && !override?.html) return null;
  return (
    <>
      {override.css ? <style>{override.css}</style> : null}
      {override.html ? (
        <div
          className="aideck-override-overlay"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          dangerouslySetInnerHTML={{ __html: override.html }}
        />
      ) : null}
    </>
  );
}
