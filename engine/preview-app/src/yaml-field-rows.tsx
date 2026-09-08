import { useEffect, useState } from "react";
import type { Document, Node } from "yaml";
import { recognizedSlideYamlKeys } from "./content-schema-v2";
import { addMapEntry, addSequenceItem, isYamlMap, isYamlSequence, moveSequenceItem, removeNode, renameMapKey, scalarText, setScalar, yamlNodeAt, type YamlPath } from "./yaml-document-edit";

type Props = { document: Document; path?: YamlPath; onChange: (mutate: (next: Document) => void) => void };

export function YamlFieldRows({ document, path = [], onChange }: Props) {
  const node = yamlNodeAt(document, path);
  if (!isYamlMap(node)) return null;
  // Every edit re-clones the document, so node identity is never stable across renders;
  // position is. Keying by position also keeps a row mounted while its key is renamed,
  // which is what holds keyboard focus in the key input.
  return <div className="yaml-fields">
    {node.items.map((pair, index) => {
      const key = String((pair.key as { value?: unknown } | null)?.value ?? "");
      return <YamlField document={document} key={index} node={pair.value as Node | null} onChange={onChange} path={[...path, key]} />;
    })}
    <IconButton label="Add field" onClick={() => onChange((next) => addMapEntry(next, path))} symbol="+" />
  </div>;
}

function YamlField({ document, node, onChange, path }: Required<Props> & { node: Node | null }) {
  const [error, setError] = useState<string>();
  const key = String(path[path.length - 1]);
  const locked = path.length === 1 && (key === "id" || key === "type");
  const unknown = path.length === 1 && !recognizedSlideYamlKeys.has(key);
  const label = path.join(".");
  const rename = (nextKey: string) => onChange((next) => {
    const issue = renameMapKey(next, path, nextKey);
    setError(issue);
  });
  if (isYamlMap(node)) return <fieldset className="yaml-group"><legend>{key}</legend><FieldHeader error={error} keyName={key} locked={locked} onRename={rename} path={path} unknown={unknown} onRemove={() => onChange((next) => removeNode(next, path))} /><YamlFieldRows document={document} onChange={onChange} path={path} /></fieldset>;
  if (isYamlSequence(node)) return <fieldset className="yaml-group"><legend>{key}</legend><FieldHeader error={error} keyName={key} locked={locked} onRename={rename} path={path} unknown={unknown} onRemove={() => onChange((next) => removeNode(next, path))} />
    <SequenceItems document={document} items={node.items as Node[]} onChange={onChange} path={path} />
    <IconButton label={`Add ${key} item`} onClick={() => onChange((next) => addSequenceItem(next, path))} symbol="+" />
  </fieldset>;
  return <div className="yaml-field"><FieldHeader error={error} keyName={key} locked={locked} onRename={rename} path={path} unknown={unknown} onRemove={() => onChange((next) => removeNode(next, path))} /><ValueInput label={label} locked={locked} node={node} onChange={(value) => onChange((next) => setScalar(next, path, value))} /></div>;
}

function SequenceItem({ document, index, item, onChange, path }: Required<Props> & { index: number; item: Node | null }) {
  const itemPath = [...path, index];
  const name = `${path.join(".")} item ${index + 1}`;
  const controls = <div className="sequence-controls">
    <IconButton disabled={index === 0} label={`Move ${name} up`} onClick={() => onChange((next) => moveSequenceItem(next, path, index, -1))} symbol="↑" />
    <IconButton disabled={index === (yamlNodeAt(document, path) as { items: unknown[] }).items.length - 1} label={`Move ${name} down`} onClick={() => onChange((next) => moveSequenceItem(next, path, index, 1))} symbol="↓" />
    <IconButton label={`Remove ${name}`} onClick={() => onChange((next) => removeNode(next, itemPath))} symbol="×" />
  </div>;
  if (isYamlMap(item)) return <fieldset className="yaml-sequence-item"><legend>Item {index + 1}</legend>{controls}<YamlFieldRows document={document} onChange={onChange} path={itemPath} /></fieldset>;
  if (isYamlSequence(item)) return <fieldset className="yaml-sequence-item"><legend>Item {index + 1}</legend>{controls}<SequenceItems document={document} items={item.items as Node[]} onChange={onChange} path={itemPath} /></fieldset>;
  return <div className="yaml-sequence-item"><label>Item {index + 1}</label>{controls}<ValueInput label={`${path.join(".")}[${index}]`} node={item} onChange={(value) => onChange((next) => setScalar(next, itemPath, value))} /></div>;
}

function SequenceItems({ document, items, onChange, path }: Required<Props> & { items: Node[] }) {
  return <>{items.map((item, index) => <SequenceItem document={document} index={index} item={item} key={index} onChange={onChange} path={path} />)}</>;
}

function FieldHeader({ error, keyName, locked, onRemove, onRename, path, unknown }: { error?: string; keyName: string; locked: boolean; onRemove: () => void; onRename: (key: string) => void; path: YamlPath; unknown: boolean }) {
  const id = `yaml-key-${path.join("-")}`;
  // A rejected rename leaves the document key unchanged; the draft keeps what was typed
  // on screen next to the error instead of snapping back mid-edit.
  const [draft, setDraft] = useState(keyName);
  useEffect(() => { setDraft(keyName); }, [keyName]);
  return <div className="yaml-field-header"><label className="yaml-key-label" htmlFor={id}>Key</label><input aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} className="yaml-key-input" id={id} onChange={(event) => { setDraft(event.target.value); onRename(event.target.value); }} readOnly={locked} value={draft} />{locked && <span className="editor-note">Bound to deck.json</span>}{unknown && <span className="editor-badge">Not read by renderer</span>}{!locked && <IconButton label={`Remove ${keyName}`} onClick={onRemove} symbol="×" />}{error && <span className="editor-error" id={`${id}-error`}>{error}</span>}</div>;
}

function IconButton({ disabled, label, onClick, symbol }: { disabled?: boolean; label: string; onClick: () => void; symbol: string }) {
  return <button aria-label={label} className="icon-button" disabled={disabled} onClick={onClick} title={label} type="button"><span aria-hidden="true">{symbol}</span></button>;
}

function ValueInput({ label, locked = false, node, onChange }: { label: string; locked?: boolean; node: Node | null; onChange: (value: string) => void }) {
  const value = scalarText(node);
  const props = { "aria-label": `${label} value`, onChange: (event: { target: { value: string } }) => onChange(event.target.value), readOnly: locked, value };
  return value.includes("\n") ? <textarea {...props} /> : <input {...props} />;
}
