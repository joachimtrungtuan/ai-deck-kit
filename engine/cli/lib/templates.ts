import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { copyTree, readJson, writeJson, writeText } from "./fs.ts";
import type { Workspace } from "./types.ts";

export type TemplateManifest = {
  name: string;
  displayName: string;
  templateVersion: string;
  contentSchemaVersion: string;
  slideTypeCatalog: string;
  blockCatalog?: string;
  runtime: string[];
  iconFamily: string;
  defaultAnimation: string;
  supportedSlideTypes: string[];
  [key: string]: unknown;
};

export function templateManifestPath(workspace: Workspace, name: string): string {
  assertTemplateName(name);
  return join(workspace.engineRoot, "templates", name, "template-manifest.json");
}

export function getTemplate(workspace: Workspace, name: string): { root: string; manifest: TemplateManifest } {
  const manifestPath = templateManifestPath(workspace, name);
  if (!existsSync(manifestPath)) throw new Error(`Template "${name}" is not installed in ${workspace.engineRoot}/templates.`);
  const manifest = readJson<TemplateManifest>(manifestPath);
  return { root: resolve(manifestPath, ".."), manifest };
}

export function validateTemplateManifest(manifest: TemplateManifest): string[] {
  const errors: string[] = [];
  for (const field of ["name", "displayName", "templateVersion", "contentSchemaVersion", "slideTypeCatalog", "runtime", "iconFamily", "defaultAnimation", "supportedSlideTypes"] as const) {
    if (manifest[field] === undefined || manifest[field] === "") errors.push(`Missing manifest field: ${field}`);
  }
  if (manifest.name && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.name)) errors.push("name must be kebab-case.");
  if (!Array.isArray(manifest.runtime)) errors.push("runtime must be an array.");
  if (!Array.isArray(manifest.supportedSlideTypes) || manifest.supportedSlideTypes.length === 0) errors.push("supportedSlideTypes must include at least one slide type.");
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
  writeText(join(target, "design-system.css"), "/* Add template design tokens here. */\n");
  writeText(join(target, "animation-presets.css"), "/* Add approved animation overrides here. */\n");
  writeText(join(target, "icon-policy.md"), "# Icon policy\n\nUse the Phosphor icon family.\n");
  writeJson(join(target, "layouts", "layout-index.json"), { version: "1.0.0", layouts: {} });
  return target;
}

export function registerTemplate(workspace: Workspace, name: string): string {
  assertTemplateName(name);
  const source = join(workspace.root, "templates", `${name}.template`);
  const manifest = readJson<TemplateManifest>(join(source, "template-manifest.json"));
  const errors = validateTemplateManifest(manifest);
  if (errors.length) throw new Error(`Template validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  const target = join(workspace.engineRoot, "templates", name);
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
