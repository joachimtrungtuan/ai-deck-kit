#!/usr/bin/env node
// Render a diagram IR (engine/primitives/diagrams/diagram-ir-v1.md) into one slide's
// `override:` block: scoped, template-neutral HTML+CSS with engine primitive-anim-*
// classes. Output is a YAML snippet to paste into that slide's metadata fence.
//
// Usage:
//   node render-diagram.mjs --ir <path-to-ir.json> [--animation <catalog-name>] [--out <file>]
//
// Contract:
//   - Emits only `primitive-anim-*` animation classes — never template-prefixed classes,
//     never a per-template branch. Motion idiom comes from --deck-motion-* tokens.
//   - Every selector and element id is scoped by a unique class/hash derived from the IR
//     content, so diagrams on sibling slides cannot affect each other.
//   - Deterministic: the same IR bytes render to the same output.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { validateDiagramIr, loadDiagramIrSchema } from "./validate-diagram-ir.mjs";

const CANVAS = { w: 1600, h: 900 };
const MARGIN = { top: 64, left: 96, right: 96, bottom: 64 };
const TITLE_BAND = 130;
const ELEMENT_ANIMATIONS = new Set([
  "none", "fade", "gentle-rise", "soft-scale", "masked-reveal",
  "staggered-list", "image-drift", "line-draw", "spotlight", "morph",
]);

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

function main() {
  const args = process.argv.slice(2);
  const getFlag = (name) => {
    const i = args.indexOf(`--${name}`);
    return i !== -1 ? args[i + 1] : undefined;
  };
  if (args.includes("--help") || !getFlag("ir")) {
    console.log("Usage: render-diagram.mjs --ir <path> [--animation <catalog-name>] [--out <file>]");
    process.exit(args.includes("--ir") ? 1 : 0);
  }
  const irPath = path.resolve(getFlag("ir"));
  const animation = getFlag("animation") ?? "gentle-rise";
  let irBytes;
  try {
    irBytes = fs.readFileSync(irPath);
  } catch (err) {
    fail(`cannot read IR: ${err.message}`);
  }
  let ir;
  try {
    ir = JSON.parse(irBytes.toString("utf8"));
  } catch (err) {
    fail(`cannot parse IR JSON: ${err.message}`);
  }
  let snippet;
  try {
    snippet = renderDiagramSnippet(ir, { irBytes, irRel: deckRelativePath(irPath), animation });
  } catch (err) {
    fail(err.message);
  }
  const outFile = getFlag("out");
  if (outFile) {
    fs.writeFileSync(outFile, snippet);
    console.log(`Wrote override snippet: ${path.resolve(outFile)}`);
  } else {
    process.stdout.write(snippet);
  }
}

export function renderDiagramSnippet(ir, { irBytes, irRel, animation = "gentle-rise" } = {}) {
  if (!/^[A-Za-z0-9._-]+\.json$/.test(path.basename(irRel))) {
    throw new Error(`IR file name "${path.basename(irRel)}" must match [A-Za-z0-9._-]+.json (the deck validator keys diagram checks on it).`);
  }
  if (!ELEMENT_ANIMATIONS.has(animation)) {
    throw new Error(`--animation "${animation}" is not in the element animation catalog v1.`);
  }
  if (animation === "morph") {
    throw new Error("morph is not supported by the diagram renderer in v1 (see phase 4 risk note).");
  }
  const schemaErrors = validateDiagramIr(ir, loadDiagramIrSchema());
  if (schemaErrors.length) throw new Error(`IR is not valid:\n  ${schemaErrors.join("\n  ")}`);
  const hash = createHash("sha256").update(irBytes).digest("hex").slice(0, 8);
  const irName = path.basename(irRel).replace(/\.json$/, "");
  const scope = `aideck-diagram--${sanitize(irName)}-${hash}`;
  return renderOverrideSnippet(ir, { scope, hash, animation, irRel });
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function deckRelativePath(absolute) {
  const marker = ".deck" + path.sep;
  const idx = absolute.indexOf(marker);
  if (idx !== -1) return path.relative(absolute.slice(0, idx + marker.length - 1), absolute).split(path.sep).join("/");
  return absolute.split(path.sep).join("/");
}

function sanitize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "diagram";
}

