import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PreviewSource } from "./deck-registry";

const SLIDE_W = 1600;
const SLIDE_H = 900;

// Shared preview/export runtime.
// Screen mode: one active slide inside a fixed 1600x900 iframe, scaled to fit the viewport.
// Print mode (?print): all slides stacked as 1600x900 .deck-page blocks for flattened PDF capture.
export function DeckExport({ source }: { source: PreviewSource }) {
  const isPrint =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("print");
  return isPrint ? <PrintDeck source={source} /> : <ScreenDeck source={source} />;
}

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

  useLayoutEffect(() => {
    function fit() {
      setScale(Math.min(window.innerWidth / SLIDE_W, window.innerHeight / SLIDE_H));
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

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
