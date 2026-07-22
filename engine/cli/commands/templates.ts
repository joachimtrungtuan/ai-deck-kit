import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { bumpVersion, createTemplate, getTemplate, registerTemplate, validateTemplateManifest } from "../lib/templates.ts";
import { readJson, writeJson } from "../lib/fs.ts";
import { findWorkspace } from "../lib/workspace.ts";

export const templateHelp = `Template commands:
  template new <name>              Scaffold a user .template bundle
  template register <name>         Validate and install a user template
  template list                    List installed engine templates
  template version <name> [--bump <part>]  Read or bump template semver`;

export function runTemplates(args: string[]): void {
  if (!args.length || args.includes("--help")) return console.log(templateHelp);
  const workspace = findWorkspace();
  const action = args[0];
  const name = args[1];
  if (action === "list") return listTemplates(workspace);
  if (!name) throw new Error(`Usage: aideck template ${action} <name>`);
  if (action === "new") return console.log(`Created template: ${createTemplate(workspace, name)}`);
  if (action === "register") return console.log(`Registered template: ${registerTemplate(workspace, name)}`);
  if (action === "version") return versionTemplate(workspace, name, args);
  throw new Error(`Unknown template command: ${action}`);
}

function listTemplates(workspace: ReturnType<typeof findWorkspace>): void {
  const root = join(workspace.engineRoot, "templates");
  const names = existsSync(root) ? readdirSync(root).filter((entry) => existsSync(join(root, entry, "template-manifest.json"))).sort() : [];
  if (!names.length) return console.log("No installed templates.");
  names.forEach((name) => {
    const manifest = readJson<{ displayName: string; templateVersion: string }>(join(root, name, "template-manifest.json"));
    console.log(`${name}\t${manifest.templateVersion}\t${manifest.displayName}`);
  });
}

function versionTemplate(workspace: ReturnType<typeof findWorkspace>, name: string, args: string[]): void {
  const template = getTemplate(workspace, name);
  const errors = validateTemplateManifest(template.manifest);
  if (errors.length) throw new Error(`Template validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  const bumpIndex = args.indexOf("--bump");
  if (bumpIndex === -1) return console.log(`${name}: ${template.manifest.templateVersion}`);
  const part = args[bumpIndex + 1];
  template.manifest.templateVersion = bumpVersion(template.manifest.templateVersion, part);
  writeJson(join(template.root, "template-manifest.json"), template.manifest);
  console.log(`${name}: ${template.manifest.templateVersion}`);
}
