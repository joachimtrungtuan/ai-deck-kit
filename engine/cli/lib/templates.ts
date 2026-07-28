import { existsSync, mkdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { copyTree, readJson, writeJson, writeText } from "./fs.ts";
import type { Workspace } from "./types.ts";

export type TemplateManifest = {
  name: string;
  displayName: string;
  deckClass?: string;
  templateVersion: string;
  contentSchemaVersion: string;
  slideTypeCatalog: string;
  blockCatalog?: string;
  runtime: string[];
  iconFamily: string;
  defaultAnimation: string;
  supportedSlideTypes: string[];
  layoutVariants?: Record<string, string[]>;
  backgroundVariants?: string[];
  [key: string]: unknown;
};

export function templateManifestPath(workspace: Workspace, name: string): string {
  assertTemplateName(name);
  return join(workspace.engineRoot, "templates", `${name}.template`, "template-manifest.json");
}

export function getTemplate(workspace: Workspace, name: string): { root: string; manifest: TemplateManifest } {
  const manifestPath = templateManifestPath(workspace, name);
  if (!existsSync(manifestPath)) throw new Error(`Template "${name}" is not installed in ${workspace.engineRoot}/templates.`);
  const manifest = readJson<TemplateManifest>(manifestPath);
  return { root: resolve(manifestPath, ".."), manifest };
}

export function getPreviewTemplate(workspace: Workspace, name: string): { root: string; manifest: TemplateManifest } {
  assertTemplateName(name);
  const draftRoot = join(workspace.root, "templates", `${name}.template`);
  const installedRoot = join(workspace.engineRoot, "templates", `${name}.template`);
  const root = existsSync(join(draftRoot, "template-manifest.json")) ? draftRoot : installedRoot;
  const manifestPath = join(root, "template-manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Template "${name}" was not found as a draft or installed template.`);
  }
  const manifest = readJson<TemplateManifest>(manifestPath);
  const errors = validateTemplateBundle(root, manifest);
  if (errors.length) throw new Error(`Template validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  return { root, manifest };
}

export function validateTemplateBundle(root: string, manifest = readJson<TemplateManifest>(join(root, "template-manifest.json"))): string[] {
  const errors = validateTemplateManifest(manifest);
  const layoutIndexPath = join(root, "layouts", "layout-index.json");
  if (!existsSync(layoutIndexPath)) errors.push("Missing layouts/layout-index.json.");
  else {
    const rawIndex = readJson<Record<string, { component?: string; source?: string }> & { layouts?: Record<string, { component?: string; source?: string }> }>(layoutIndexPath);
    const layouts = rawIndex.layouts ?? rawIndex;
    for (const type of manifest.supportedSlideTypes ?? []) {
      const layout = layouts[type];
      if (!layout?.component || !layout?.source) {
        errors.push(`Missing layout index entry for supported slide type: ${type}`);
        continue;
      }
      const layoutsRoot = resolve(root, "layouts");
      const source = resolve(layoutsRoot, layout.source);
      if (!isWithin(layoutsRoot, source)) errors.push(`Layout source for ${type} must stay inside layouts/: ${layout.source}`);
      else if (!existsSync(source)) errors.push(`Missing layout source for ${type}: ${layout.source}`);
    }
  }
  if (!existsSync(join(root, "design-system.css"))) errors.push("Missing design-system.css.");
  if (!existsSync(join(root, "animation-presets.css"))) errors.push("Missing animation-presets.css.");
  if (!existsSync(join(root, "icon-policy.md"))) errors.push("Missing icon-policy.md.");
  return errors;
}

export function validateTemplateManifest(manifest: TemplateManifest): string[] {
  const errors: string[] = [];
  for (const field of ["name", "displayName", "templateVersion", "contentSchemaVersion", "slideTypeCatalog", "runtime", "iconFamily", "defaultAnimation", "supportedSlideTypes"] as const) {
    if (manifest[field] === undefined || manifest[field] === "") errors.push(`Missing manifest field: ${field}`);
  }
  if (manifest.name && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.name)) errors.push("name must be kebab-case.");
  if (manifest.deckClass && !/^[a-z][a-z0-9-]*$/.test(manifest.deckClass)) errors.push("deckClass must be a CSS-safe kebab-case class name.");
  if (!Array.isArray(manifest.runtime)) errors.push("runtime must be an array.");
  if (!Array.isArray(manifest.supportedSlideTypes) || manifest.supportedSlideTypes.length === 0) errors.push("supportedSlideTypes must include at least one slide type.");
  if (manifest.layoutVariants !== undefined) {
    if (!manifest.layoutVariants || Array.isArray(manifest.layoutVariants) || typeof manifest.layoutVariants !== "object") {
      errors.push("layoutVariants must be an object keyed by supported slide type.");
    } else {
      const supported = new Set(manifest.supportedSlideTypes ?? []);
      for (const type of supported) {
        const variants = manifest.layoutVariants[type];
        if (!Array.isArray(variants) || variants.length === 0) errors.push(`layoutVariants.${type} must include at least one variant.`);
        else if (new Set(variants).size !== variants.length) errors.push(`layoutVariants.${type} must not contain duplicates.`);
      }
      for (const type of Object.keys(manifest.layoutVariants)) {
        if (!supported.has(type)) errors.push(`layoutVariants declares unsupported slide type: ${type}`);
      }
    }
  }
  if (manifest.backgroundVariants !== undefined) {
    if (!Array.isArray(manifest.backgroundVariants) || manifest.backgroundVariants.length === 0) errors.push("backgroundVariants must include at least one variant.");
    else if (new Set(manifest.backgroundVariants).size !== manifest.backgroundVariants.length) errors.push("backgroundVariants must not contain duplicates.");
  }
  return errors;
}

export function createTemplate(workspace: Workspace, name: string): string {
  assertTemplateName(name);
  const target = join(workspace.root, "templates", `${name}.template`);
  if (existsSync(target)) throw new Error(`Template already exists: ${target}`);
  mkdirSync(join(target, "layouts"), { recursive: true });
  const manifest: TemplateManifest = {
    name,
    displayName: name.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    deckClass: `${name}-deck`,
    templateVersion: "1.0.0",
    contentSchemaVersion: "1.0.0",
    slideTypeCatalog: "v1",
    blockCatalog: "v1",
    runtime: ["react", "static-html"],
    iconFamily: "phosphor-react",
    defaultAnimation: "gentle-rise",
    supportedSlideTypes: ["title", "section-divider", "closing", "text-statement"],
  };
  writeJson(join(target, "template-manifest.json"), manifest);
  writeText(join(target, "design-system.css"), `.${name}-deck {\n  /* Add template design tokens here. */\n}\n`);
  writeText(join(target, "animation-presets.css"), "/* Add approved animation overrides here. */\n");
  writeText(join(target, "icon-policy.md"), "# Icon policy\n\nUse the Phosphor icon family.\n");
  writeJson(join(target, "layouts", "layout-index.json"), { version: "1.0.0", layouts: {} });
  return target;
}

export function registerTemplate(workspace: Workspace, name: string): string {
  assertTemplateName(name);
  const source = join(workspace.root, "templates", `${name}.template`);
  const manifest = readJson<TemplateManifest>(join(source, "template-manifest.json"));
  const errors = validateTemplateBundle(source, manifest);
  if (errors.length) throw new Error(`Template validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  if (manifest.name !== name) throw new Error(`Template manifest name "${manifest.name}" does not match "${name}".`);
  const target = join(workspace.engineRoot, "templates", `${name}.template`);
  if (existsSync(target)) throw new Error(`Template already installed: ${target}`);
  copyTree(source, target);
  return target;
}

export function bumpVersion(version: string, part: string): string {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match || !["major", "minor", "patch"].includes(part)) throw new Error("Use a semver version and --bump major|minor|patch.");
  const values = match.slice(1).map(Number);
  const index = ["major", "minor", "patch"].indexOf(part);
  values[index] += 1;
  for (let i = index + 1; i < values.length; i += 1) values[i] = 0;
  return values.join(".");
}

function assertTemplateName(name: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new Error(`Invalid template name "${name}". Use kebab-case.`);
}

function isWithin(root: string, file: string): boolean {
  const path = relative(root, file);
  return path === "" || (!path.startsWith("..") && !path.startsWith("/"));
}
