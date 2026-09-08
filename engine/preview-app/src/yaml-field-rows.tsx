import { useState } from "react";
import type { Document, Node } from "yaml";
import { recognizedSlideYamlKeys } from "./content-schema-v2";
import { addMapEntry, addSequenceItem, isYamlMap, isYamlSequence, moveSequenceItem, removeNode, renameMapKey, scalarText, setScalar, yamlNodeAt, type YamlPath } from "./yaml-document-edit";

type Props = { document: Document; path?: YamlPath; onChange: (mutate: (next: Document) => void) => void };

export function YamlFieldRows({ document, path = [], onChange }: Props) {
  const node = yamlNodeAt(document, path);
  if (!isYamlMap(node)) return null;
  return <div className="yaml-fields">
    {node.items.map((pair) => {
      const key = String((pair.key as { value?: unknown } | null)?.value ?? "");
      return <YamlField document={document} key={key} node={pair.value as Node | null} onChange={onChange} path={[...path, key]} />;
    })}
    <button className="editor-action" onClick={() => onChange((next) => addMapEntry(next, path))} type="button">Add field</button>
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
    <button className="editor-action" onClick={() => onChange((next) => addSequenceItem(next, path))} type="button">Add item</button>
  </fieldset>;
  return <div className="yaml-field"><FieldHeader error={error} keyName={key} locked={locked} onRename={rename} path={path} unknown={unknown} onRemove={() => onChange((next) => removeNode(next, path))} /><ValueInput label={label} node={node} onChange={(value) => onChange((next) => setScalar(next, path, value))} /></div>;
}

function SequenceItem({ document, index, item, onChange, path }: Required<Props> & { index: number; item: Node | null }) {
  const itemPath = [...path, index];
  const controls = <div className="sequence-controls"><button aria-label={`Move ${path.join(".")} item ${index + 1} up`} disabled={index === 0} onClick={() => onChange((next) => moveSequenceItem(next, path, index, -1))} type="button">↑</button><button aria-label={`Move ${path.join(".")} item ${index + 1} down`} disabled={index === (yamlNodeAt(document, path) as { items: unknown[] }).items.length - 1} onClick={() => onChange((next) => moveSequenceItem(next, path, index, 1))} type="button">↓</button><button aria-label={`Remove ${path.join(".")} item ${index + 1}`} onClick={() => onChange((next) => removeNode(next, itemPath))} type="button">Remove</button></div>;
  if (isYamlMap(item)) return <fieldset className="yaml-sequence-item"><legend>Item {index + 1}</legend>{controls}<YamlFieldRows document={document} onChange={onChange} path={itemPath} /></fieldset>;
  if (isYamlSequence(item)) return <fieldset className="yaml-sequence-item"><legend>Item {index + 1}</legend>{controls}<SequenceItems document={document} items={item.items as Node[]} onChange={onChange} path={itemPath} /></fieldset>;
  return <div className="yaml-sequence-item"><label>Item {index + 1}</label>{controls}<ValueInput label={`${path.join(".")}[${index}]`} node={item} onChange={(value) => onChange((next) => setScalar(next, itemPath, value))} /></div>;
}

function SequenceItems({ document, items, onChange, path }: Required<Props> & { items: Node[] }) {
  return <>{items.map((item, index) => <SequenceItem document={document} index={index} item={item} key={index} onChange={onChange} path={path} />)}</>;
}

function FieldHeader({ error, keyName, locked, onRemove, onRename, path, unknown }: { error?: string; keyName: string; locked: boolean; onRemove: () => void; onRename: (key: string) => void; path: YamlPath; unknown: boolean }) {
  const id = `yaml-key-${path.join("-")}`;
  return <div className="yaml-field-header"><label htmlFor={id}>Key</label><input aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} id={id} onChange={(event) => onRename(event.target.value)} readOnly={locked} value={keyName} />{locked && <span className="editor-note">Bound to deck.json</span>}{unknown && <span className="editor-badge">Not read by renderer</span>}{!locked && <button aria-label={`Remove ${keyName}`} onClick={onRemove} type="button">Remove</button>}{error && <span className="editor-error" id={`${id}-error`}>{error}</span>}</div>;
}

function ValueInput({ label, node, onChange }: { label: string; node: Node | null; onChange: (value: string) => void }) {
  const value = scalarText(node);
  return value.includes("\n") ? <textarea aria-label={`${label} value`} onChange={(event) => onChange(event.target.value)} value={value} /> : <input aria-label={`${label} value`} onChange={(event) => onChange(event.target.value)} value={value} />;
}
