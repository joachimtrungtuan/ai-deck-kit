import { join } from "node:path";
import { bumpVersion, createTemplate, listTemplates, resolveTemplate } from "../lib/templates.js";
import { writeJson } from "../lib/fs.js";
import { writeTemplateSchemaGuidance } from "../lib/schema-guidance.js";
import { findWorkspace } from "../lib/workspace.js";
export const templateHelp = `Template commands:
  template new <name>              Scaffold a template bundle in ./templates
  template validate <name>         Check a template bundle without rendering it
  template list                    List every template this project can use
  template version <name> [--bump <part>]  Read or bump template semver`;
export function runTemplates(args) {
    if (!args.length || args.includes("--help"))
        return console.log(templateHelp);
    const workspace = findWorkspace();
    const action = args[0];
    const name = args[1];
    if (action === "list")
        return listCommand(workspace);
    if (!name)
        throw new Error(`Usage: aideck template ${action} <name>`);
    if (action === "new")
        return console.log(`Created template: ${createTemplate(workspace, name)}`);
    if (action === "validate")
        return validateCommand(workspace, name);
    if (action === "version")
        return versionTemplate(workspace, name, args);
    throw new Error(`Unknown template command: ${action}`);
}
function listCommand(workspace) {
    const templates = listTemplates(workspace);
    if (!templates.length)
        return console.log("No templates found.");
    templates.forEach((template) => {
        const note = template.overridesShipped ? "\toverrides shipped" : "";
        console.log(`${template.name}\t${template.manifest.templateVersion}\t${template.origin}\t${template.manifest.displayName}${note}`);
    });
}
function validateCommand(workspace, name) {
    const template = resolveTemplate(workspace, name);
    if (template.manifest.name !== name)
        throw new Error(`Template manifest name "${template.manifest.name}" does not match "${name}".`);
    console.log(`Template "${name}" is valid (${template.origin}): ${template.root}`);
}
function versionTemplate(workspace, name, args) {
    const template = resolveTemplate(workspace, name);
    const bumpIndex = args.indexOf("--bump");
    if (bumpIndex === -1)
        return console.log(`${name}: ${template.manifest.templateVersion}`);
    if (template.origin === "shipped") {
        throw new Error(`Template "${name}" is a shipped default and cannot be edited. Copy it into ${join(workspace.root, "templates")} first.`);
    }
    const part = args[bumpIndex + 1];
    template.manifest.templateVersion = bumpVersion(template.manifest.templateVersion, part);
    writeJson(join(template.root, "template-manifest.json"), template.manifest);
    writeTemplateSchemaGuidance(template.root, template.manifest);
    console.log(`${name}: ${template.manifest.templateVersion}`);
}