function layoutGeometry(ir) {
  const nodes = ir.nodes;
  const layout = ir.layout ?? {};
  const cols = layout.cols ?? Math.max(...nodes.map((n) => n.col)) + 1;
  const rows = Math.max(...nodes.map((n) => n.row)) + 1;
  const area = {
    x: MARGIN.left,
    y: MARGIN.top + TITLE_BAND,
    w: CANVAS.w - MARGIN.left - MARGIN.right,
    h: CANVAS.h - MARGIN.top - MARGIN.bottom - TITLE_BAND,
  };
  const gapX = layout.gapX ?? 56;
  const gapY = layout.gapY ?? 48;
  const cellW = clamp(Math.round((area.w - (cols - 1) * gapX) / cols), 120, layout.cellW ?? 320);
  const cellH = clamp(Math.round((area.h - (rows - 1) * gapY) / rows), 70, layout.cellH ?? 150);
  const blockW = cols * cellW + (cols - 1) * gapX;
  const blockH = rows * cellH + (rows - 1) * gapY;
  const originX = area.x + Math.round((area.w - blockW) / 2);
  const originY = area.y + Math.round((area.h - blockH) / 2);
  const boxes = new Map();
  for (const node of nodes) {
    boxes.set(node.id, {
      x: originX + node.col * (cellW + gapX),
      y: originY + node.row * (cellH + gapY),
      w: cellW,
      h: cellH,
    });
  }
  return { boxes, area, cellW, cellH, gapX, gapY, originX, originY, cols, rows };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]));
}

function wrapLabel(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
    if (lines.length === 2) break;
  }
  if (lines.length < 2 && current) lines.push(current);
  if (lines.length === 2) {
    const rest = words.slice(lines.join(" ").split(/\s+/).length).join(" ");
    if (rest) lines[1] = `${lines[1].slice(0, Math.max(0, maxChars - 1))}…`;
  }
  return lines.slice(0, 2);
}

function animClass(name) {
  return name === "none" ? "" : ` primitive-anim-${name}`;
}

function sideAnchor(box, side) {
  switch (side) {
    case "left": return { x: box.x, y: box.y + box.h / 2 };
    case "right": return { x: box.x + box.w, y: box.y + box.h / 2 };
    case "top": return { x: box.x + box.w / 2, y: box.y };
    default: return { x: box.x + box.w / 2, y: box.y + box.h };
  }
}

function autoSides(fromBox, toBox) {
  const dx = (toBox.x + toBox.w / 2) - (fromBox.x + fromBox.w / 2);
  const dy = (toBox.y + toBox.h / 2) - (fromBox.y + fromBox.h / 2);
  return Math.abs(dx) >= Math.abs(dy)
    ? [dx >= 0 ? "right" : "left", dx >= 0 ? "left" : "right"]
    : [dy >= 0 ? "bottom" : "top", dy >= 0 ? "top" : "bottom"];
}

function edgePath(from, to, fromSide, toSide) {
  const horizontalExit = fromSide === "left" || fromSide === "right";
  const horizontalEnter = toSide === "left" || toSide === "right";
  const points = [from];
  if (horizontalExit && horizontalEnter) {
    if (from.y !== to.y) {
      const mx = Math.round((from.x + to.x) / 2);
      points.push({ x: mx, y: from.y }, { x: mx, y: to.y });
    }
  } else if (!horizontalExit && !horizontalEnter) {
    if (from.x !== to.x) {
      const my = Math.round((from.y + to.y) / 2);
      points.push({ x: from.x, y: my }, { x: to.x, y: my });
    }
  } else if (horizontalExit) {
    points.push({ x: to.x, y: from.y });
  } else {
    points.push({ x: from.x, y: to.y });
  }
  points.push(to);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const mid = midpointAtHalf(points);
  return { d, mid };
}

function midpointAtHalf(points) {
  let total = 0;
  const segments = [];
  for (let i = 1; i < points.length; i += 1) {
    const len = Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
    segments.push(len);
    total += len;
  }
  let target = total / 2;
  for (let i = 0; i < segments.length; i += 1) {
    if (target <= segments[i]) {
      const t = segments[i] === 0 ? 0 : target / segments[i];
      const a = points[i];
      const b = points[i + 1];
      return { x: Math.round(a.x + (b.x - a.x) * t), y: Math.round(a.y + (b.y - a.y) * t) };
    }
    target -= segments[i];
  }
  return points[points.length - 1];
}

