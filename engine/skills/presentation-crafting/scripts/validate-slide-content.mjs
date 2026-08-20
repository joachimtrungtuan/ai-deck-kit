#!/usr/bin/env node
// Validate a .deck bundle: deck.json manifest + content.md, per docs/deck-format-spec.md section 6.
import fs from "node:fs";
import path from "node:path";
import * as PhosphorIcons from "@phosphor-icons/react";

const deckDir = process.argv[2];

if (!deckDir) {
  fail("Usage: validate-slide-content.mjs <deck-dir>");
}

const manifestPath = path.join(deckDir, "deck.json");
const contentPath = path.join(deckDir, "content.md");

const manifest = readJson(manifestPath);
const content = readFile(contentPath);
const errors = [];
let templateManifest;
const blockCatalogV1 = new Set(["text", "title-description", "image", "chart", "table", "icon-text-card", "quote", "stat", "list", "code"]);
const motionCatalogV1 = new Set(["none", "fade", "gentle-rise", "morph"]);
const REACT_FORWARD_REF = Symbol.for("react.forward_ref");

for (const field of [
  "schema",
  "title",
  "slug",
  "audience",
  "goal",
  "template",
  "slideTypeCatalog",
  "blockCatalog",
  "contentSchemaVersion",
  "outputMode",
  "status",
  "defaults",
  "slides",
]) {
  if (manifest[field] === undefined) {
    errors.push(`deck.json: missing field: ${field}`);
  }
}

if (manifest.template && (!manifest.template.set || !manifest.template.version)) {
  errors.push("deck.json: template.set and template.version are both required.");
}

if (manifest.blockCatalog && manifest.blockCatalog !== "v1") {
  errors.push(`deck.json: unsupported blockCatalog "${manifest.blockCatalog}". Supported: v1.`);
}

if (manifest.template?.set) {
  const workspaceRoot = findWorkspaceRoot(deckDir);
  const pointer = workspaceRoot ? readJson(path.join(workspaceRoot, "ai-deck-kit.json")) : { engineRoot: "./engine" };
  const projectRoot = workspaceRoot ?? path.resolve(deckDir, "..", "..");
  const bundle = `${manifest.template.set}.template`;
  // The deck's own frozen snapshot is authoritative. Only a snapshot-less deck falls back to a
  // source template, and there the project's copy wins over the engine's shipped default.
  const candidates = [
    path.join(deckDir, "template", "template-manifest.json"),
    path.join(projectRoot, "templates", bundle, "template-manifest.json"),
    path.resolve(projectRoot, pointer.engineRoot, "templates", bundle, "template-manifest.json"),
  ];
  const templateManifestPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!templateManifestPath) {
    errors.push(`deck.json: template.set "${manifest.template.set}" has no template-manifest.json in the deck snapshot, ./templates, or the engine defaults.`);
  } else {
    templateManifest = readJson(templateManifestPath);
    if (templateManifest.name !== manifest.template.set) {
      errors.push(`deck.json: template set mismatch, deck=${manifest.template.set}, embedded=${templateManifest.name ?? "missing"}.`);
    }
    if (templateManifest.templateVersion !== manifest.template.version) {
      errors.push(`deck.json: template version mismatch, deck=${manifest.template.version}, embedded=${templateManifest.templateVersion ?? "missing"}.`);
    }
    if (manifest.slideTypeCatalog && templateManifest.slideTypeCatalog && manifest.slideTypeCatalog !== templateManifest.slideTypeCatalog) {
      errors.push(`deck.json: slideTypeCatalog mismatch, deck=${manifest.slideTypeCatalog}, template=${templateManifest.slideTypeCatalog}.`);
    }
  }
}

const manifestSlides = Array.isArray(manifest.slides) ? manifest.slides : [];
const manifestIds = new Set(manifestSlides.map((slide) => slide.id));
if (templateManifest) {
  const supported = new Set(templateManifest.supportedSlideTypes ?? []);
  for (const slide of manifestSlides) {
    if (!supported.has(slide.type)) {
      errors.push(`deck.json: slide "${slide.id}" uses type "${slide.type}" not supported by template "${templateManifest.name}".`);
    }
  }
}

