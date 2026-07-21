#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = process.argv[2];

if (!file) {
  fail("Usage: validate-slide-content.mjs <content-file>");
}

const source = readFile(file);
const errors = [];

const frontmatter = extractFrontmatter(source);
if (!frontmatter) {
  errors.push("Missing YAML frontmatter block.");
} else {
  for (const field of [
    "title",
    "slug",
    "audience",
    "goal",
    "template_set",
    "template_version",
    "slide_type_catalog",
    "output_mode",
    "status",
  ]) {
    if (!hasYamlField(frontmatter, field)) {
      errors.push(`Missing frontmatter field: ${field}`);
    }
  }
}

const slideMatches = [...source.matchAll(/^## Slide\s+(\d+):\s+(.+)$/gm)];
if (slideMatches.length === 0) {
  errors.push("No slide sections found. Expected headings like: ## Slide 01: Title");
}

slideMatches.forEach((match, index) => {
  const start = match.index;
  const end = index + 1 < slideMatches.length ? slideMatches[index + 1].index : source.length;
  const block = source.slice(start, end);
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

if (errors.length) {
  console.error("Slide content validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Slide content is valid: ${path.relative(process.cwd(), file)}`);

function readFile(target) {
  try {
    return fs.readFileSync(target, "utf8");
  } catch (error) {
    fail(`Could not read file: ${target}\n${error.message}`);
  }
}

function extractFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
}

function extractFirstYamlFence(text) {
  const match = text.match(/```ya?ml\n([\s\S]*?)\n```/);
  return match ? match[1] : null;
}

function hasYamlField(yaml, field) {
  const pattern = new RegExp(`^${escapeRegExp(field)}\\s*:`, "m");
  return pattern.test(yaml);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
