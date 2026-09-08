import { StrictMode, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createRoot } from "react-dom/client";
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
import { runtimeDeck, runtimeGallery, runtimeTemplate } from "virtual:aideck-deck";
import { PrimitivesDemo } from "./primitives-demo";
import { TemplateGallery } from "./template-gallery";
import type { PreviewSource } from "./preview-types";
import { readActiveSlideIndex, rememberActiveSlide } from "./active-slide-memory";
import { PanelResizer } from "./panel-resizer";
import { SlideListSidebar } from "./slide-list-sidebar";
import { usePanelResize } from "./use-panel-resize";
import { SlideFieldEditor } from "./slide-field-editor";

const PANEL_MIN_WIDTH = 200;
const PANEL_MAX_WIDTH = 480;
const SIDEBAR_DEFAULT_WIDTH = 280;
const COLLAPSED_SIDEBAR_WIDTH = 56;

function PreviewApp({ deckMode = false, galleryHref, source }: { deckMode?: boolean; galleryHref?: string; source: PreviewSource }) {
  const [activeIndex, setActiveIndex] = useState(() => deckMode ? readActiveSlideIndex(source) : 0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("aideck.preview.sidebarCollapsed") === "1");
  const [editorCollapsed, setEditorCollapsed] = useState(() => localStorage.getItem("aideck.preview.editorCollapsed") === "1");
  const [editorDirty, setEditorDirty] = useState(false);
  const sidebar = usePanelResize({ defaultWidth: SIDEBAR_DEFAULT_WIDTH, direction: "left", maxWidth: PANEL_MAX_WIDTH, minWidth: PANEL_MIN_WIDTH, widthStorageKey: "aideck.preview.sidebarWidth" });
  const editor = usePanelResize({ defaultWidth: SIDEBAR_DEFAULT_WIDTH, direction: "right", maxWidth: PANEL_MAX_WIDTH, minWidth: PANEL_MIN_WIDTH, widthStorageKey: "aideck.preview.editorWidth" });
  const slides = source.slides;
  const activeSlideIndex = Math.min(activeIndex, slides.length - 1);
  const activeSlide = slides[activeSlideIndex];
  const frameDocumentRef = useRef<Document | null>(null);

  const go = useCallback((next: number) => {
    const index = Math.max(0, Math.min(slides.length - 1, next));
    if (index !== activeSlideIndex && editorDirty && !window.confirm("Discard unsaved slide edits?")) return;
    goToSlide({ frameDocument: frameDocumentRef.current, from: slides[activeSlideIndex], to: slides[index], direction: index >= activeSlideIndex ? "forward" : "backward", source, commit: () => setActiveIndex(index) });
  }, [activeSlideIndex, editorDirty, slides, source]);

  useEffect(() => {
    if (deckMode) rememberActiveSlide(source, activeSlideIndex);
  }, [activeSlideIndex, deckMode, source]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA" || target.closest?.("[data-agentation-root]"))) return;
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) { event.preventDefault(); go(activeIndex + 1); }
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) { event.preventDefault(); go(activeIndex - 1); }
      else if (event.key === "Home") { event.preventDefault(); go(0); }
      else if (event.key === "End") { event.preventDefault(); go(slides.length - 1); }
    };
    const frameWindow = frameDocumentRef.current?.defaultView ?? null;
    window.addEventListener("keydown", onKeyDown);
    frameWindow?.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); frameWindow?.removeEventListener("keydown", onKeyDown); };
  }, [activeIndex, go, slides.length]);

  const togglePanel = (key: string, setCollapsed: (value: boolean | ((current: boolean) => boolean)) => void) => {
    setCollapsed((collapsed) => {
      const next = !collapsed;
      localStorage.setItem(key, next ? "1" : "0");
      return next;
    });
  };
  const shellStyle = { "--sidebar-width": `${sidebarCollapsed ? COLLAPSED_SIDEBAR_WIDTH : sidebar.width}px`, "--editor-width": `${editorCollapsed ? 0 : editor.width}px` } as CSSProperties;

  return <main className={`preview-shell${deckMode ? " has-editor" : ""}`} style={shellStyle}>
    <SlideListSidebar activeIndex={activeIndex} collapsed={sidebarCollapsed} galleryHref={galleryHref} onSelect={go} source={source} />
    <PanelResizer collapsed={sidebarCollapsed} maxWidth={PANEL_MAX_WIDTH} minWidth={PANEL_MIN_WIDTH} onPointerDown={sidebar.startResize} onToggle={() => togglePanel("aideck.preview.sidebarCollapsed", setSidebarCollapsed)} side="left" width={sidebar.width} />
    <section className="preview-stage" aria-label={activeSlide.type}><FixedSlideCanvas documentRef={frameDocumentRef} mountAgentation slide={activeSlide} slideIndex={activeSlideIndex} source={source} /></section>
    {deckMode && <>
      <PanelResizer collapsed={editorCollapsed} maxWidth={PANEL_MAX_WIDTH} minWidth={PANEL_MIN_WIDTH} onPointerDown={editor.startResize} onToggle={() => togglePanel("aideck.preview.editorCollapsed", setEditorCollapsed)} side="right" width={editor.width} />
      <aside aria-label="Slide editor" className={`preview-editor${editorCollapsed ? " is-collapsed" : ""}`}><SlideFieldEditor onDirtyChange={setEditorDirty} slideId={activeSlide.id} source={source} /></aside>
    </>}
  </main>;
}

function AppRouter() {
  if (window.location.pathname === "/primitives") return <PrimitivesDemo />;
  if (runtimeDeck) return <PreviewApp deckMode source={runtimeDeck} />;
  const params = new URLSearchParams(window.location.search);
  const gallery: PreviewSource[] = runtimeGallery ?? [];
  const sources = runtimeTemplate ? [runtimeTemplate, ...gallery.filter((source) => source.id !== runtimeTemplate.id)] : gallery;
  const requestedTemplate = params.get("template");
  if (params.has("gallery") || (!runtimeTemplate && !requestedTemplate)) return <TemplateGallery sources={sources} />;
  const source = requestedTemplate ? sources.find((candidate) => candidate.id === requestedTemplate) : runtimeTemplate;
  return source ? <PreviewApp galleryHref="?gallery" source={source} /> : <TemplateGallery sources={sources} />;
}

createRoot(document.getElementById("root")!).render(<StrictMode><AppRouter /></StrictMode>);