const slideMatches = [...content.matchAll(/^## Slide\s+(\d+):\s+(.+)$/gm)];
if (slideMatches.length === 0) {
  errors.push("content.md: no slide sections found. Expected headings like: ## Slide 01: Title");
}

const contentIds = new Set();
const slideMorphAnchors = [];

slideMatches.forEach((match, index) => {
  const start = match.index;
  const end = index + 1 < slideMatches.length ? slideMatches[index + 1].index : content.length;
  const block = content.slice(start, end);
  const label = `Slide ${match[1]}`;
  const metadata = extractFirstYamlFence(block);

  if (!metadata) {
    errors.push(`${label}: missing slide metadata YAML fence.`);
    return;
  }

  for (const field of ["id", "type", "status", "intent", "animation"]) {
    if (!hasYamlField(metadata, field)) {
      errors.push(`${label}: missing metadata field: ${field}`);
    }
  }

  const id = extractYamlField(metadata, "id");
  const type = extractYamlField(metadata, "type");
  for (const { field, value } of extractIconFields(metadata)) {
    if (!resolvePhosphorIcon(value)) {
      errors.push(`${label}: ${field} value "${value}" is not a real Phosphor icon name. Use a kebab-case or PascalCase export from @phosphor-icons/react.`);
    }
  }
  if (id) {
    contentIds.add(id);
    if (!manifestIds.has(id)) {
      errors.push(`${label}: id "${id}" has no matching entry in deck.json slides[].`);
    }
  }

  if (templateManifest && type) {
    const layoutVariant = extractYamlField(metadata, "layoutVariant");
    const backgroundVariant = extractYamlField(metadata, "backgroundVariant");
    if (layoutVariant) {
      const allowed = templateManifest.layoutVariants?.[type] ?? [];
      if (!allowed.includes(layoutVariant)) {
        errors.push(`${label}: layoutVariant "${layoutVariant}" is not declared for type "${type}".`);
      }
    }
    if (backgroundVariant) {
      const allowed = templateManifest.backgroundVariants ?? [];
      if (!allowed.includes(backgroundVariant)) {
        errors.push(`${label}: backgroundVariant "${backgroundVariant}" is not declared by template "${templateManifest.name}".`);
      }
    }
  }

  const overrideBlock = extractOverrideBlock(metadata);
  if (overrideBlock) {
    const layout = extractYamlField(overrideBlock, "layout");
    const animation = extractYamlField(overrideBlock, "animation");
    const reason = extractYamlField(overrideBlock, "reason");
    const active = (layout && layout !== "none") || (animation && animation !== "none");
    if (active && (!reason || reason.trim() === "")) {
      errors.push(`${label}: override is active (layout/animation != "none") but override.reason is empty.`);
    }
  }

  const blocksSection = extractBlocksSection(metadata);
  const anchors = [];
  if (blocksSection) {
    if (!manifest.blockCatalog) {
      errors.push(`${label}: declares blocks but deck.json has no blockCatalog.`);
    }
    for (const blockEntry of extractBlockEntries(blocksSection)) {
      const blockId = extractYamlField(blockEntry, "id");
      const blockType = extractYamlField(blockEntry, "type");
      const animation = extractYamlField(blockEntry, "animation");
      const morph = extractYamlField(blockEntry, "morph");
      if (!blockId) errors.push(`${label}: block is missing id.`);
      if (!blockType || !blockCatalogV1.has(blockType)) {
        errors.push(`${label}: block type "${blockType ?? "missing"}" is not in block-catalog v1.`);
      }
      if (animation && !motionCatalogV1.has(animation)) {
        errors.push(`${label}: block animation "${animation}" is not in motion-catalog v1.`);
      }
      if (animation === "morph" && !morph) {
        errors.push(`${label}: block animation "morph" requires a morph anchor.`);
      }
      for (const field of requiredBlockFields(blockType)) {
        if (!hasBlockField(blockEntry, field)) {
          errors.push(`${label}: ${blockType} block is missing required field "${field}".`);
        }
      }
      if (morph) anchors.push(morph);
    }
  }
  slideMorphAnchors.push({ label, anchors });

  if (!/^### On-Slide Text/m.test(block)) {
    errors.push(`${label}: missing ### On-Slide Text section.`);
  }
  if (!/^### Visual Direction/m.test(block)) {
    errors.push(`${label}: missing ### Visual Direction section.`);
  }
  if (!/^### Speaker Notes/m.test(block)) {
    errors.push(`${label}: missing ### Speaker Notes section.`);
  }
});

slideMorphAnchors.forEach(({ label, anchors }, index) => {
  const duplicate = anchors.find((anchor, anchorIndex) => anchors.indexOf(anchor) !== anchorIndex);
  if (duplicate) errors.push(`${label}: morph anchor "${duplicate}" appears more than once.`);
  for (const anchor of new Set(anchors)) {
    const adjacent = [slideMorphAnchors[index - 1], slideMorphAnchors[index + 1]].filter(Boolean);
    if (!adjacent.some((slide) => slide.anchors.includes(anchor))) {
      errors.push(`${label}: morph anchor "${anchor}" has no matching anchor on an adjacent slide.`);
    }
  }
});

for (const slide of manifestSlides) {
  if (!contentIds.has(slide.id)) {
    errors.push(`deck.json: slide "${slide.id}" has no matching ## Slide section in content.md.`);
  }
}

if (errors.length) {
  console.error("Deck validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Deck is valid: ${path.relative(process.cwd(), deckDir)}`);

function readFile(target) {
  try {
    return fs.readFileSync(target, "utf8");
  } catch (error) {
    fail(`Could not read file: ${target}\n${error.message}`);
  }
}

function readJson(target) {
  const raw = readFile(target);
  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`Could not parse JSON: ${target}\n${error.message}`);
  }
}

function extractFirstYamlFence(text) {
  const match = text.match(/```ya?ml\n([\s\S]*?)\n```/);
  return match ? match[1] : null;
}

function extractOverrideBlock(yaml) {
  const match = yaml.match(/^override:\n((?:[ \t]+.+\n?)*)/m);
  return match ? match[1] : null;
}

function extractBlocksSection(yaml) {
  const match = yaml.match(/^blocks:\n((?:[ \t]+.+\n?)*)/m);
  return match ? match[1] : null;
}

function extractBlockEntries(blocksYaml) {
  const starts = [...blocksYaml.matchAll(/^  -\s+(.+)$/gm)];
  return starts.map((match, index) => {
    const nextStart = starts[index + 1]?.index ?? blocksYaml.length;
    const lineEnd = (match.index ?? 0) + match[0].length;
    return `${match[1]}${blocksYaml.slice(lineEnd, nextStart)}`;
  });
}

function requiredBlockFields(blockType) {
  return {
    text: ["text"],
    "title-description": ["title"],
    image: ["src", "alt"],
    chart: ["kind", "series"],
    table: ["columns", "rows"],
    "icon-text-card": ["icon", "title", "description"],
    quote: ["quote"],
    stat: ["value", "label"],
    list: ["items"],
    code: ["code"],
  }[blockType] ?? [];
}

function extractIconFields(yaml) {
  const fields = [];
  for (const line of yaml.split("\n")) {
    const match = line.match(/^\s*(icons?|icon)\s*:\s*(.*?)\s*$/);
    if (!match) continue;
    const field = match[1];
    const values = field === "icons" ? parseInlineArray(match[2]) : [parseScalar(match[2])];
    values.filter(Boolean).forEach((value) => fields.push({ field, value }));
  }
  return fields;
}

function parseInlineArray(raw) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
  } catch {
    return [...raw.matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
  }
}

function parseScalar(raw) {
  const value = raw.trim();
  if (!value || value === "null" || value === "~") return "";
  return value.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, (_, doubleQuoted, singleQuoted) => doubleQuoted ?? singleQuoted);
}

