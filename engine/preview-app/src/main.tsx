import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./preview-shell.css";
import "../../templates/swiss-modern/design-system.css";
import "../../templates/swiss-modern/animation-presets.css";
import "../../templates/linear-dark/design-system.css";
import "../../templates/linear-dark/animation-presets.css";
import { SOURCES } from "./deck-registry";

function getDefaultSourceId() {
  if (typeof window !== "undefined" && window.location.pathname.includes("/vivimoon-website.deck/.build/export/")) {
    return "vivimoon-website";
  }

  return SOURCES[0].id;
}

function PreviewApp() {
  const [sourceId, setSourceId] = useState(getDefaultSourceId);
  const [activeIndex, setActiveIndex] = useState(0);

  const source = useMemo(() => SOURCES.find((s) => s.id === sourceId) ?? SOURCES[0], [sourceId]);
  const slides = source.slides;
  const activeSlide = slides[Math.min(activeIndex, slides.length - 1)];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setActiveIndex((index) => Math.min(index + 1, slides.length - 1));
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((index) => Math.max(index - 1, 0));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [slides.length]);

  return (
    <main className="preview-shell">
      <aside className="preview-sidebar">
        <div className="preview-source-switch">
          <label className="preview-label" htmlFor="source-select">Preview source</label>
          <select
            id="source-select"
            value={sourceId}
            onChange={(event) => {
              setSourceId(event.target.value);
              setActiveIndex(0);
            }}
          >
            {SOURCES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <h1>Template Preview</h1>
        <nav aria-label="Slides">
          {slides.map((slide, index) => (
            <button
              className={index === activeIndex ? "is-active" : ""}
              key={slide.type}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {slide.type}
            </button>
          ))}
        </nav>
      </aside>
      <section className="preview-stage" aria-label={activeSlide.type}>
        <div className={`preview-deck ${source.deckClass}`}>
          <activeSlide.Component {...activeSlide.props} />
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PreviewApp />
  </StrictMode>,
);
