import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PreviewSlide, PreviewSource } from "./preview-types";
import { SlideOverrideLayer } from "./slide-override-layer";
import "./fixed-slide-canvas.css";

const SLIDE_WIDTH = 1600;
const SLIDE_HEIGHT = 900;

type DocumentRef = { current: Document | null };

/** Pins every entrance animation on its final state, for static slide previews. */
export const STILL_FRAME_CSS = '[class*="ld-anim"],[class*="swiss-anim"],[class*="cc-anim"],[class*="primitive-anim"]{animation:none!important;clip-path:none!important;transform:none!important;opacity:1!important}';

// Agentation's annotation schema carries no slide identity, but its forensic output prints the
// element's full DOM path from <body>, ancestor ids included. Naming the slide wrapper is therefore
// what makes a pasted annotation say which of 25 slides it belongs to. Mirrors the sidebar label
// ("07" + slide type) so the address a reviewer pastes matches the one they clicked.
function slideDomId(slide: PreviewSlide, slideIndex?: number): string {
  // Deliberately the slide type, not its id: the sidebar labels slides by type, and a manifest-built
  // deck's ids are bare ordinals ("slide-01") that would say nothing an index doesn't already say.
  const name = slide.type.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (slideIndex === undefined) return `slide-${name}`;
  const ordinal = String(slideIndex + 1).padStart(2, "0");
  // Slide ids frequently already open with their own number (`01-mo-dau`); don't repeat it.
  return name.startsWith(`${ordinal}-`) ? `slide-${name}` : `slide-${ordinal}-${name}`;
}

export function FixedSlideCanvas({
  documentRef,
  mountAgentation,
  slide,
  slideIndex,
  source,
  still = false,
}: {
  documentRef?: DocumentRef;
  mountAgentation?: boolean;
  slide: PreviewSlide;
  slideIndex?: number;
  source: PreviewSource;
  still?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameBody, setFrameBody] = useState<HTMLElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const fit = () => {
      setScale(Math.min(container.clientWidth / SLIDE_WIDTH, container.clientHeight / SLIDE_HEIGHT));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  function initFrame() {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    doc.head.querySelectorAll("[data-deck-style]").forEach((node) => node.remove());
    document.head.querySelectorAll("style, link[rel='stylesheet']").forEach((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.setAttribute("data-deck-style", "");
      doc.head.appendChild(clone);
    });
    if (still) {
      const freeze = doc.createElement("style");
      freeze.setAttribute("data-deck-style", "");
      freeze.textContent = STILL_FRAME_CSS;
      doc.head.appendChild(freeze);
    }
    doc.documentElement.style.background = "#000";
    doc.body.style.margin = "0";
    doc.body.style.background = "#000";
    if (mountAgentation && !doc.querySelector("script[data-agentation-entry]")) {
      // The frame has no src, so Agentation slugs every deck's storage bucket to the same
      // "blank" key. Hand the entry script a deck slug to scope those keys with.
      (doc.defaultView as unknown as { __aideckDeckSlug?: string }).__aideckDeckSlug = source.id;
      const script = doc.createElement("script");
      script.type = "module";
      script.src = new URL("/src/iframe-agentation-entry.tsx", window.location.origin).href;
      script.dataset.agentationEntry = "";
      doc.body.appendChild(script);
    }
    if (documentRef) documentRef.current = doc;
    setFrameBody(doc.body);
  }

  useLayoutEffect(() => {
    initFrame();
  }, [source]);

  return (
    <div className="fixed-slide-canvas" ref={containerRef}>
      <iframe
        className="fixed-slide-frame"
        onLoad={initFrame}
        ref={frameRef}
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
        title={source.label}
      />
      {frameBody &&
        createPortal(
          <div
            className={source.deckClass}
            data-slide-id={slide.id}
            data-layout-variant={mountAgentation ? slide.layoutVariant : undefined}
            data-slide-index={mountAgentation && slideIndex !== undefined ? String(slideIndex + 1).padStart(2, "0") : undefined}
            data-slide-type={mountAgentation ? slide.type : undefined}
            data-template={mountAgentation ? source.id : undefined}
            id={mountAgentation ? slideDomId(slide, slideIndex) : undefined}
            key={slide.id ?? slide.type}
            style={{ viewTransitionName: slide.morphAnchors?.[0] }}
          >
            <slide.Component {...slide.props} />
            <SlideOverrideLayer override={slide.override} />
          </div>,
          frameBody,
        )}
    </div>
  );
}
