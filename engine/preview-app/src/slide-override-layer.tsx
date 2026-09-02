import type { SlideOverride } from "./preview-types";

// Renders a slide's optional css/html overrides as siblings of <slide.Component> inside the
// deck wrapper div. The `<style>` tag works as a direct JSX child inside the portaled frame body;
// the overlay div is absolutely positioned because .fixed-slide-canvas's wrapper fills the native
// 1600x900 frame. It carries zIndex above template content (both shipped templates cap content at
// z-index: 1) so an override HTML block paints ON TOP of the slide layout it is recorded against —
// that is the whole point of an overlay; the layer is emitted after <slide.Component> in every
// render site. pointerEvents "none" keeps overlays from blocking Agentation click-to-annotate;
// authors who need an interactive element set pointer-events:auto on it inline.
export function SlideOverrideLayer({ override }: { override?: SlideOverride }) {
  if (!override?.css && !override?.html) return null;
  return (
    <>
      {override.css ? <style>{override.css}</style> : null}
      {override.html ? (
        <div
          className="aideck-override-overlay"
          style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}
          dangerouslySetInnerHTML={{ __html: override.html }}
        />
      ) : null}
    </>
  );
}
