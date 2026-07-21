#!/usr/bin/env node
// Validate a .deck bundle: deck.json manifest + content.md, per docs/deck-format-spec.md section 6.
import fs from "node:fs";
import path from "node:path";

const deckDir = process.argv[2];

if (!deckDir) {
  fail("Usage: validate-slide-content.mjs <deck-dir>");
}

const manifestPath = path.join(deckDir, "deck.json");
const contentPath = path.join(deckDir, "content.md");

const manifest = readJson(manifestPath);
const content = readFile(contentPath);
const errors = [];

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

if (manifest.template?.set) {
  const templateManifestPath = path.resolve(
    deckDir,
    "..",
    "..",
    "engine",
    "templates",
    manifest.template.set,
    "template-manifest.json",
  );
  if (!fs.existsSync(templateManifestPath)) {
    errors.push(`deck.json: template.set "${manifest.template.set}" has no installed template-manifest.json.`);
  }
}

const manifestSlides = Array.isArray(manifest.slides) ? manifest.slides : [];
const manifestIds = new Set(manifestSlides.map((slide) => slide.id));

const slideMatches = [...content.matchAll(/^## Slide\s+(\d+):\s+(.+)$/gm)];
if (slideMatches.length === 0) {
  errors.push("content.md: no slide sections found. Expected headings like: ## Slide 01: Title");
}

const contentIds = new Set();

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
  if (id) {
    contentIds.add(id);
    if (!manifestIds.has(id)) {
      errors.push(`${label}: id "${id}" has no matching entry in deck.json slides[].`);
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
  if (blocksSection) {
    for (const blockType of extractBlockTypes(blocksSection)) {
      if (!manifest.blockCatalog) {
        errors.push(`${label}: declares blocks but deck.json has no blockCatalog.`);
      }
    }
  }

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

function extractBlockTypes(blocksYaml) {
  return [...blocksYaml.matchAll(/type:\s*"?([a-z0-9-]+)"?/g)].map((m) => m[1]);
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
