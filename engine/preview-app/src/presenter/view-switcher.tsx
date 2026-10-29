export type PresenterViewKind = "presenter" | "editor" | "slide";

const LABELS: Record<PresenterViewKind, string> = { presenter: "Presenter", editor: "Editor", slide: "Slide" };

/** Switches this window between views; the channel and audience window survive the switch. */
export function ViewSwitcher({ editorDisabledReason, onChange, view }: { editorDisabledReason?: string; onChange: (view: PresenterViewKind) => void; view: PresenterViewKind }) {
  return <nav aria-label="View" className="present-switcher">
    {(Object.keys(LABELS) as PresenterViewKind[]).map((kind) => {
      const disabled = kind === "editor" && Boolean(editorDisabledReason);
      return <button aria-pressed={view === kind} disabled={disabled} key={kind} onClick={() => onChange(kind)} title={disabled ? editorDisabledReason : undefined} type="button">{LABELS[kind]}</button>;
    })}
  </nav>;
}
