#!/usr/bin/env node
// Migrate a legacy working-files-era deck (content/<slug>.slides.md + source/ + export/) into the
// canonical .deck bundle layout: deck.json + content.md + assets/ + .build/{source,export}.
// See docs/deck-format-spec.md section 7 ("Migration from current layout").
//
// Usage:
//   node engine/skills/presentation-crafting/scripts/migrate-slides-to-deck.mjs --deck <slug>
//
//   --deck   Deck folder name under decks/ (without .deck suffix).

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "../../../..");
const decksDir = resolve(projectRoot, "decks");

const KNOWN_FRONTMATTER_FIELDS = [
  "title",
  "slug",
  "audience",
  "goal",
  "template_set",
  "template_version",
  "slide_type_catalog",
  "output_mode",
  "status",
];

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function extractFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;
  return { block: match[1], raw: match[0] };
}

function parseFrontmatterFields(block) {
  const fields = {};
  for (const line of block.split("\n")) {
    const match = line.match(/^([a-z_]+)\s*:\s*(.+)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    fields[key] = rawValue.trim().replace(/^"(.*)"$/, "$1");
  }
  return fields;
}

function extractYamlField(yaml, field) {
  const match = yaml.match(new RegExp(`^${field}\\s*:\\s*"?([^"\\n]+)"?\\s*$`, "m"));
  return match ? match[1].trim() : undefined;
}

const slug = getArg("deck");
if (!slug) {
  fail("--deck <slug> is required (matches a decks/<slug>.deck folder).");
}

const deckDir = resolve(decksDir, `${slug}.deck`);
const oldContentDir = resolve(deckDir, "content");
const oldContentFile = resolve(oldContentDir, `${slug}.slides.md`);

if (!existsSync(oldContentFile)) {
  fail(`Legacy content file not found: ${oldContentFile}`);
}

const source = readFileSync(oldContentFile, "utf8");
const frontmatter = extractFrontmatter(source);
if (!frontmatter) {
  fail(`No frontmatter block found in ${oldContentFile}`);
}

const fields = parseFrontmatterFields(frontmatter.block);
const unmapped = Object.keys(fields).filter((key) => !KNOWN_FRONTMATTER_FIELDS.includes(key));
if (unmapped.length) {
  console.warn(`Warning: unmapped frontmatter fields (not carried into deck.json): ${unmapped.join(", ")}`);
}

for (const field of KNOWN_FRONTMATTER_FIELDS) {
  if (!fields[field]) {
    fail(`Legacy frontmatter is missing required field: ${field}`);
  }
}

const body = source.slice(frontmatter.raw.length);

const slideMatches = [...body.matchAll(/^## Slide\s+(\d+):\s+(.+)$/gm)];
if (slideMatches.length === 0) {
  fail("No '## Slide NN: Title' sections found in legacy content.");
}

const slides = slideMatches.map((match, index) => {
  const start = match.index;
  const end = index + 1 < slideMatches.length ? slideMatches[index + 1].index : body.length;
  const block = body.slice(start, end);
  const yamlMatch = block.match(/```ya?ml\n([\s\S]*?)\n```/);
  if (!yamlMatch) {
    fail(`Slide ${match[1]} is missing its metadata YAML fence.`);
  }
  const id = extractYamlField(yamlMatch[1], "id");
  const type = extractYamlField(yamlMatch[1], "type");
  if (!id || !type) {
    fail(`Slide ${match[1]}: could not read id/type from metadata.`);
  }
  return { id, type, file: `content.md#${id}` };
});

const manifest = {
  schema: "ai-deck-kit/deck@1.0.0",
  title: fields.title,
  slug: fields.slug,
  audience: fields.audience,
  goal: fields.goal,
  template: { set: fields.template_set, version: fields.template_version },
  slideTypeCatalog: fields.slide_type_catalog,
  blockCatalog: "v1",
  contentSchemaVersion: "1.0.0",
  outputMode: fields.output_mode,
  status: fields.status,
  defaults: { animation: "gentle-rise", transition: "none" },
  slides,
};

writeFileSync(resolve(deckDir, "deck.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
writeFileSync(resolve(deckDir, "content.md"), body.replace(/^\n+/, ""), "utf8");

const remainingOldFiles = readdirSync(oldContentDir).filter((name) => name !== `${slug}.slides.md`);
if (remainingOldFiles.length) {
  fail(`Refusing to remove ${oldContentDir}: unexpected extra files present: ${remainingOldFiles.join(", ")}`);
}
rmSync(oldContentDir, { recursive: true, force: true });

const buildDir = resolve(deckDir, ".build");
mkdirSync(buildDir, { recursive: true });
for (const legacyDir of ["source", "export"]) {
  const from = resolve(deckDir, legacyDir);
  if (existsSync(from)) {
    renameSync(from, resolve(buildDir, legacyDir));
  }
}

console.log(`Migrated ${slug} to .deck bundle layout:`);
console.log(`  ${deckDir}/deck.json`);
console.log(`  ${deckDir}/content.md`);
console.log(`  ${deckDir}/.build/{source,export}`);
console.log(`  ${slides.length} slides registered.`);
