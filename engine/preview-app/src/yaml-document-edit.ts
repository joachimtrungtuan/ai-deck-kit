import { isMap, isScalar, isSeq, parseDocument } from "yaml";
import type { Document, Node, YAMLMap, YAMLSeq } from "yaml";

export type YamlPath = Array<string | number>;

export function parseYamlDocument(source: string): Document {
  return parseDocument(source);
}

export function yamlNodeAt(document: Document, path: YamlPath): Node | null {
  return document.getIn(path, true) as Node | null;
}

export function scalarText(node: Node | null): string {
  return isScalar(node) ? String(node.value ?? "") : "";
}

/**
 * Writes typed text into an existing scalar by mutating it in place, so the node's
 * quote style and trailing comment survive the edit. The text is never re-parsed as
 * YAML: typing `#1 in market` or `007` stores that exact string, and the serializer
 * quotes it when a plain form would read back as something else. A scalar that was a
 * number or boolean keeps that type while the text still parses as one, so editing a
 * numeric field does not silently turn it into a string.
 */
export function setScalar(document: Document, path: YamlPath, value: string): void {
  const node = yamlNodeAt(document, path);
  if (!isScalar(node)) {
    document.setIn(path, value);
    return;
  }
  node.value = retypedValue(node.value, value);
}

export function renameMapKey(document: Document, path: YamlPath, nextKey: string): string | undefined {
  const key = nextKey.trim();
  if (!key) return "A key is required.";
  const parent = yamlNodeAt(document, path.slice(0, -1));
  if (!isMap(parent)) return "This field cannot be renamed.";
  const current = String(path[path.length - 1]);
  if (key !== current && parent.items.some((pair) => nodeKey(pair.key) === key)) return `"${key}" already exists here.`;
  const pair = parent.items.find((entry) => nodeKey(entry.key) === current);
  if (!pair) return "This field no longer exists.";
  if (isScalar(pair.key)) pair.key.value = key;
  else pair.key = document.createNode(key);
}

export function removeNode(document: Document, path: YamlPath): void {
  const parent = yamlNodeAt(document, path.slice(0, -1));
  const key = path[path.length - 1];
  if (isSeq(parent) && typeof key === "number") parent.delete(key);
  else if (isMap(parent) && typeof key === "string") parent.delete(key);
}

export function addMapEntry(document: Document, path: YamlPath): void {
  const map = yamlNodeAt(document, path);
  if (!isMap(map)) return;
  let key = "newKey";
  let suffix = 2;
  while (map.items.some((pair) => nodeKey(pair.key) === key)) key = `newKey${suffix++}`;
  map.add({ key, value: "" });
}

export function addSequenceItem(document: Document, path: YamlPath): void {
  const sequence = yamlNodeAt(document, path);
  if (isSeq(sequence)) sequence.add("");
}

export function moveSequenceItem(document: Document, path: YamlPath, from: number, direction: -1 | 1): void {
  const sequence = yamlNodeAt(document, path);
  const to = from + direction;
  if (!isSeq(sequence) || to < 0 || to >= sequence.items.length) return;
  const [item] = sequence.items.splice(from, 1);
  sequence.items.splice(to, 0, item);
}

export function isYamlMap(node: Node | null): node is YAMLMap {
  return isMap(node);
}

export function isYamlSequence(node: Node | null): node is YAMLSeq {
  return isSeq(node);
}

function retypedValue(previous: unknown, value: string): unknown {
  if (typeof previous === "number" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  if (typeof previous === "boolean" && (value === "true" || value === "false")) return value === "true";
  if (previous === null && value === "") return null;
  return value;
}

function nodeKey(node: unknown): string {
  return String((node as { value?: unknown } | null)?.value ?? "");
}
