// `aideck export html --mode single|web`: flag parsing, and what each mode really writes to disk.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test, { after } from "node:test";
import { runExport, parseExportArgs, pdfOutputPath } from "../commands/output.ts";
import { deckPath } from "../lib/deck.ts";
import type { Workspace } from "../lib/types.ts";
import { appScriptIsClassicInBody, moveAppScriptIntoBody } from "../../skills/presentation-crafting/scripts/export-html-assembly.mjs";
import { engineRoot, exportDeck, workspaceWithDeck } from "./export-deck-fixture.ts";

test("export arguments read the deck and optional mode in either order", () => {
  assert.deepEqual(parseExportArgs(["talk"]), { deck: "talk" });
  assert.deepEqual(parseExportArgs(["talk", "--mode", "single"]), { deck: "talk", mode: "single" });
  assert.deepEqual(parseExportArgs(["--mode", "web", "talk"]), { deck: "talk", mode: "web" });
  assert.deepEqual(parseExportArgs([]), {});
});

test("the PDF is named after the deck slug whichever form the deck argument takes", () => {
  const workspace = { root: "/w", decksRoot: "/w/decks" } as Workspace;
  for (const arg of ["foo", "foo.deck", "decks/foo.deck"]) {
    assert.equal(pdfOutputPath(deckPath(workspace, arg)), join("/w/decks/foo.deck", ".build", "export", "foo.pdf"));
  }
});

test("export arguments reject a bad mode, a missing value, a repeat, and stray input", () => {
  assert.throws(() => parseExportArgs(["talk", "--mode", "fast"]), /--mode must be single or web \(got "fast"\)/);
  assert.throws(() => parseExportArgs(["talk", "--mode"]), /--mode requires a value: single or web/);
  assert.throws(() => parseExportArgs(["--mode", "--other", "talk"]), /--mode requires a value/);
  assert.throws(() => parseExportArgs(["talk", "--mode", "web", "--mode", "single"]), /--mode can only be provided once/);
  assert.throws(() => parseExportArgs(["talk", "--bogus"]), /Unknown export option: --bogus/);
  assert.throws(() => parseExportArgs(["talk", "other"]), /Unexpected export argument: other/);
});

test("PDF export refuses a mode, since it always builds the single file", () => {
  assert.throws(() => runExport({} as never, "pdf", "talk", "web"), /--mode applies to HTML export only/);
});

test("assembly turns the head module script into a classic script right after the mount node", () => {
  const built = [
    "<!doctype html><html><head><title>t</title>",
    '<script type="module" crossorigin>(function(){var a=1;})()</script>',
    "<style>x{}</style></head>",
    '<body><div id="root"></div></body></html>',
  ].join("");
  const out = moveAppScriptIntoBody(built);
  assert.ok(out.includes('<div id="root"></div>\n    <script>(function(){var a=1;})()</script></body>'));
  assert.equal(out.includes("module"), false);
  assert.equal(out.includes("crossorigin"), false);
  assert.ok(appScriptIsClassicInBody(out));
  assert.equal(appScriptIsClassicInBody(built), false);
});

test("assembly fails loudly on a page it does not recognise", () => {
  assert.throws(() => moveAppScriptIntoBody('<body><div id="root"></div></body>'), /no inlined module script/);
  assert.throws(() => moveAppScriptIntoBody('<script type="module">x'), /not closed/);
  assert.throws(() => moveAppScriptIntoBody('<script type="module">x</script><body></body>'), /not found/);
});

test("an unknown mode stops the export script before anything is built", () => {
  const { work, deck } = workspaceWithDeck();
  after(() => rmSync(work, { recursive: true, force: true }));
  const result = exportDeck(work, deck, { mode: "fast" });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /--mode must be one of single, web \(got "fast"\)/);
  assert.equal(existsSync(result.outDir), false);
});

test("the export script reads --mode=<value> and stops on a --mode with no value", () => {
  const { work, deck } = workspaceWithDeck();
  after(() => rmSync(work, { recursive: true, force: true }));
  const web = exportDeck(work, deck, { modeArgs: ["--mode=web"] });
  assert.equal(web.status, 0, web.output);
  assert.equal(existsSync(join(web.outDir, "assets")), true, "--mode=web builds the web layout");

  const missing = exportDeck(work, deck, { out: "missing", modeArgs: ["--mode"] });
  assert.notEqual(missing.status, 0);
  assert.match(missing.output, /--mode requires a value/);
  assert.equal(existsSync(missing.outDir), false);

  const followedByFlag = exportDeck(work, deck, { out: "followed", modeArgs: ["--mode", "--out", join(work, "followed")] });
  assert.notEqual(followedByFlag.status, 0);
  assert.match(followedByFlag.output, /--mode requires a value/);

  const badInline = exportDeck(work, deck, { out: "bad-inline", modeArgs: ["--mode=fast"] });
  assert.notEqual(badInline.status, 0);
  assert.match(badInline.output, /--mode must be one of single, web \(got "fast"\)/);
  assert.equal(existsSync(badInline.outDir), false);
});

