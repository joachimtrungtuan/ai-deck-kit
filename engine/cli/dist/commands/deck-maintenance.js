import { deckPath, readDeck } from "../lib/deck.js";
import { deckBundles, deckDrift, describeDrift, retemplateDeck } from "../lib/deck-template-sync.js";
import { resolveTemplate } from "../lib/templates.js";
import { findWorkspace } from "../lib/workspace.js";
export const deckHelp = `Deck maintenance commands:
  deck status [<slug>]                 Show how each deck compares to its source template
  deck retemplate <slug> [--to <name>] Re-sync one deck's frozen template snapshot`;
export function runDeck(args) {
    if (!args.length || args.includes("--help"))
        return console.log(deckHelp);
    const workspace = findWorkspace();
    const [action, ...rest] = args;
    if (action === "status")
        return statusCommand(workspace, rest[0]);
    if (action === "retemplate")
        return retemplateCommand(workspace, rest);
    throw new Error(`Unknown deck command: ${action}`);
}
function statusCommand(workspace, slug) {
    const bundles = slug ? [bundleFor(workspace, slug)] : deckBundles(workspace);
    if (!bundles.length)
        return console.log("No decks found.");
    bundles.forEach((bundle) => {
        const drift = deckDrift(workspace, bundle);
        console.log(`${drift.slug}\t${drift.templateName}@${drift.deckVersion}\t${describeDrift(drift)}`);
    });
}
/**
 * Re-syncs exactly one deck, on purpose. Layout fit, token renames and text overflow cannot be
 * checked mechanically, so this command changes the files and then hands review back to the agent.
 */
function retemplateCommand(workspace, args) {
    const slug = args[0];
    if (!slug || slug.startsWith("--"))
        throw new Error("Usage: aideck deck retemplate <slug> [--to <template>]");
    const loaded = readDeck(workspace, slug);
    const targetName = valueAfter(args, "--to") ?? loaded.manifest.template.set;
    const template = resolveTemplate(workspace, targetName);
    const result = retemplateDeck(loaded.root, template);
    const switched = targetName !== loaded.manifest.template.set;
    console.log(switched
        ? `Re-templated ${slug}: ${loaded.manifest.template.set}@${result.from} → ${result.templateName}@${result.to} (${result.origin}).`
        : `Re-synced ${slug}: ${result.templateName} ${result.from} → ${result.to} (${result.origin}).`);
    if (result.majorChange || switched) {
        console.log("This is a major change. Layouts, tokens and copy length may no longer line up.");
    }
    console.log("The snapshot changed but no slide content was rewritten.");
    console.log(`Review it before presenting: aideck serve --deck ${slug}`);
}
function bundleFor(workspace, slug) {
    const root = deckPath(workspace, slug);
    return root.split("/").at(-1);
}
function valueAfter(args, option) {
    const index = args.indexOf(option);
    if (index === -1)
        return undefined;
    const value = args[index + 1];
    if (!value || value.startsWith("--"))
        throw new Error(`${option} requires a value.`);
    return value;
}