function resolvePhosphorIcon(name) {
  const value = typeof name === "string" ? name.trim() : "";
  if (!value) return null;
  const exportName = value
    .split("-")
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join("");
  if (!exportName || exportName === "IconBase") return null;
  const icon = PhosphorIcons[exportName];
  if (typeof icon === "function") return icon;
  if (typeof icon !== "object" || icon === null) return null;
  return icon.$$typeof === REACT_FORWARD_REF && typeof icon.render === "function" ? icon : null;
}

function hasBlockField(blockYaml, field) {
  return new RegExp(`^\\s*${escapeRegExp(field)}\\s*:|^\\s*data\\s*:\\s*\\{[^}]*\\b${escapeRegExp(field)}\\s*:`, "m").test(blockYaml);
}

function hasYamlField(yaml, field) {
  const pattern = new RegExp(`^${escapeRegExp(field)}\\s*:`, "m");
  return pattern.test(yaml);
}

function extractYamlField(yaml, field) {
  const match = yaml.match(new RegExp(`^\\s*${escapeRegExp(field)}\\s*:\\s*"?([^"\\n]*)"?\\s*$`, "m"));
  return match ? match[1].trim() : undefined;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function findWorkspaceRoot(start) {
  let directory = path.resolve(start);
  while (true) {
    const pointer = path.join(directory, "ai-deck-kit.json");
    if (fs.existsSync(pointer)) return directory;
    const parent = path.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}
