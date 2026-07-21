import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PreviewSource } from "./deck-registry";

const SLIDE_W = 1600;
const SLIDE_H = 900;

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
  const [scale, setScale] = useState(1);
  const [jumpValue, setJumpValue] = useState("1");
  const [frameBody, setFrameBody] = useState<HTMLElement | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const go = (next: number) => setActive(Math.max(0, Math.min(total - 1, next)));

  useEffect(() => setJumpValue(String(active + 1)), [active]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT")) return;
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
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, total]);

  // Uniformly zoom the fixed canvas to fit the window (letterboxed), preserving aspect.
  useLayoutEffect(() => {
    function fit() {
      setScale(Math.min(window.innerWidth / SLIDE_W, window.innerHeight / SLIDE_H));
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Copy the bundled styles + @font-face rules into the iframe so the slide renders identically.
  // Driven by an effect (not just onLoad) because a src-less iframe's about:blank `load` event
  // can fire before React attaches the handler, leaving the deck blank.
  function initFrame() {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    doc.head.querySelectorAll("[data-deck-style]").forEach((n) => n.remove());
    document.head.querySelectorAll("style, link[rel='stylesheet']").forEach((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.setAttribute("data-deck-style", "");
      doc.head.appendChild(clone);
    });
    doc.documentElement.style.background = "#000";
    doc.body.style.margin = "0";
    doc.body.style.background = "#000";
    setFrameBody(doc.body);
  }

  useLayoutEffect(() => {
    initFrame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function commitJump() {
    const n = Number.parseInt(jumpValue, 10);
    if (Number.isFinite(n)) go(n - 1);
    else setJumpValue(String(active + 1));
  }

  return (
    <div className="deck-export">
      <iframe
        ref={frameRef}
        className="deck-frame"
        title={source.label}
        onLoad={initFrame}
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      />
      {frameBody &&
        createPortal(
          // key={active} remounts the slide on navigation so its entrance animation replays.
          <div className={source.deckClass} key={active}>
            {(() => {
              const slide = slides[active];
              return <slide.Component {...slide.props} />;
            })()}
          </div>,
          frameBody,
        )}

      <nav className="deck-controls" aria-label="Slide navigation">
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
            <option key={slide.type} value={index}>
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
    <div className="print-deck">
      {source.slides.map((slide) => (
        <div className="deck-page" key={slide.type}>
          <div className={source.deckClass}>
            <slide.Component {...slide.props} />
          </div>
        </div>
      ))}
    </div>
  );
}
