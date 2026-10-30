/** The audience slide's number, title and progress through the deck, sized to read at a glance. */
export function SlidePositionCaption({ index, label, title, total }: {
  index: number;
  label?: string;
  title: string;
  total: number;
}) {
  return <figcaption className="present-position">
    <span className="present-position-count">Slide {index + 1} <small>/ {total}</small></span>
    <span className="present-position-title" title={title}>{title}</span>
    {label && <span className="present-position-badge">{label}</span>}
    <progress aria-label="Progress through the deck" className="present-position-progress" max={total} value={index + 1} />
  </figcaption>;
}
