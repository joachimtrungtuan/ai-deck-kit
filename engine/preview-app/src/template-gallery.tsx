import type { PreviewSource } from "./preview-types";
import "./template-gallery.css";

export function TemplateGallery({ sources }: { sources: PreviewSource[] }) {
  return (
    <main className="template-gallery">
      <header className="template-gallery-header">
        <p>AI Deck Kit</p>
        <h1>Templates</h1>
        <span>Choose a template to review its complete slide catalogue.</span>
      </header>
      <section className="template-gallery-grid" aria-label="Templates">
        {sources.map((source, index) => (
          <a
            className="template-gallery-card"
            data-template={source.id}
            href={`?template=${encodeURIComponent(source.id)}`}
            key={source.id}
          >
            <div className="template-gallery-card-visual" aria-hidden="true">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{source.label}</strong>
            </div>
            <div className="template-gallery-card-details">
              <div>
                <h2>{source.label}</h2>
                <p>{source.slides.length} layouts</p>
              </div>
              <span>Open template →</span>
            </div>
          </a>
        ))}
      </section>
    </main>
  );
}
