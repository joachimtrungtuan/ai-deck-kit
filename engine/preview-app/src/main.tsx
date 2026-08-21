import { StrictMode, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { createRoot } from "react-dom/client";
// The shell's own typefaces, named literally in preview-shell.css and template-gallery.css.
// A template's typefaces are not here: they come from its manifest through virtual:aideck-deck.
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./preview-shell.css";
import "../../primitives/blocks/primitives.css";
import "./slide-transitions.css";
import { goToSlide } from "./slide-transition-runtime";
import { FixedSlideCanvas } from "./fixed-slide-canvas";
// Template styles and the gallery both come from the virtual module, which the CLI populates with
// the templates this project can actually resolve. Nothing about a template is hardcoded here.
import { runtimeDeck, runtimeGallery, runtimeTemplate } from "virtual:aideck-deck";
import { PrimitivesDemo } from "./primitives-demo";
import { TemplateGallery } from "./template-gallery";
import type { PreviewSource } from "./preview-types";

const DEFAULT_SIDEBAR_WIDTH = 280;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 480;
const COLLAPSED_SIDEBAR_WIDTH = 56;
const SIDEBAR_WIDTH_STORAGE_KEY = "aideck.preview.sidebarWidth";
const SIDEBAR_COLLAPSED_STORAGE_KEY = "aideck.preview.sidebarCollapsed";

function clampSidebarWidth(width: number): number {
  return Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, width));
}

function readSidebarWidth(): number {
  const storedValue = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
  if (!storedValue?.trim()) return DEFAULT_SIDEBAR_WIDTH;
  const storedWidth = storedValue === null ? Number.NaN : Number(storedValue);
  return Number.isFinite(storedWidth) ? clampSidebarWidth(storedWidth) : DEFAULT_SIDEBAR_WIDTH;
}

