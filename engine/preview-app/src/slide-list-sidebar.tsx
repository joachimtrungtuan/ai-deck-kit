import type { PreviewSource } from "./preview-types";

export function SlideListSidebar({ activeIndex, collapsed, galleryHref, onSelect, source }: {
  activeIndex: number;
  collapsed: boolean;
  galleryHref?: string;
  onSelect: (index: number) => void;
  source: PreviewSource;
}) {
  return (
    <aside className={`preview-sidebar${collapsed ? " is-collapsed" : ""}`}>
      <header className="preview-sidebar-header">
        <div className="preview-slide-header">
          {galleryHref && <a className="preview-back-link" href={galleryHref}>← All templates</a>}
          <p className="preview-label">Slides</p>
          <h1>{source.label}</h1>
        </div>
      </header>
      <nav aria-label="Slides">
        {source.slides.map((slide, index) => (
          <button className={index === activeIndex ? "is-active" : ""} key={slide.id ?? slide.type} onClick={() => onSelect(index)} type="button">
            <span className="preview-slide-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="preview-slide-type">
              {slide.tocTitle ? <><span className="preview-slide-toc-title">{slide.tocTitle}</span><small className="preview-slide-type-secondary">{slide.type}</small></> : slide.type}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
