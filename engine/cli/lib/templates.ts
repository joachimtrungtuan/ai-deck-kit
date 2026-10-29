import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { readJson, writeJson, writeText } from "./fs.ts";
import { fontCatalogNames, unknownFontFamilies } from "./font-catalog.ts";
import { writeTemplateSchemaGuidance } from "./schema-guidance.ts";
import type { Workspace } from "./types.ts";

/** Where a template bundle came from. Project templates are the user's and always win. */
export type TemplateOrigin = "project" | "shipped";

export type ResolvedTemplate = { root: string; manifest: TemplateManifest; origin: TemplateOrigin };

export type TemplateListing = ResolvedTemplate & { name: string; overridesShipped: boolean };

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
  supportedAnimations: string[];
  defaultTransition?: string;
  fonts?: string[];
  supportedSlideTypes: string[];
  layoutVariants?: Record<string, string[]>;
  backgroundVariants?: string[];
  [key: string]: unknown;
};

/**
 * Every element animation the engine implements as `primitive-anim-*` CSS. The engine owns all of
 * them and resolves motion through literal fallbacks, so this is the coverage any bundle gets.
 */
export const elementAnimationCatalogV1 = ["none", "fade", "gentle-rise", "soft-scale", "masked-reveal", "staggered-list", "image-drift", "line-draw", "spotlight", "morph"];

/**
 * `supportedAnimations` postdates the bundles already in the wild. Such a template never declared
 * coverage, but the engine animates it all the same, so treat the absent field as "all of them"
 * rather than refusing to load the bundle. New templates still declare it: the scaffold seeds the
 * field and the template-authoring validator requires it.
 */
function withDeclaredAnimations(manifest: TemplateManifest): TemplateManifest {
  if (manifest.supportedAnimations !== undefined) return manifest;
  return { ...manifest, supportedAnimations: [...elementAnimationCatalogV1] };
}

/** User-authored templates. The only place a template is ever edited. */
export function projectTemplatesRoot(workspace: Workspace): string {
  return join(workspace.root, "templates");
}

/** Defaults shipped with the engine. Read-only; replaced wholesale on upgrade. */
export function shippedTemplatesRoot(workspace: Workspace): string {
  return join(workspace.engineRoot, "templates");
}

/**
 * Locate a template without validating it. Project templates take precedence over shipped
 * defaults of the same name — that is the supported way to customise a default.
 */
export function findTemplate(workspace: Workspace, name: string): ResolvedTemplate | undefined {
  assertTemplateName(name);
  const candidates: [TemplateOrigin, string][] = [
    ["project", join(projectTemplatesRoot(workspace), `${name}.template`)],
    ["shipped", join(shippedTemplatesRoot(workspace), `${name}.template`)],
  ];
  for (const [origin, root] of candidates) {
    const manifestPath = join(root, "template-manifest.json");
    if (existsSync(manifestPath)) return { root, manifest: withDeclaredAnimations(readJson<TemplateManifest>(manifestPath)), origin };
  }
  return undefined;
}

/** Locate and validate a template. Every command that renders or copies a bundle goes through here. */
export function resolveTemplate(workspace: Workspace, name: string): ResolvedTemplate {
  const found = findTemplate(workspace, name);
  if (!found) {
    const available = listTemplates(workspace).map((entry) => entry.name);
    const hint = available.length ? ` Available: ${available.join(", ")}.` : "";
    throw new Error(`Template "${name}" was not found in ${projectTemplatesRoot(workspace)} or ${shippedTemplatesRoot(workspace)}.${hint}`);
  }
  const errors = validateTemplateBundle(found.root, found.manifest);
  if (errors.length) throw new Error(`Template "${name}" failed validation (${found.root}):\n${errors.map((error) => `- ${error}`).join("\n")}`);
  return found;
}

/** Every template usable in this workspace, one row per name, project entries shadowing shipped ones. */
export function listTemplates(workspace: Workspace): TemplateListing[] {
  const shipped = new Set(templateNamesIn(shippedTemplatesRoot(workspace)));
  const names = new Set([...templateNamesIn(projectTemplatesRoot(workspace)), ...shipped]);
  return [...names].sort().flatMap((name) => {
    const found = findTemplate(workspace, name);
    return found ? [{ ...found, name, overridesShipped: found.origin === "project" && shipped.has(name) }] : [];
  });
}

function templateNamesIn(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((entry) => entry.endsWith(".template") && existsSync(join(root, entry, "template-manifest.json")))
    .map((entry) => entry.slice(0, -".template".length));
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
  if (!existsSync(join(root, "icon-policy.md"))) errors.push("Missing icon-policy.md.");
  errors.push(...validatePreviewProps(root));
  errors.push(...validateMotionTokens(root));
  return errors;
}

/**
 * `preview-props.json` is optional and holds only the fixtures a template's own preview needs.
 * It is checked here because a malformed one breaks the gallery, which silently drops broken bundles.
 */
export function validatePreviewProps(root: string): string[] {
  const path = join(root, "preview-props.json");
  if (!existsSync(path)) return [];
  const declared = readJson<unknown>(path);
  if (!declared || typeof declared !== "object" || Array.isArray(declared)) return ["preview-props.json must be a JSON object keyed by prop name."];
  return [];
}