function renderOverrideSnippet(ir, { scope, hash, animation, irRel }) {
  const { html, css } = renderDiagram(ir, { scope, hash, animation, irRel });
  const regenerate = `node engine/skills/presentation-crafting/scripts/render-diagram.mjs --ir <deck>/${irRel} --animation ${animation}`;
  const reason = `Rendered from ${irRel} (diagram IR v1, content ${hash}) by render-diagram.mjs; the diagram supersedes the template layout on this slide. Regenerate, never hand-edit: ${regenerate}`;
  const yamlBlock = (value) => value.split("\n").map((line) => `    ${line}`).join("\n");
  return [
    "override:",
    '  layout: "none"',
    '  animation: "none"',
    `  reason: ${JSON.stringify(reason)}`,
    "  css: |-",
    yamlBlock(css),
    "  html: |-",
    yamlBlock(html),
    "",
  ].join("\n");
}

function renderDiagram(ir, { scope, hash, animation, irRel }) {
  const geometry = layoutGeometry(ir);
  const idSuffix = scope.replace("aideck-diagram--", "");
  const edges = ir.edges ?? [];
  const groups = ir.groups ?? [];

  const groupMarkup = groups.map((group) => {
    const boxes = group.wraps.map((id) => geometry.boxes.get(id)).filter(Boolean);
    if (!boxes.length) return "";
    const pad = 18;
    const x = Math.min(...boxes.map((b) => b.x)) - pad;
    const y = Math.min(...boxes.map((b) => b.y)) - pad - 14;
    const w = Math.max(...boxes.map((b) => b.x + b.w)) + pad - x;
    const h = Math.max(...boxes.map((b) => b.y + b.h)) + pad - y;
    return `<g class="group group--${group.kind === "security-group" ? "security" : "region"}${animClass(animation)}">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14"></rect>
  <text class="group-label" x="${x + 16}" y="${y + 26}">${escapeXml(group.label)}</text>
</g>`;
  }).filter(Boolean).join("\n");

  const staggeredContainer = animation === "staggered-list";
  const nodeAnimClass = animation === "none" || staggeredContainer ? "" : ` primitive-anim-${animation}`;
  const nodeMarkup = ir.nodes.map((node) => {
    const box = geometry.boxes.get(node.id);
    const maxChars = Math.max(6, Math.floor((box.w - 36) / 15));
    const lines = wrapLabel(node.label, maxChars);
    const labelTop = box.y + box.h / 2 - ((lines.length - 1) * 34) / 2 - (node.sublabel ? 12 : 0) + 10;
    const label = lines.map((line, i) =>
      `<text class="node-label" x="${box.x + box.w / 2}" y="${labelTop + i * 34}">${escapeXml(line)}</text>`).join("\n  ");
    const sublabel = node.sublabel
      ? `\n  <text class="node-sublabel" x="${box.x + box.w / 2}" y="${labelTop + (lines.length - 1) * 34 + 26}">${escapeXml(node.sublabel)}</text>`
      : "";
    const kind = node.kind
      ? `\n  <text class="node-kind" x="${box.x + box.w / 2}" y="${box.y + 28}">${escapeXml(node.kind)}</text>`
      : "";
    const emphasis = node.emphasis ? " node--emphasis" : "";
    return `<g class="node${emphasis}${nodeAnimClass}" data-node-id="${escapeXml(node.id)}" role="img" aria-label="${escapeXml(node.label)}">
  <rect class="node-box" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="12"></rect>${kind}
  ${label}${sublabel}
</g>`;
  }).join("\n");

  const edgeMarkup = edges.map((edge) => {
    const fromBox = geometry.boxes.get(edge.from);
    const toBox = geometry.boxes.get(edge.to);
    const [autoFrom, autoTo] = autoSides(fromBox, toBox);
    const fromSide = edge.fromSide ?? autoFrom;
    const toSide = edge.toSide ?? autoTo;
    const from = sideAnchor(fromBox, fromSide);
    const to = sideAnchor(toBox, toSide);
    const { d, mid } = edgePath(from, to, fromSide, toSide);
    const variant = edge.variant && edge.variant !== "default" ? ` edge--${edge.variant}` : "";
    const dashed = edge.variant === "dashed";
    const anim = animation === "none" ? "" : dashed ? " primitive-anim-fade" : " primitive-anim-line-draw";
    const marker = edge.variant === "emphasis" || edge.variant === "security" ? `url(#arw-accent-${idSuffix})` : `url(#arw-muted-${idSuffix})`;
    const label = edge.label
      ? `\n  <text class="edge-label" x="${mid.x}" y="${mid.y - 10}">${escapeXml(edge.label)}</text>`
      : "";
    const idAttr = edge.id ? ` data-edge-id="${escapeXml(edge.id)}"` : "";
    const drawn = dashed ? "" : ' pathLength="1"';
    return `<path class="edge${variant}${anim}"${drawn}${idAttr} d="${d}" marker-end="${marker}"></path>${label}`;
  }).join("\n");

  const titleLines = [
    `<text class="title" x="${MARGIN.left}" y="${MARGIN.top + 46}">${escapeXml(ir.meta.title)}</text>`,
  ];
  if (ir.meta.subtitle) {
    titleLines.push(`<text class="subtitle" x="${MARGIN.left}" y="${MARGIN.top + 84}">${escapeXml(ir.meta.subtitle)}</text>`);
  }
  const nodesWrapped = staggeredContainer
    ? `<g class="stagger primitive-anim-staggered-list">\n${nodeMarkup}\n</g>`
    : nodeMarkup;

  const html = `<div class="aideck-diagram ${scope}">
<svg viewBox="0 0 ${CANVAS.w} ${CANVAS.h}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arw-muted-${idSuffix}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="arrow-muted"></path></marker>
    <marker id="arw-accent-${idSuffix}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="arrow-accent"></path></marker>
  </defs>
  <g class="heading${animClass(animation)}">
    ${titleLines.join("\n    ")}
  </g>
  <g class="layer layer--groups">
    ${groupMarkup}
  </g>
  <g class="layer layer--edges">
    ${edgeMarkup}
  </g>
  <g class="layer layer--nodes">
    ${nodesWrapped}
  </g>
</svg>
</div>`;

  const s = (selector) => `.${scope} ${selector}`;
  const css = `/* Generated by render-diagram.mjs from ${irRel} (diagram IR v1, content ${hash}). Do not hand-edit — re-render. */
.${scope} { position: absolute; inset: 0; background: var(--deck-color-bg, transparent); }
${s("> svg { width: 100%; height: 100%; display: block; }")}
${s(".title { font-family: var(--deck-font-display); font-size: 44px; font-weight: 600; fill: var(--deck-color-ink); }")}
${s(".subtitle { font-family: var(--deck-font-body); font-size: 21px; fill: var(--deck-color-muted); }")}
${s(".node-box { fill: var(--deck-color-surface); stroke: var(--deck-color-ink); stroke-width: 1.5; }")}
${s(".node--emphasis .node-box { fill: var(--deck-color-accent-soft); stroke: var(--deck-color-accent); }")}
${s(".node-label { font-family: var(--deck-font-body); font-size: 27px; font-weight: 500; fill: var(--deck-color-ink); text-anchor: middle; }")}
${s(".node-sublabel { font-family: var(--deck-font-body); font-size: 18px; fill: var(--deck-color-muted); text-anchor: middle; }")}
${s(".node-kind { font-family: var(--deck-font-mono); font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; fill: var(--deck-color-accent); text-anchor: middle; }")}
${s(".edge { fill: none; stroke: var(--deck-color-muted); stroke-width: 2; }")}
${s(".edge--emphasis { stroke: var(--deck-color-accent); stroke-width: 3.5; }")}
${s(".edge--security { stroke: var(--deck-color-accent); }")}
${s(".edge--dashed { stroke-dasharray: 10 8; }")}
${s(".edge-label { font-family: var(--deck-font-mono); font-size: 16px; fill: var(--deck-color-muted); text-anchor: middle; paint-order: stroke; stroke: var(--deck-color-bg); stroke-width: 8px; }")}
${s(".group rect { fill: none; stroke: var(--deck-color-muted); stroke-width: 1.5; }")}
${s(".group--region rect { stroke-dasharray: 2 6; }")}
${s(".group--security rect { stroke: var(--deck-color-accent); stroke-dasharray: 12 6; }")}
${s(".group-label { font-family: var(--deck-font-mono); font-size: 15px; letter-spacing: 0.1em; text-transform: uppercase; fill: var(--deck-color-muted); }")}
${s(".arrow-muted { fill: var(--deck-color-muted); }")}
${s(".arrow-accent { fill: var(--deck-color-accent); }")}`;

  return { html, css };
}
