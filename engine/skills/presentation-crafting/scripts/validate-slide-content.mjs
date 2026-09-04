#!/usr/bin/env node
// Validate a .deck bundle: deck.json manifest + content.md, per docs/deck-format-spec.md section 6.
// Dual-schema validator: dispatches on the major of deck.json's contentSchemaVersion.
//   1.x -> frozen v1 rule block below (kept verbatim; do not refactor, unify, or "fix" it)
//   2.x -> validateContentV2()
// The duplication between the two blocks is deliberate and load-bearing: unifying a shared check
// would let a later v2 tightening silently start failing the seven frozen v1 decks. See
// plans/260826-1000-content-md-schema-redesign/phase-03-validator-updates.md.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { parse as parseYaml } from "yaml";
import * as PhosphorIcons from "@phosphor-icons/react";
import { validateDiagramIr } from "./validate-diagram-ir.mjs";
import { validateSlideMediaProps } from "./validate-slide-media-props.mjs";

const deckDir = process.argv[2];

if (!deckDir) {
  fail("Usage: validate-slide-content.mjs <deck-dir>");
}

const manifestPath = path.join(deckDir, "deck.json");
const contentPath = path.join(deckDir, "content.md");

const manifest = readJson(manifestPath);
const content = readFile(contentPath);
const errors = [];
const warnings = [];
let templateManifest;
const blockCatalogV1 = new Set(["text", "title-description", "image", "chart", "table", "icon-text-card", "quote", "stat", "list", "code"]);
const motionCatalogV1 = new Set(["none", "fade", "gentle-rise", "morph"]);
const elementAnimationCatalogV1 = new Set(["none", "fade", "gentle-rise", "soft-scale", "masked-reveal", "staggered-list", "image-drift", "line-draw", "spotlight", "morph"]);
const REACT_FORWARD_REF = Symbol.for("react.forward_ref");

// Schema dispatch — mirrors engine/preview-app/src/manifest-deck-source.tsx exactly so the
// validator never disagrees with the parser about which schema a deck is.
const DEFAULT_CONTENT_SCHEMA_VERSION = "1.0.0";
const SUPPORTED_CONTENT_SCHEMA_MAJORS = [1, 2, 3];

const rawSchemaVersion = manifest.contentSchemaVersion ?? DEFAULT_CONTENT_SCHEMA_VERSION;
const schemaMajorMatch = /^(\d+)\.\d+\.\d+$/.exec(String(rawSchemaVersion));
const schemaMajor = schemaMajorMatch ? Number(schemaMajorMatch[1]) : Number.NaN;
if (!SUPPORTED_CONTENT_SCHEMA_MAJORS.includes(schemaMajor)) {
  fail(`Deck "${manifest.slug ?? "?"}" declares unsupported contentSchemaVersion "${rawSchemaVersion}". Supported schema majors: ${SUPPORTED_CONTENT_SCHEMA_MAJORS.join(", ")}.`);
}

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

if (schemaMajor === 1) {
  // ===========================================================================
  // v1 rule block — FROZEN at its pre-dual-schema behavior (engine commit with
  // phase-02b). Every existing v1 deck must keep passing exactly as it does.
  // Do not refactor, do not share helpers with validateContentV2, do not fix
  // anything this block gets wrong. See phase-03-validator-updates.md.
  // ===========================================================================
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
} else {
  validateContentV2({ manifest, content, templateManifest, manifestSlides, manifestIds, errors, warnings });
}

if (warnings.length) {
  console.warn("Deck validation warnings:");
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}