/**
 * The engine's element animations read --deck-motion-base and --deck-motion-ease through literal
 * fallbacks, so a bundle defining neither still animates and is not a load failure. What does break
 * is a bridge that points at a token nothing defines: that makes the whole `animation` declaration
 * invalid at computed-value time, so every animation degrades to none while the manifest still
 * advertises them. That failure is invisible in a manifest check, so it is caught here against the
 * bundle's own CSS. The template-authoring validator additionally asks authors to define the tokens.
 *
 * This is a textual check, not a cascade one: a token defined under a selector the deck never
 * matches, or inside an at-rule such as @media print, still reads as defined here.
 */
export function validateMotionTokens(root: string): string[] {
  if (!existsSync(join(root, "design-system.css"))) return [];
  const css = readdirSync(root, { recursive: true })
    .filter((entry): entry is string => typeof entry === "string" && entry.endsWith(".css"))
    .map((entry) => readFileSync(join(root, entry), "utf8"))
    .join("\n");
  const errors: string[] = [];
  const defined = new Set(Array.from(css.matchAll(/(--[a-z0-9-]+)\s*:/gi), (match) => match[1]));
  for (const [, token, value] of css.matchAll(/(--deck-motion-[a-z-]+)\s*:\s*([^;}]+)/gi)) {
    const references = Array.from(value.matchAll(/var\(\s*(--[a-z0-9-]+)\s*(,\s*var\(|,|\))/gi));
    if (references.length === 0) continue;
    // A defined token anywhere in the chain resolves the declaration, and so does a literal
    // fallback. var(--a, var(--b)) only ever reaches --b when --a is undefined, so a dangling --b
    // behind a defined --a is not a defect.
    if (references.some(([, referenced]) => defined.has(referenced))) continue;
    if (references.some(([, , tail]) => tail.startsWith(",") && !tail.includes("var("))) continue;
    const missing = Array.from(new Set(references.map(([, referenced]) => referenced)));
    errors.push(`${token} references ${missing.join(", ")}, which no CSS in this template defines.`);
  }
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
  if (manifest.fonts !== undefined) {
    if (!Array.isArray(manifest.fonts) || manifest.fonts.some((family) => typeof family !== "string")) errors.push("fonts must be an array of font family keys.");
    else {
      const unknown = unknownFontFamilies(manifest.fonts);
      if (unknown.length) errors.push(`fonts names families the engine does not ship: ${unknown.join(", ")}. Available: ${fontCatalogNames().join(", ")}.`);
    }
  }
  if (!Array.isArray(manifest.supportedSlideTypes) || manifest.supportedSlideTypes.length === 0) errors.push("supportedSlideTypes must include at least one slide type.");
  if (manifest.supportedAnimations !== undefined && (!Array.isArray(manifest.supportedAnimations) || manifest.supportedAnimations.length === 0)) errors.push("supportedAnimations must include at least one animation.");
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
    contentSchemaVersion: "3.2.0",
    slideTypeCatalog: "v2",
    blockCatalog: "v1",
    runtime: ["react", "static-html"],
    iconFamily: "phosphor-react",
    defaultAnimation: "gentle-rise",
    supportedAnimations: [...elementAnimationCatalogV1],
    defaultTransition: "none",
    fonts: ["inter", "jetbrains-mono"],
    supportedSlideTypes: ["title", "section-divider", "closing", "text-statement"],
  };
  writeJson(join(target, "template-manifest.json"), manifest);
  // The motion tokens are seeded because the manifest above advertises every element animation:
  // a bundle that declares them without defining these renders no motion at all.
  writeText(join(target, "design-system.css"), `.${name}-deck {\n  /* Add template design tokens here. */\n\n  /* Motion — the engine reads these three tokens and nothing else. Tune the values;\n     never ship template-side animation CSS. */\n  --deck-motion-ease: cubic-bezier(0.22, 1, 0.36, 1);\n  --deck-motion-base: 480ms;\n  --deck-motion-slow: 760ms;\n}\n`);
  writeText(join(target, "icon-policy.md"), "# Icon policy\n\nUse the Phosphor icon family.\n");
  writeTemplateSchemaGuidance(target, manifest);
  // Fixtures this template's preview slides need beyond the engine defaults. Adding a key here is
  // how a new layout gets preview content — never by editing the engine.
  writeJson(join(target, "preview-props.json"), {});
  writeJson(join(target, "layouts", "layout-index.json"), { version: "1.0.0", layouts: {} });
  return target;
}

/**
 * Names the engine ships. Anything else sitting in the engine's template folder was put there by the
 * retired `template register` command and belongs to the user.
 */
export function shippedTemplateNames(engineRoot: string): string[] {
  const versionPath = join(engineRoot, "engine.version.json");
  if (!existsSync(versionPath)) return [];
  return readJson<{ shippedTemplates?: string[] }>(versionPath).shippedTemplates ?? [];
}

/**
 * One-time bridge for workspaces created before user templates moved out of the engine. Relocates
 * every non-shipped bundle in the engine's template folder into the project's own. Idempotent.
 */
export function migrateLegacyRegisteredTemplates(workspace: Workspace, engineRoot = workspace.engineRoot): string[] {
  const shipped = new Set(shippedTemplateNames(engineRoot));
  if (!shipped.size) return [];
  const moved: string[] = [];
  for (const name of templateNamesIn(shippedTemplatesRoot(workspace))) {
    if (shipped.has(name)) continue;
    const source = join(shippedTemplatesRoot(workspace), `${name}.template`);
    const target = join(projectTemplatesRoot(workspace), `${name}.template`);
    if (existsSync(target)) continue; // The project copy already wins; leave the stale engine copy to the upgrade.
    mkdirSync(projectTemplatesRoot(workspace), { recursive: true });
    renameSync(source, target);
    moved.push(name);
  }
  return moved;
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
