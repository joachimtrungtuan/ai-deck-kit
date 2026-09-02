#!/usr/bin/env node
// Validate a diagram IR file against engine/primitives/diagrams/diagram-ir-v1.schema.json.
// Two layers:
//   1. validateAgainstSchema() — a small structural checker for the JSON Schema subset the
//      v1 schema actually uses (type/properties/required/additionalProperties/items/enum/const/
//      pattern/min-max lengths and values/minItems/maxItems/local $ref). No dependencies; the
//      subset is closed on purpose — extending the schema keywords means extending this file.
//   2. validateDiagramSemantics() — cross-reference rules a JSON Schema cannot express
//      (unique ids, edge endpoints resolve, group members resolve, grid bounds, one node per cell).
// Usage: node validate-diagram-ir.mjs <ir-file> [<ir-file> ...]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const DIAGRAM_IR_SCHEMA_PATH = path.resolve(
  scriptDir,
  "../../../primitives/diagrams/diagram-ir-v1.schema.json",
);

export function validateDiagramIr(ir, schema = loadDiagramIrSchema()) {
  const errors = validateAgainstSchema(ir, schema, "$");
  errors.push(...validateDiagramSemantics(ir));
  return errors;
}

export function loadDiagramIrSchema() {
  return JSON.parse(fs.readFileSync(DIAGRAM_IR_SCHEMA_PATH, "utf8"));
}

export function validateDiagramSemantics(ir) {
  const errors = [];
  if (!ir || typeof ir !== "object" || Array.isArray(ir)) return errors;
  const seenIds = new Set();
  const claimId = (id, where) => {
    if (typeof id !== "string") return;
    if (seenIds.has(id)) errors.push(`${where}: duplicate id "${id}".`);
    seenIds.add(id);
  };
  const nodes = Array.isArray(ir.nodes) ? ir.nodes : [];
  for (const [i, node] of nodes.entries()) claimId(node?.id, `nodes[${i}]`);
  for (const [i, edge] of (Array.isArray(ir.edges) ? ir.edges : []).entries()) {
    if (edge?.id !== undefined) claimId(edge.id, `edges[${i}]`);
  }
  for (const [i, group] of (Array.isArray(ir.groups) ? ir.groups : []).entries()) {
    claimId(group?.id, `groups[${i}]`);
  }

  const nodeIds = new Set(nodes.map((node) => node?.id).filter((id) => typeof id === "string"));
  for (const [i, edge] of (Array.isArray(ir.edges) ? ir.edges : []).entries()) {
    for (const side of ["from", "to"]) {
      if (edge?.[side] !== undefined && !nodeIds.has(edge[side])) {
        errors.push(`edges[${i}]: ${side} "${edge[side]}" does not name a node.`);
      }
    }
    if (edge?.from !== undefined && edge.from === edge.to) {
      errors.push(`edges[${i}]: self-edge from "${edge.from}" to itself.`);
    }
  }
  for (const [i, group] of (Array.isArray(ir.groups) ? ir.groups : []).entries()) {
    for (const [j, ref] of (Array.isArray(group?.wraps) ? group.wraps : []).entries()) {
      if (!nodeIds.has(ref)) errors.push(`groups[${i}].wraps[${j}]: "${ref}" does not name a node.`);
    }
  }

  const cols = Number.isInteger(ir?.layout?.cols) ? ir.layout.cols : 6;
  const occupied = new Map();
  for (const [i, node] of nodes.entries()) {
    if (!Number.isInteger(node?.col) || !Number.isInteger(node?.row)) continue;
    if (node.col >= cols) {
      errors.push(`nodes[${i}]: col ${node.col} exceeds layout.cols ${cols}.`);
    }
    const cell = `${node.col},${node.row}`;
    if (occupied.has(cell)) {
      errors.push(`nodes[${i}]: cell (${node.col}, ${node.row}) already occupied by "${occupied.get(cell)}".`);
    } else {
      occupied.set(cell, node.id);
    }
  }
  return errors;
}

const SUPPORTED_TYPES = new Set(["object", "array", "string", "integer", "number", "boolean"]);

function validateAgainstSchema(value, schema, where, root = schema) {
  const errors = [];
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, root);
    if (!resolved) return [`${where}: schema $ref "${schema.$ref}" does not resolve.`];
    return validateAgainstSchema(value, resolved, where, root);
  }
  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${where}: expected the constant ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}.`);
    return errors;
  }
  if (schema.enum) {
    if (!schema.enum.includes(value)) {
      errors.push(`${where}: "${String(value)}" is not one of ${schema.enum.map((v) => JSON.stringify(v)).join(", ")}.`);
    }
    return errors;
  }
  if (typeof schema.type === "string" && !matchesType(value, schema.type)) {
    errors.push(`${where}: expected type "${schema.type}", got ${describeType(value)}.`);
    return errors;
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${where}: needs at least ${schema.minItems} items, got ${value.length}.`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${where}: allows at most ${schema.maxItems} items, got ${value.length}.`);
    }
    if (schema.items) {
      for (const [i, item] of value.entries()) {
        errors.push(...validateAgainstSchema(item, schema.items, `${where}[${i}]`, root));
      }
    }
    return errors;
  }

  if (value && typeof value === "object") {
    for (const required of schema.required ?? []) {
      if (!(required in value)) errors.push(`${where}: missing required property "${required}".`);
    }
    const props = schema.properties ?? {};
    for (const [key, child] of Object.entries(value)) {
      if (props[key]) {
        errors.push(...validateAgainstSchema(child, props[key], `${where}.${key}`, root));
      } else if (schema.additionalProperties === false) {
        errors.push(`${where}: unknown property "${key}" (schema is closed).`);
      }
    }
    return errors;
  }

  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${where}: must be at least ${schema.minLength} characters.`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(`${where}: allows at most ${schema.maxLength} characters, got ${value.length}.`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${where}: "${value}" does not match pattern ${schema.pattern}.`);
    }
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${where}: must be >= ${schema.minimum}.`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${where}: must be <= ${schema.maximum}.`);
  }
  return errors;
}

function resolveRef(ref, root) {
  if (!ref.startsWith("#/")) return null;
  let node = root;
  for (const segment of ref.slice(2).split("/")) {
    node = node?.[segment.replace(/~1/g, "/").replace(/~0/g, "~")];
  }
  return node ?? null;
}

function matchesType(value, type) {
  switch (type) {
    case "object": return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    case "array": return Array.isArray(value);
    case "string": return typeof value === "string";
    case "integer": return Number.isInteger(value);
    case "number": return typeof value === "number";
    case "boolean": return typeof value === "boolean";
    default: return SUPPORTED_TYPES.has(type);
  }
}

function describeType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error("Usage: validate-diagram-ir.mjs <ir-file> [<ir-file> ...]");
    process.exit(1);
  }
  let failed = false;
  for (const file of files) {
    let ir;
    try {
      ir = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
      console.error(`✗ ${file}: cannot read/parse JSON — ${err.message}`);
      failed = true;
      continue;
    }
    const errors = validateDiagramIr(ir);
    if (errors.length) {
      failed = true;
      for (const error of errors) console.error(`✗ ${file}: ${error}`);
    } else {
      console.log(`✓ ${file}`);
    }
  }
  process.exit(failed ? 1 : 0);
}