test("the CLI export forwards --mode to the export script", () => {
  const { work, deck } = workspaceWithDeck();
  after(() => rmSync(work, { recursive: true, force: true }));
  const workspace: Workspace = {
    root: work,
    pointerPath: join(work, "ai-deck-kit.json"),
    pointer: { engineRoot, decksRoot: work, engineVersion: "0.0.0" },
    engineRoot,
    decksRoot: work,
  };
  const built = join(deck, ".build", "export");
  runExport(workspace, "html", deck, "web");
  assert.equal(existsSync(join(built, "assets")), true, "web mode links assets beside the page");
  runExport(workspace, "html", deck);
  assert.deepEqual(listFiles(built), ["index.html"], "no mode keeps the single file");
});

/** Lists every file under `dir` as a posix-style path relative to it. */
function listFiles(dir: string, prefix = ""): string[] {
  return readdirSync(join(dir, prefix), { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? listFiles(dir, relative) : [relative];
  });
}

test("single mode writes one self-contained file and web mode links only the referenced assets", () => {
  const { work, deck } = workspaceWithDeck();
  after(() => rmSync(work, { recursive: true, force: true }));
  const used = randomBytes(6000);
  const unused = randomBytes(6000);
  writeFileSync(join(deck, "assets", "used-probe.png"), used);
  writeFileSync(join(deck, "assets", "unused-probe.png"), unused);
  mkdirSync(join(deck, "assets", "notes"), { recursive: true });
  writeFileSync(join(deck, "assets", "notes", "authoring-only.txt"), "not rendered");
  const contentPath = join(deck, "content.md");
  const original = readFileSync(contentPath, "utf8");
  writeFileSync(
    contentPath,
    original
      .replaceAll('"assets/sensor-housing.svg"', '"assets/used-probe.png"')
      .replace('assets: ["assets/station-ridge.svg"]', 'assets: ["assets/station-ridge.svg", "assets/unused-probe.png"]'),
  );
  const usedProbe = used.toString("base64").slice(0, 96);

  // Web first, then single into the same directory: the second run must leave no web leftovers.
  const web = exportDeck(work, deck, { mode: "web" });
  assert.equal(web.status, 0, web.output);
  const webFiles = listFiles(web.outDir).sort();
  assert.deepEqual(webFiles.filter((file) => !file.startsWith("assets/")), ["index.html"]);
  const linked = webFiles.filter((file) => file.startsWith("assets/"));
  assert.ok(linked.includes("assets/used-probe.png"));
  assert.ok(linked.includes("assets/station-ridge.svg"));
  assert.equal(linked.includes("assets/unused-probe.png"), false, "authoring-only asset is not copied");
  assert.equal(linked.some((file) => file.startsWith("assets/notes/") || file.startsWith("assets/diagrams/")), false, "unreferenced folders are not copied");
  assert.deepEqual(readFileSync(join(web.outDir, "assets", "used-probe.png")), used, "linked file is the deck's own bytes");
  for (const server of [".htaccess", "nginx.conf", "_headers", "_redirects", "web.config", "vercel.json"]) {
    assert.equal(webFiles.some((file) => file.endsWith(server)), false, `no ${server}`);
  }
  const webHtml = readFileSync(join(web.outDir, "index.html"), "utf8");
  assert.equal(webHtml.includes(usedProbe), false, "no image payload inside the web page");
  assert.equal(/data:image\/(png|jpe?g|gif|webp|avif|svg\+xml;base64)/.test(webHtml), false, "no embedded raster or base64 svg");
  assert.match(webHtml, /["']assets\/used-probe\.png["']\s*:\s*["']assets\/used-probe\.png["']/, "the table maps each path to itself");
  assert.ok(appScriptIsClassicInBody(webHtml), "web page script is a classic script after the mount node");

  const single = exportDeck(work, deck, { mode: "single" });
  assert.equal(single.status, 0, single.output);
  assert.deepEqual(listFiles(single.outDir), ["index.html"], "single is the HTML alone and clears the earlier web output");
  const singleHtml = readFileSync(join(single.outDir, "index.html"), "utf8");
  assert.equal(singleHtml.split(usedProbe).length - 1, 1, "shared image bytes appear exactly once");
  assert.equal(singleHtml.includes(unused.toString("base64").slice(0, 96)), false);
  assert.ok(appScriptIsClassicInBody(singleHtml), "single page script is a classic script after the mount node");
  assert.equal(/<script[^>]*\bsrc=/.test(singleHtml) || /<link[^>]*rel=["']?(stylesheet|modulepreload)/.test(singleHtml), false, "nothing external to fetch");
});

test("export without --mode builds the single file", () => {
  const { work, deck } = workspaceWithDeck();
  after(() => rmSync(work, { recursive: true, force: true }));
  const result = exportDeck(work, deck);
  assert.equal(result.status, 0, result.output);
  assert.deepEqual(listFiles(result.outDir), ["index.html"]);
});
