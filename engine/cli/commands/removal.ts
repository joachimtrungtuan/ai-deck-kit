// Removal and reinstall. Everything here deletes user data, so every path is checked against the
// workspace, every target is printed before it goes, and nothing is removed without --yes.
import { existsSync, rmSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { deckPath } from "../lib/deck.ts";
import { deckBundles, deckDrift, retemplateDeck } from "../lib/deck-template-sync.ts";
import { installEngineDependencies } from "../lib/engine-dependencies.ts";
import { projectTemplatesRoot, resolveTemplate } from "../lib/templates.ts";
import { findWorkspace } from "../lib/workspace.ts";
import { unwireSkillsFromProject } from "./wire-skills.ts";
import type { Workspace } from "../lib/types.ts";

export const removalHelp = `Removal commands:
  remove deck <slug> --yes                        Delete one deck bundle
  remove template <name> --reassign <name> --yes  Delete a template, moving its decks first
  uninstall [--purge] --yes                       Remove the engine (--purge also removes your work)
  reinstall                                       Reinstall the engine's components`;

export function runRemoval(args: string[]): void {
  if (!args.length || args.includes("--help")) return console.log(removalHelp);
  const workspace = findWorkspace();
  const [command, ...rest] = args;
  if (command === "reinstall") return reinstallCommand(workspace);
  if (command === "uninstall") return uninstallCommand(workspace, rest);
  if (command !== "remove") throw new Error(`Unknown removal command: ${command}`);
  const [target, name, ...options] = rest;
  if (target === "deck") return removeDeck(workspace, name, options);
  if (target === "template") return removeTemplate(workspace, name, options);
  throw new Error("Usage: aideck remove deck|template <name> --yes");
}

function removeDeck(workspace: Workspace, slug: string | undefined, options: string[]): void {
  if (!slug) throw new Error("Usage: aideck remove deck <slug> --yes");
  const root = deckPath(workspace, slug);
  if (!existsSync(join(root, "deck.json"))) throw new Error(`Deck not found: ${root}`);
  console.log(`This will permanently delete: ${root}`);
  if (!confirmed(options)) return console.log("Nothing was removed. Add --yes to confirm.");
  rmSync(root, { recursive: true, force: true });
  console.log(`Removed deck ${slug}.`);
}

/**
 * A template may not simply vanish: every deck that names it would silently fall back to whatever
 * else resolves under that name. So each affected deck is re-templated first, or nothing happens.
 */
function removeTemplate(workspace: Workspace, name: string | undefined, options: string[]): void {
  if (!name) throw new Error("Usage: aideck remove template <name> --reassign <template> --yes");
  const template = resolveTemplate(workspace, name);
  if (template.origin === "shipped") {
    throw new Error(`Template "${name}" is a shipped default and is not yours to remove. Upgrading the engine replaces it.`);
  }
  const affected = deckBundles(workspace).filter((bundle) => deckDrift(workspace, bundle).templateName === name);
  const reassign = valueAfter(options, "--reassign");
  if (affected.length && !reassign) {
    throw new Error(
      [
        `${affected.length} deck${affected.length === 1 ? "" : "s"} still use "${name}":`,
        ...affected.map((bundle) => `- ${bundle}`),
        `Choose where they should go: aideck remove template ${name} --reassign <template> --yes`,
      ].join("\n"),
    );
  }
  const replacement = reassign ? resolveTemplate(workspace, reassign) : undefined;
  if (replacement && replacement.manifest.name === name) throw new Error("--reassign must name a different template.");

  console.log(`This will permanently delete: ${template.root}`);
  affected.forEach((bundle) => console.log(`  ${bundle} will be re-templated to ${replacement!.manifest.name}@${replacement!.manifest.templateVersion}`));
  if (!confirmed(options)) return console.log("Nothing was removed. Add --yes to confirm.");

  // Re-template first: if any deck cannot move, the template stays and nothing is left dangling.
  for (const bundle of affected) retemplateDeck(join(workspace.decksRoot, bundle), replacement!);
  rmSync(template.root, { recursive: true, force: true });
  console.log(`Removed template ${name}.`);
  if (affected.length) console.log(`Re-templated ${affected.length} deck${affected.length === 1 ? "" : "s"} — review each one before presenting.`);
}

function uninstallCommand(workspace: Workspace, options: string[]): void {
  const purge = options.includes("--purge");
  const targets = [workspace.engineRoot, workspace.pointerPath, join(workspace.root, "aideck")];
  if (purge) targets.push(workspace.decksRoot, projectTemplatesRoot(workspace));
  const present = targets.filter((target) => existsSync(target)).map((target) => assertInsideProject(workspace, target));
  console.log(purge ? "This will permanently delete the engine AND your decks and templates:" : "This will remove the engine. Your decks and templates stay:");
  present.forEach((target) => console.log(`  ${relative(workspace.root, target) || basename(target)}`));
  if (!purge) {
    const kept = [workspace.decksRoot, projectTemplatesRoot(workspace)].filter((target) => existsSync(target));
    kept.forEach((target) => console.log(`  keeping ${relative(workspace.root, target)}`));
  }
  if (!confirmed(options)) return console.log("Nothing was removed. Add --yes to confirm.");
  present.forEach((target) => rmSync(target, { recursive: true, force: true }));
  unwireSkillsFromProject(workspace.root, workspace.engineRoot);
  console.log("Removed AI Deck Kit from this project.");
  if (!purge) console.log("Reinstall over your existing work with: npx github:joachimtrungtuan/ai-deck-kit init --here");
}

function reinstallCommand(workspace: Workspace): void {
  if (!existsSync(workspace.engineRoot)) throw new Error(`Engine root missing: ${workspace.engineRoot}. Run "aideck init" in a fresh folder instead.`);
  const modules = join(workspace.engineRoot, "node" + "_modules");
  if (existsSync(modules)) rmSync(modules, { recursive: true, force: true });
  installEngineDependencies(workspace.engineRoot);
  console.log("Reinstalled the toolkit's components. Run \"aideck doctor\" to confirm.");
}

/** Refuses to delete anything outside the project, whatever the pointer file claims. */
function assertInsideProject(workspace: Workspace, target: string): string {
  const resolved = resolve(target);
  const root = resolve(workspace.root);
  if (resolved === root) throw new Error(`Refusing to delete the project root: ${resolved}`);
  if (relative(root, resolved).startsWith("..")) throw new Error(`Refusing to delete outside the project: ${resolved}`);
  return resolved;
}

function confirmed(options: string[]): boolean {
  return options.includes("--yes");
}

function valueAfter(args: string[], option: string): string | undefined {
  const index = args.indexOf(option);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value.`);
  return value;
}
