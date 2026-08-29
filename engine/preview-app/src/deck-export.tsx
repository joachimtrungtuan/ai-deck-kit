import { useEffect, useRef, useState } from "react";
import { goToSlide } from "./slide-transition-runtime";
import { FixedSlideCanvas } from "./fixed-slide-canvas";
import type { PreviewSource } from "./preview-types";
import { SlideOverrideLayer } from "./slide-override-layer";

// The templates size type/layout with viewport units (e.g. clamp(48px, 6vw, 96px)) and a
// max-width media query. A CSS transform does NOT change what `vw` resolves to, so a scaled
// div would still react to the real window width. Rendering the slide inside a fixed 1600x900
// iframe pins the viewport: `100vw` is always 1600px there, so the deck is a truly fixed canvas
// that only zooms (never reflows) as the window changes.
//
// PDF (?print) renders every slide stacked, one per 1600x900 page, in the main document. The PDF
// exporter captures this stacked layout as pixels and crops it into one flattened page per slide,
// avoiding heavy vector/CSS PDFs that macOS Preview can render poorly.

export function DeckExport({ source }: { source: PreviewSource }) {
  const isPrint =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("print");
  return isPrint ? <PrintDeck source={source} /> : <ScreenDeck source={source} />;
}

// Interactive, fixed-canvas view: one iframe-isolated slide, zoomed to fit, with nav controls.
function ScreenDeck({ source }: { source: PreviewSource }) {
  const slides = source.slides;
  const total = slides.length;
  const [active, setActive] = useState(0);
  const activeSlide = slides[active];
  const [jumpValue, setJumpValue] = useState("1");
  const [controlsVisible, setControlsVisible] = useState(true);
  const frameDocumentRef = useRef<Document | null>(null);

  const go = (next: number) => {
    const index = Math.max(0, Math.min(total - 1, next));
    goToSlide({
      frameDocument: frameDocumentRef.current,
      from: slides[active],
      to: slides[index],
      direction: index >= active ? "forward" : "backward",
      source,
      commit: () => setActive(index),
    });
  };

  useEffect(() => setJumpValue(String(active + 1)), [active]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT")) return;
      if (event.shiftKey && event.code === "KeyI") {
        event.preventDefault();
        setControlsVisible((visible) => !visible);
        return;
      }
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
          event.preventDefault();
          go(active + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          event.preventDefault();
          go(active - 1);
          break;
        case "Home":
          event.preventDefault();
          go(0);
          break;
        case "End":
          event.preventDefault();
          go(total - 1);
          break;
      }
    }
    const frameWindow = frameDocumentRef.current?.defaultView ?? null;
    window.addEventListener("keydown", onKeyDown);
    frameWindow?.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      frameWindow?.removeEventListener("keydown", onKeyDown);
    };
  }, [active, total]);

  function commitJump() {
    const n = Number.parseInt(jumpValue, 10);
    if (Number.isFinite(n)) go(n - 1);
    else setJumpValue(String(active + 1));
  }

  return (
    <div className="deck-export" onContextMenu={(event) => {
      event.preventDefault();
      setControlsVisible((visible) => !visible);
    }}>
      <FixedSlideCanvas
        documentRef={frameDocumentRef}
        slide={activeSlide}
        source={source}
      />

      <nav className={`deck-controls${controlsVisible ? "" : " is-hidden"}`} aria-label="Slide navigation">
        <button type="button" aria-label="Previous slide" onClick={() => go(active - 1)} disabled={active === 0}>
          ‹
        </button>
        <span className="deck-jump">
          <input
            type="number"
            min={1}
            max={total}
            value={jumpValue}
            aria-label="Go to slide number"
            onChange={(e) => setJumpValue(e.target.value)}
            onBlur={commitJump}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitJump();
              }
            }}
          />
          / {total}
        </span>
        <select
          className="deck-select"
          aria-label="Choose slide"
          value={active}
          onChange={(e) => go(Number(e.target.value))}
        >
          {slides.map((slide, index) => (
            <option key={slide.id ?? slide.type} value={index}>
            {String(index + 1).padStart(2, "0")} — {slide.type}
            </option>
          ))}
        </select>
        <button type="button" aria-label="Next slide" onClick={() => go(active + 1)} disabled={active === total - 1}>
          ›
        </button>
      </nav>
    </div>
  );
}

// Print/PDF capture layout: every slide stacked at native 1600x900, one per page. The flattened PDF
// exporter screenshots this layout, then crops each .deck-page into a PDF page.
function PrintDeck({ source }: { source: PreviewSource }) {
  return (
    <div className="print-deck print-deck-capture">
      {source.slides.map((slide) => (
        <div className="deck-page" key={slide.id ?? slide.type}>
          <div className={source.deckClass} data-slide-id={slide.id}>
            <slide.Component {...slide.props} />
            <SlideOverrideLayer override={slide.override} />
          </div>
        </div>
      ))}
    </div>
  );
}
