// Post-build page assembly for the HTML export.
//
// vite-plugin-singlefile inlines the app as a module script in <head>. Module scripts are deferred
// and, over file://, subject to origin rules that classic scripts are not. The export build emits
// the app as a self-contained IIFE, so it is moved to a classic script at the end of <body>, right
// after the mount node. Everything the page later streams in comes after the app can run.
//
// The inlined stylesheet carries every embedded font and can be megabytes, and a browser cannot
// paint the page before it has read everything in <head>. It moves into <body> with the app, so the
// small loader written ahead of it in the source page is painted first.

const moduleScriptOpen = /<script type="module"[^>]*>/;
const rootMount = '<div id="root"></div>';
const inlinedStylesheet = /<style rel="stylesheet"[^>]*>[\s\S]*?<\/style>/g;

/** Returns `html` with its inlined module script rewritten as a classic script after the mount node, with the inlined stylesheet ahead of it. */
export function moveAppScriptIntoBody(html) {
  const open = moduleScriptOpen.exec(html);
  if (!open) throw new Error("Export assembly: no inlined module script found in the built page.");
  const codeStart = open.index + open[0].length;
  const closeIndex = html.indexOf("</script>", codeStart);
  if (closeIndex === -1) throw new Error("Export assembly: the inlined script is not closed.");
  const code = html.slice(codeStart, closeIndex);
  const withoutScript = html.slice(0, open.index) + html.slice(closeIndex + "</script>".length);
  const stylesheets = withoutScript.match(inlinedStylesheet) ?? [];
  const withoutStyles = withoutScript.replace(inlinedStylesheet, "");
  const mountEnd = withoutStyles.indexOf(rootMount);
  if (mountEnd === -1) throw new Error(`Export assembly: ${rootMount} not found in the built page.`);
  const insertAt = mountEnd + rootMount.length;
  const styles = stylesheets.map((sheet) => `\n    ${sheet}`).join("");
  return `${withoutStyles.slice(0, insertAt)}${styles}\n    <script>${code}</script>${withoutStyles.slice(insertAt)}`;
}

/** True when the app script is a classic inline script that follows the mount node. */
export function appScriptIsClassicInBody(html) {
  const mount = html.indexOf(rootMount);
  return mount !== -1 && !moduleScriptOpen.test(html) && html.indexOf("<script>", mount) !== -1;
}
