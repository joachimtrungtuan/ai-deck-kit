#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = process.argv[2];

if (!file) {
  fail("Usage: validate-template-manifest.mjs <template-manifest.json>");
}

const manifest = readJson(file);
const errors = [];

for (const field of [
  "name",
  "displayName",
  "templateVersion",
  "contentSchemaVersion",
  "slideTypeCatalog",
  "runtime",
  "iconFamily",
  "defaultAnimation",
  "designTokens",
  "supportedSlideTypes",
]) {
  if (manifest[field] === undefined || manifest[field] === "") {
    errors.push(`Missing manifest field: ${field}`);
  }
}

if (manifest.name && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.name)) {
  errors.push("name must be kebab-case.");
}

if (manifest.deckClass && !/^[a-z][a-z0-9-]*$/.test(manifest.deckClass)) {
  errors.push("deckClass must be a CSS-safe kebab-case class name.");
}

if (manifest.runtime && !Array.isArray(manifest.runtime)) {
  errors.push("runtime must be an array.");
}

if (manifest.supportedSlideTypes && !Array.isArray(manifest.supportedSlideTypes)) {
  errors.push("supportedSlideTypes must be an array.");
}

if (Array.isArray(manifest.supportedSlideTypes) && manifest.supportedSlideTypes.length === 0) {
  errors.push("supportedSlideTypes must include at least one slide type.");
}

if (manifest.layoutVariants !== undefined) {
  if (!manifest.layoutVariants || Array.isArray(manifest.layoutVariants) || typeof manifest.layoutVariants !== "object") {
    errors.push("layoutVariants must be an object keyed by supported slide type.");
  } else {
    const supported = new Set(manifest.supportedSlideTypes ?? []);
    for (const type of supported) {
      const variants = manifest.layoutVariants[type];
      if (!Array.isArray(variants) || variants.length === 0) {
        errors.push(`layoutVariants.${type} must include at least one variant.`);
      } else if (new Set(variants).size !== variants.length) {
        errors.push(`layoutVariants.${type} must not contain duplicates.`);
      }
    }
    for (const type of Object.keys(manifest.layoutVariants)) {
      if (!supported.has(type)) errors.push(`layoutVariants declares unsupported slide type: ${type}`);
    }
  }
}

if (manifest.backgroundVariants !== undefined) {
  if (!Array.isArray(manifest.backgroundVariants) || manifest.backgroundVariants.length === 0) {
    errors.push("backgroundVariants must include at least one variant.");
  } else if (new Set(manifest.backgroundVariants).size !== manifest.backgroundVariants.length) {
    errors.push("backgroundVariants must not contain duplicates.");
  }
}

if (errors.length) {
  console.error("Template manifest validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Template manifest is valid: ${path.relative(process.cwd(), file)}`);

function readJson(target) {
  try {
    return JSON.parse(fs.readFileSync(target, "utf8"));
  } catch (error) {
    fail(`Could not read valid JSON: ${target}\n${error.message}`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
