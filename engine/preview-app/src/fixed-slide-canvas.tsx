import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PreviewSlide, PreviewSource } from "./preview-types";
import "./fixed-slide-canvas.css";

const SLIDE_WIDTH = 1600;
const SLIDE_HEIGHT = 900;

type DocumentRef = { current: Document | null };

export function FixedSlideCanvas({
  documentRef,
  slide,
  source,
}: {
  documentRef?: DocumentRef;
  slide: PreviewSlide;
  source: PreviewSource;
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
    doc.documentElement.style.background = "#000";
    doc.body.style.margin = "0";
    doc.body.style.background = "#000";
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
            key={slide.id ?? slide.type}
            style={{ viewTransitionName: slide.morphAnchors?.[0] }}
          >
            <slide.Component {...slide.props} />
          </div>,
          frameBody,
        )}
    </div>
  );
}