if (errors.length) {
  console.error("Deck validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Deck is valid: ${path.relative(process.cwd(), deckDir)}`);

// ============================================================================
// v2 rule block (contentSchemaVersion 2.x).
//
// NOTE: duplication with the v1 block above is deliberate and load-bearing.
// This block keeps its own YAML fence reader, icon resolver, and morph walker
// instead of sharing them with v1: a shared check later tightened for v2 would
// silently start failing the seven frozen v1 decks. Accept the copies; do not
// unify them. See plans/260826-1000-content-md-schema-redesign/
// phase-03-validator-updates.md.
// ============================================================================
function validateContentV2({ manifest, content, templateManifest, manifestSlides, manifestIds, errors, warnings }) {
  const headers = [...content.matchAll(/^## Slide\s+(\d+).*$/gm)];
  if (headers.length === 0) {
    errors.push("content.md: no slide sections found. Expected headings like: ## Slide 05 (slide-05)");
  }

  const contentIds = new Set();
  const slideMorphAnchors = [];

  headers.forEach((match, index) => {
    const start = match.index;
    const end = index + 1 < headers.length ? headers[index + 1].index : content.length;
    const block = content.slice(start, end);
    const label = `Slide ${match[1]}`;
    const yamlText = v2ExtractFirstYamlFence(block);

    if (yamlText === null) {
      errors.push(`${label}: missing slide metadata YAML fence.`);
      return;
    }

    const metadata = v2ParseMetadata(yamlText);
    if (metadata === null) {
      errors.push(`${label}: slide metadata YAML fence does not parse.`);
      return;
    }

    // chartData/images are read as data by the shipped templates; the runtime checks only
    // Array-ness, so their element shape has to be enforced here.
    const media = validateSlideMediaProps({ metadata, label, deckDir });
    errors.push(...media.errors);
    warnings.push(...media.warnings);

    for (const field of ["id", "type", "status", "intent", "animation"]) {
      if (typeof metadata[field] !== "string" || !metadata[field]) {
        errors.push(`${label}: missing metadata field: ${field}`);
      }
    }

    // YAML title is the sole title source; there is no fallback to heading text in v2.
    if (typeof metadata.title !== "string" || !metadata.title.trim()) {
      errors.push(`${label}: missing or empty "title" in the slide metadata YAML. v2 requires title in YAML; there is no fallback to the heading text.`);
    }
    if (typeof metadata.animation === "string" && !elementAnimationCatalogV1.has(metadata.animation)) {
      errors.push(`${label}: animation "${metadata.animation}" is not in element-animation catalog v1.`);
    }
    if (typeof metadata.animation === "string" && templateManifest?.supportedAnimations && !templateManifest.supportedAnimations.includes(metadata.animation)) {
      errors.push(`${label}: animation "${metadata.animation}" is not supported by template "${templateManifest.name}".`);
    }

    // items[]: flag single-line flow-style entries (`- {title: ..., ...}` or `items: [...]`).
    // Block style keeps each attribute on its own line for IDE readability; see
    // engine/schemas/content-schema-guidance.md > "items[] Formatting".
    const itemsSection = v2ExtractItemsSection(yamlText);
    if (itemsSection && /items:\s*\[/.test(itemsSection.split("\n", 1)[0])) {
      warnings.push(`${label}: "items" uses flow-style (single-line "[...]"). Write it in block style, one field per line.`);
    } else if (itemsSection && /^\s*-\s*\{/m.test(itemsSection)) {
      warnings.push(`${label}: "items" contains a flow-style entry (single-line "{...}"). Write each entry in block style, one field per line.`);
    }

    // items[]: every entry needs a non-empty title; column is left/right when present.
    if (metadata.items !== undefined && !Array.isArray(metadata.items)) {
      errors.push(`${label}: "items" must be a list of {title, description?, icon?, column?} objects.`);
    }
    for (const [itemIndex, entry] of (Array.isArray(metadata.items) ? metadata.items : []).entries()) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        errors.push(`${label}: items[${itemIndex}] must be an object with a non-empty "title".`);
        continue;
      }
      if (typeof entry.title !== "string" || !entry.title.trim()) {
        errors.push(`${label}: items[${itemIndex}] is missing a non-empty "title".`);
      }
      if (entry.column !== undefined && entry.column !== "left" && entry.column !== "right") {
        errors.push(`${label}: items[${itemIndex}].column must be "left" or "right", got "${entry.column}".`);
      }
      for (const icon of v2CollectIcons(entry)) {
        if (!v2ResolvePhosphorIcon(icon)) {
          errors.push(`${label}: item icon "${icon}" is not a real Phosphor icon name. Use a kebab-case or PascalCase export from @phosphor-icons/react.`);
        }
      }
    }

    // override: reason required whenever css/html is set; basic containment guards.
    if (metadata.override !== undefined) {
      const override = metadata.override;
      if (!override || typeof override !== "object" || Array.isArray(override)) {
        errors.push(`${label}: "override" must be a mapping with layout/animation/css/html/reason keys.`);
      } else {
        const css = typeof override.css === "string" ? override.css : "";
        const html = typeof override.html === "string" ? override.html : "";
        const reason = typeof override.reason === "string" ? override.reason.trim() : "";
        if ((css.trim() || html.trim()) && !reason) {
          errors.push(`${label}: override.css or override.html is set but override.reason is empty.`);
        }
        if (css.includes("</style>")) {
          errors.push(`${label}: override.css must not contain "</style>" — escape it or move the rule out of the override.`);
        }
        if (html.includes("<script")) {
          errors.push(`${label}: override.html must not contain "<script" — script elements are not supported in overrides.`);
        }
        // Diagram overrides generated by render-diagram.mjs must ship a matching, valid source IR
        // (phase 4: the export is regenerable; a stale or hand-tampered override fails the deck).
        const diagramSource = css.match(/Generated by render-diagram\.mjs from (\S+\.json) \(diagram IR v1, content ([0-9a-f]{8})\)/);
        if (diagramSource) {
          const [, irRel, contentHash] = diagramSource;

          // Shape of the override itself. These depend only on css/html/override, never on the IR
          // file, so they run unconditionally — a missing IR must not mask a malformed override.
          const scopeClass = css.match(/\.(aideck-diagram--[a-z0-9-]+)\s*\{/);
          if (!scopeClass) {
            errors.push(`${label}: diagram override has no unique scope class.`);
          } else if (!html.includes(`class="aideck-diagram ${scopeClass[1]}"`)) {
            errors.push(`${label}: diagram html root does not carry the scoped class "${scopeClass[1]}".`);
          }
          if (override.layout !== "none" || override.animation !== "none") {
            errors.push(`${label}: diagram overrides must set override.layout and override.animation to "none" (the diagram supersedes the template layout).`);
          }

          // Source IR must ship with the bundle and still match the render (phase 4: the export is
          // regenerable; a stale or hand-tampered override fails the deck). The path is resolved
          // before the containment test so a traversing marker cannot read outside the deck.
          const diagramsDir = path.resolve(deckDir, "assets/diagrams");
          const irPath = path.resolve(deckDir, irRel);
          const irWithinDiagrams = path.relative(diagramsDir, irPath);
          if (irWithinDiagrams.startsWith("..") || path.isAbsolute(irWithinDiagrams)) {
            errors.push(`${label}: diagram override references "${irRel}" outside assets/diagrams/.`);
          } else if (!fs.existsSync(irPath)) {
            errors.push(`${label}: diagram IR "${irRel}" is missing from the deck bundle.`);
          } else {
            const irBytes = fs.readFileSync(irPath);
            const actualHash = createHash("sha256").update(irBytes).digest("hex").slice(0, 8);
            if (actualHash !== contentHash) {
              errors.push(`${label}: diagram IR "${irRel}" changed (${actualHash}) after render (${contentHash}) — re-run render-diagram.mjs.`);
            }
            let ir;
            try {
              ir = JSON.parse(irBytes.toString("utf8"));
            } catch (err) {
              errors.push(`${label}: diagram IR "${irRel}" is not valid JSON — ${err.message}`);
            }
            if (ir) {
              for (const error of validateDiagramIr(ir)) {
                errors.push(`${label}: diagram IR "${irRel}": ${error}`);
              }
            }
          }
        }
      }
    }

    const id = metadata.id;
    if (typeof id === "string" && id) {
      contentIds.add(id);
      if (!manifestIds.has(id)) {
        errors.push(`${label}: id "${id}" has no matching entry in deck.json slides[].`);
      }
    }

    // Morph anchors walk the whole metadata object recursively, mirroring the v2 parser's collectMorphAnchors.
    const morphAnchors = v2CollectMorphAnchors(metadata);
    if (metadata.animation === "morph" && morphAnchors.length === 0) {
      errors.push(`${label}: animation "morph" requires a morph anchor.`);
    }
    slideMorphAnchors.push({ label, anchors: morphAnchors });

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
}

function v2ExtractItemsSection(yamlText) {
  const match = yamlText.match(/^items:[^\n]*\n(?:[ \t].*\n?|\n)*/m);
  return match ? match[0] : null;
}

function v2ExtractFirstYamlFence(text) {
  const match = text.match(/```ya?ml\n([\s\S]*?)\n```/);
  return match ? match[1] : null;
}

function v2ParseMetadata(yamlText) {
  if (!yamlText.trim()) return {};
  try {
    const parsed = parseYaml(yamlText);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return null;
  }
}

function v2CollectIcons(node, out = []) {
  if (Array.isArray(node)) node.forEach((item) => v2CollectIcons(item, out));
  else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "icon" && typeof value === "string" && value) out.push(value);
      else v2CollectIcons(value, out);
    }
  }
  return out;
}

function v2CollectMorphAnchors(node, out = []) {
  if (Array.isArray(node)) node.forEach((item) => v2CollectMorphAnchors(item, out));
  else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "morph" && typeof value === "string") out.push(value);
      else v2CollectMorphAnchors(value, out);
    }
  }
  return out;
}

function v2ResolvePhosphorIcon(name) {
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

// ---------------------------------------------------------------------------
// Shared IO helpers plus v1-only YAML helpers below. The v1-only ones exist for
// the frozen v1 rule block only — the v2 block deliberately carries its own
// equivalents.
// ---------------------------------------------------------------------------

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
