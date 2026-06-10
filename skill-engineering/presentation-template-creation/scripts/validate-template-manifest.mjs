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

if (manifest.runtime && !Array.isArray(manifest.runtime)) {
  errors.push("runtime must be an array.");
}

if (manifest.supportedSlideTypes && !Array.isArray(manifest.supportedSlideTypes)) {
  errors.push("supportedSlideTypes must be an array.");
}

if (Array.isArray(manifest.supportedSlideTypes) && manifest.supportedSlideTypes.length === 0) {
  errors.push("supportedSlideTypes must include at least one slide type.");
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
