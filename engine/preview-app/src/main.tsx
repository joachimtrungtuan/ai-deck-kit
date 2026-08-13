import { StrictMode, useCallback, useEffect, useRef, useState } from "react";
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

function PreviewApp({ galleryHref, source }: { galleryHref?: string; source: PreviewSource }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = source.slides;
  const activeSlideIndex = Math.min(activeIndex, slides.length - 1);
  const activeSlide = slides[activeSlideIndex];
  const frameDocumentRef = useRef<Document | null>(null);
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
      if (event.key === "ArrowRight") {
        go(activeIndex + 1);
      }
      if (event.key === "ArrowLeft") {
        go(activeIndex - 1);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, go]);

  return (
    <main className="preview-shell">
      <aside className="preview-sidebar">
        {galleryHref && <a className="preview-back-link" href={galleryHref}>← All templates</a>}
        <header className="preview-slide-header">
          <p className="preview-label">Slides</p>
          <h1>{source.label}</h1>
        </header>
        <nav aria-label="Slides">
          {slides.map((slide, index) => (
            <button
              className={index === activeIndex ? "is-active" : ""}
              key={slide.id ?? slide.type}
              onClick={() => go(index)}
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {slide.type}
            </button>
          ))}
        </nav>
      </aside>
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
