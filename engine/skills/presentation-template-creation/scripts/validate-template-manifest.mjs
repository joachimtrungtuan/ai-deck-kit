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
  "supportedAnimations",
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

const elementAnimations = new Set(["none", "fade", "gentle-rise", "soft-scale", "masked-reveal", "staggered-list", "image-drift", "line-draw", "spotlight", "morph"]);
if (!Array.isArray(manifest.supportedAnimations) || manifest.supportedAnimations.length === 0) {
  errors.push("supportedAnimations must include at least one animation.");
} else {
  const invalid = manifest.supportedAnimations.filter((animation) => typeof animation !== "string" || !elementAnimations.has(animation));
  if (invalid.length) errors.push(`supportedAnimations contains unsupported animation(s): ${invalid.join(", ")}.`);
  if (new Set(manifest.supportedAnimations).size !== manifest.supportedAnimations.length) errors.push("supportedAnimations must not contain duplicates.");
  if (!manifest.supportedAnimations.includes(manifest.defaultAnimation)) errors.push("defaultAnimation must be declared in supportedAnimations.");
}

if (manifest.fonts !== undefined && (!Array.isArray(manifest.fonts) || manifest.fonts.some((family) => typeof family !== "string"))) {
  errors.push("fonts must be an array of font family keys from the engine's font catalog.");
}

// Preview fixtures live beside the manifest so a template never edits the engine to add one.
const previewPropsPath = path.join(path.dirname(file), "preview-props.json");
if (fs.existsSync(previewPropsPath)) {
  const previewProps = readJson(previewPropsPath);
  if (!previewProps || typeof previewProps !== "object" || Array.isArray(previewProps)) {
    errors.push("preview-props.json must be a JSON object keyed by prop name.");
  }
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
