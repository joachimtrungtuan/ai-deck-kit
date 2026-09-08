import { useEffect, useState } from "react";
import type { PreviewSource } from "./preview-types";
import { parseYamlDocument, serializeYamlDocument } from "./yaml-document-edit";
import { YamlFieldRows } from "./yaml-field-rows";
import "./slide-field-editor.css";

type Props = { onDirtyChange: (dirty: boolean) => void; slideId?: string; source: PreviewSource };
type LoadState = "idle" | "loading" | "saving" | "error";

export function SlideFieldEditor({ onDirtyChange, slideId, source }: Props) {
  const [document, setDocument] = useState(() => parseYamlDocument(""));
  const [revision, setRevision] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<LoadState>("idle");
  const [dirty, setDirty] = useState(false);
  const unsupported = source.contentSchemaMajor === 1;

  useEffect(() => {
    if (unsupported || !slideId) return;
    let active = true;
    setState("loading");
    setDocument(parseYamlDocument(""));
    setRevision("");
    setDirty(false);
    onDirtyChange(false);
    fetch(`/__aideck/slide-yaml?slideId=${encodeURIComponent(slideId)}`)
      .then(async (response) => ({ body: await response.json() as { error?: string; revision?: string; yaml?: string }, ok: response.ok }))
      .then(({ body, ok }) => {
        if (!active) return;
        if (!ok || !body.yaml || !body.revision) throw new Error(body.error ?? "Could not load this slide.");
        const next = parseYamlDocument(body.yaml);
        if (next.errors.length) throw new Error("The slide YAML is invalid.");
        setDocument(next); setRevision(body.revision); setMessage(""); setState("idle");
      })
      .catch((error: unknown) => { if (active) { setDocument(parseYamlDocument("")); setMessage(error instanceof Error ? error.message : "Could not load this slide."); setState("error"); } });
    return () => { active = false; };
  }, [onDirtyChange, slideId, unsupported]);

  const update = (mutate: (next: typeof document) => void) => {
    const next = document.clone();
    mutate(next);
    setDocument(next); setDirty(true); onDirtyChange(true); setMessage("Unsaved changes");
  };

  const save = async () => {
    if (!slideId || !dirty) return;
    try {
      setState("saving");
      const response = await fetch("/__aideck/slide-yaml", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slideId, yaml: serializeYamlDocument(document), revision }) });
      const body = await response.json() as { error?: string; revision?: string };
      if (response.status === 409) { setMessage("This file changed outside the preview. Reload and discard before saving."); setState("error"); return; }
      if (!response.ok || !body.revision) { setMessage(body.error ?? "Could not save this slide."); setState("error"); return; }
      setRevision(body.revision); setDirty(false); onDirtyChange(false); setMessage("Saved. Reloading preview…"); setState("idle");
    } catch { setMessage("Could not save this slide."); setState("error"); }
  };

  if (unsupported) return <div className="slide-field-editor"><h2>Slide editor</h2><p>This v1 deck is not YAML-complete. Migrate it before editing fields here.</p></div>;
  // The rows stay mounted whenever a document is loaded, including after a rejected save,
  // so the edits that failed to save are still on screen to retry or correct. The footer
  // is the single place errors are announced.
  const editable = state !== "loading" && document.contents !== null;
  return <div className="slide-field-editor"><header><p className="preview-label">Slide editor</p><h2>{slideId ?? "No slide"}</h2></header>{editable ? <YamlFieldRows document={document} onChange={update} /> : <p>{state === "loading" ? "Loading fields…" : "No fields to edit."}</p>}
    <footer><p aria-live="polite">{message}</p>{state === "error" && message.includes("Reload and discard") && <button onClick={() => window.location.reload()} type="button">Reload and discard</button>}<button disabled={!dirty || state === "saving"} onClick={() => void save()} type="button">{state === "saving" ? "Saving…" : "Save"}</button></footer>
  </div>;
}
