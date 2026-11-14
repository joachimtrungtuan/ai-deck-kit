import { useEffect, useMemo, useRef, useState } from "react";
import { resolveSlideAssets } from "./deck-asset-resolver";
import { goToSlide } from "./slide-transition-runtime";
import { FixedSlideCanvas } from "./fixed-slide-canvas";
import { SlideGate } from "./export-slide-gate";
import { exportAssetTable, useExportAssetLoader } from "./use-export-asset-loader";
import type { PreviewSource } from "./preview-types";
import { SlideOverrideLayer } from "./slide-override-layer";
import { useExportBridge } from "./presenter/use-export-bridge";

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
  if (!source.slides.length && !isPrint) return <div className="deck-export-empty" role="status">No slides to present.</div>;
  return isPrint ? <PrintDeck source={source} /> : <ScreenDeck source={source} />;
}

// Interactive, fixed-canvas view: one iframe-isolated slide, zoomed to fit, with nav controls.
function ScreenDeck({ source }: { source: PreviewSource }) {
  const slides = source.slides;
  const total = slides.length;
  const [active, setActive] = useState(0);
  const activeSlide = slides[active];
  const [jumpValue, setJumpValue] = useState("1");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerActive, setPickerActive] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const typeaheadRef = useRef("");
  const typeaheadTimer = useRef<number | null>(null);
  // Embedded in the presenter's mirror frame, the on-slide controls would only be noise.
  const [controlsVisible, setControlsVisible] = useState(() => window.parent === window);
  const frameDocumentRef = useRef<Document | null>(null);
  const loader = useExportAssetLoader(source, "startup");
  const slideReady = loader.isSlideReady(active);

  const go = (next: number) => {
    const index = Math.max(0, Math.min(total - 1, next));
    loader.prioritise(index);
    // A slide still loading is gated instead of animated into: there is nothing to transition to yet.
    if (!loader.isSlideReady(index)) {
      setActive(index);
      return;
    }
    goToSlide({
      frameDocument: frameDocumentRef.current,
      from: slides[active],
      to: slides[index],
      direction: index >= active ? "forward" : "backward",
      source,
      commit: () => setActive(index),
    });
  };

  useEffect(() => setActive((current) => Math.max(0, Math.min(current, total - 1))), [total]);
  useEffect(() => { if (pickerOpen) { setPickerActive(active); optionRefs.current[active]?.focus(); } }, [pickerOpen]);
  useEffect(() => { if (pickerOpen) optionRefs.current[pickerActive]?.focus(); }, [pickerActive, pickerOpen]);
  useEffect(() => {
    if (!pickerOpen) return;
    const close = (event: Event) => {
      const target = event.target as Node | null;
      if (!target || !pickerRef.current?.contains(target)) setPickerOpen(false);
    };
    const frameDocument = frameDocumentRef.current;
    document.addEventListener("pointerdown", close);
    document.addEventListener("focusin", close);
    frameDocument?.addEventListener("pointerdown", close);
    frameDocument?.addEventListener("focusin", close);
    window.addEventListener("blur", () => setPickerOpen(false), { once: true });
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("focusin", close);
      frameDocument?.removeEventListener("pointerdown", close);
      frameDocument?.removeEventListener("focusin", close);
    };
  }, [pickerOpen]);

  useEffect(() => setJumpValue(String(active + 1)), [active]);

  const summaries = useMemo(() => slides.map((slide, index) => ({ id: slide.id ?? String(index), tocTitle: slide.tocTitle, type: slide.type })), [slides]);
  useExportBridge(summaries, active, go);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.closest?.(".deck-picker"))) return;
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

  function closePicker(focusTrigger = true) {
    setPickerOpen(false);
    if (focusTrigger) requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function commitPicker(index: number) {
    closePicker();
    go(index);
  }

  const slideLabel = (slide: typeof activeSlide, index: number) => `${String(index + 1).padStart(2, "0")} — ${slide.tocTitle ? `${slide.tocTitle} · ${slide.type}` : slide.type}`;

  return (
    <div className="deck-export" onContextMenu={(event) => {
      event.preventDefault();
      setControlsVisible((visible) => !visible);
    }}>
      <FixedSlideCanvas
        documentRef={frameDocumentRef}
        hold={!slideReady}
        slide={activeSlide}
        source={source}
        assetTable={exportAssetTable()}
      />
      {!slideReady && <SlideGate key={active} slideNumber={active + 1} failures={loader.failurePaths(active)} {...loader.slideProgress(active)} />}

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
        <div className="deck-picker" ref={pickerRef}>
          <button id="deck-picker-trigger" ref={triggerRef} type="button" className="deck-select" aria-label="Choose slide" aria-haspopup="listbox" aria-expanded={pickerOpen} aria-controls="deck-picker-options" onClick={() => { setPickerActive(active); setPickerOpen((open) => !open); }} onKeyDown={(event) => { if (["Enter", " ", "ArrowDown"].includes(event.key)) { event.preventDefault(); setPickerActive(active); setPickerOpen(true); } }}>
            {slideLabel(activeSlide, active)}
          </button>
          {pickerOpen && <div id="deck-picker-options" className="deck-picker-menu" role="listbox" aria-labelledby="deck-picker-trigger" aria-activedescendant={`deck-picker-option-${pickerActive}`} onKeyDown={(event) => {
            if (event.key === "Escape") { event.preventDefault(); closePicker(); return; }
            if (event.key === "Tab") { setPickerOpen(false); return; }
            if (["ArrowDown", "ArrowRight"].includes(event.key)) { event.preventDefault(); setPickerActive((index) => (index + 1) % total); return; }
            if (["ArrowUp", "ArrowLeft"].includes(event.key)) { event.preventDefault(); setPickerActive((index) => (index - 1 + total) % total); return; }
            if (event.key === "Home" || event.key === "End") { event.preventDefault(); setPickerActive(event.key === "Home" ? 0 : total - 1); return; }
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); commitPicker(pickerActive); return; }
            if (event.key.length === 1 && /\S/.test(event.key)) {
              typeaheadRef.current += event.key.toLowerCase();
              if (typeaheadTimer.current) window.clearTimeout(typeaheadTimer.current);
              typeaheadTimer.current = window.setTimeout(() => { typeaheadRef.current = ""; }, 700);
              const match = slides.findIndex((slide, index) => slideLabel(slide, index).toLowerCase().includes(typeaheadRef.current));
              if (match >= 0) setPickerActive(match);
            }
          }}>
            {slides.map((slide, index) => <button id={`deck-picker-option-${index}`} ref={(element) => { optionRefs.current[index] = element; }} key={`${slide.id ?? slide.type}-${index}`} type="button" role="option" tabIndex={index === pickerActive ? 0 : -1} aria-selected={index === pickerActive} className="deck-picker-option" onClick={() => commitPicker(index)}>{slideLabel(slide, index)}</button>)}
          </div>}
        </div>
        <button type="button" aria-label="Next slide" onClick={() => go(active + 1)} disabled={active === total - 1}>
          ›
        </button>
      </nav>
    </div>
  );
}

// Print/PDF capture layout: every slide stacked at native 1600x900, one per page. The flattened PDF
// exporter screenshots this layout, then crops each .deck-page into a PDF page.
// The pages exist at once so the exporter can count them; their slides mount only after every image
// has loaded, so the capture never catches a half-loaded deck.
function PrintDeck({ source }: { source: PreviewSource }) {
  const loader = useExportAssetLoader(source, "all");
  const ready = loader.isAllReady();
  return (
    <div className="print-deck print-deck-capture">
      {source.slides.map((slide) => (
        <div className="deck-page" key={slide.id ?? slide.type}>
          {ready && (
            <div className={source.deckClass} data-slide-id={slide.id}>
              <slide.Component {...resolveSlideAssets(slide.props, exportAssetTable())} />
              <SlideOverrideLayer override={resolveSlideAssets(slide.override, exportAssetTable())} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