function PreviewApp({ galleryHref, source }: { galleryHref?: string; source: PreviewSource }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(readSidebarWidth);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "1",
  );

  const slides = source.slides;
  const activeSlideIndex = Math.min(activeIndex, slides.length - 1);
  const activeSlide = slides[activeSlideIndex];
  const frameDocumentRef = useRef<Document | null>(null);
  const sidebarWidthRef = useRef(sidebarWidth);
  const activeResizeCleanupRef = useRef<(() => void) | null>(null);
  const go = useCallback((next: number) => {
    const index = Math.max(0, Math.min(slides.length - 1, next));
    goToSlide({
      frameDocument: frameDocumentRef.current,
      from: slides[activeIndex],
      to: slides[index],
      direction: index >= activeIndex ? "forward" : "backward",
      source,
      commit: () => setActiveIndex(index),
    });
  }, [activeIndex, frameDocumentRef, slides, source]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "SELECT" || target.closest?.("[data-agentation-root]"))
      ) return;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
          event.preventDefault();
          go(activeIndex + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          event.preventDefault();
          go(activeIndex - 1);
          break;
        case "Home":
          event.preventDefault();
          go(0);
          break;
        case "End":
          event.preventDefault();
          go(slides.length - 1);
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
  }, [activeIndex, go]);

  const updateSidebarWidth = useCallback((width: number) => {
    const nextWidth = clampSidebarWidth(width);
    sidebarWidthRef.current = nextWidth;
    setSidebarWidth(nextWidth);
  }, []);

  const startSidebarResize = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (sidebarCollapsed) return;

    event.preventDefault();
    activeResizeCleanupRef.current?.();
    const resizeHandle = event.currentTarget;
    const pointerId = event.pointerId;
    resizeHandle.setPointerCapture(pointerId);
    const startX = event.clientX;
    const startWidth = sidebarWidthRef.current;
    let active = true;

    function onPointerMove(moveEvent: PointerEvent) {
      updateSidebarWidth(startWidth + moveEvent.clientX - startX);
    }

    function cleanup() {
      if (!active) return;
      active = false;
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidthRef.current));
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
      if (resizeHandle.hasPointerCapture(pointerId)) resizeHandle.releasePointerCapture(pointerId);
      if (activeResizeCleanupRef.current === cleanup) activeResizeCleanupRef.current = null;
    }

    activeResizeCleanupRef.current = cleanup;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", cleanup);
    window.addEventListener("pointercancel", cleanup);
  }, [sidebarCollapsed, updateSidebarWidth]);

  useEffect(() => () => activeResizeCleanupRef.current?.(), []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((collapsed) => {
      const nextCollapsed = !collapsed;
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, nextCollapsed ? "1" : "0");
      return nextCollapsed;
    });
  }, []);

  const shellStyle = {
    "--sidebar-width": `${sidebarCollapsed ? COLLAPSED_SIDEBAR_WIDTH : sidebarWidth}px`,
  } as CSSProperties;

  return (
    <main className={`preview-shell${sidebarCollapsed ? " is-collapsed" : ""}`} style={shellStyle}>
      <aside className={`preview-sidebar${sidebarCollapsed ? " is-collapsed" : ""}`}>
        <header className="preview-sidebar-header">
          <div className="preview-slide-header">
            {galleryHref && <a className="preview-back-link" href={galleryHref}>← All templates</a>}
            <p className="preview-label">Slides</p>
            <h1>{source.label}</h1>
          </div>
          <button
            aria-expanded={!sidebarCollapsed}
            aria-label={sidebarCollapsed ? "Expand slide sidebar" : "Collapse slide sidebar"}
            className="preview-sidebar-toggle"
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Enter") event.stopPropagation();
            }}
            onClick={toggleSidebar}
            type="button"
          >
            {sidebarCollapsed ? "▸" : "◂"}
          </button>
        </header>
        <nav aria-label="Slides">
          {slides.map((slide, index) => (
            <button
              className={index === activeIndex ? "is-active" : ""}
              key={slide.id ?? slide.type}
              onClick={() => go(index)}
              type="button"
            >
              <span className="preview-slide-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="preview-slide-type">{slide.type}</span>
            </button>
          ))}
        </nav>
      </aside>
      <div
        aria-label="Resize slide sidebar"
        aria-disabled={sidebarCollapsed}
        aria-orientation="vertical"
        aria-valuemax={MAX_SIDEBAR_WIDTH}
        aria-valuemin={MIN_SIDEBAR_WIDTH}
        aria-valuenow={sidebarCollapsed ? undefined : sidebarWidth}
        className={`preview-sidebar-resizer${sidebarCollapsed ? " is-disabled" : ""}`}
        onPointerDown={startSidebarResize}
        role="separator"
      />
      <section className="preview-stage" aria-label={activeSlide.type}>
        <FixedSlideCanvas documentRef={frameDocumentRef} mountAgentation slide={activeSlide} slideIndex={activeSlideIndex} source={source} />
      </section>
    </main>
  );
}

function AppRouter() {
  if (window.location.pathname === "/primitives") return <PrimitivesDemo />;
  if (runtimeDeck) return <PreviewApp source={runtimeDeck} />;

  const params = new URLSearchParams(window.location.search);
  const gallery: PreviewSource[] = runtimeGallery ?? [];
  const sources = runtimeTemplate
    ? [runtimeTemplate, ...gallery.filter((source) => source.id !== runtimeTemplate.id)]
    : gallery;
  const requestedTemplate = params.get("template");
  const showGallery = params.has("gallery") || (!runtimeTemplate && !requestedTemplate);
  if (showGallery) return <TemplateGallery sources={sources} />;

  const source = requestedTemplate
    ? sources.find((candidate) => candidate.id === requestedTemplate)
    : runtimeTemplate;
  return source
    ? <PreviewApp galleryHref="?gallery" source={source} />
    : <TemplateGallery sources={sources} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
