import { readFileSync } from "node:fs";

function escapeBlockJson(value) {
  return JSON.stringify(value).replaceAll("</", "<\\/").replaceAll("<!--", "\\u003c!--");
}

export function appendSlideDataBlocks(html, manifestText) {
  const manifest = typeof manifestText === "string" ? JSON.parse(manifestText) : manifestText;
  const slides = Array.isArray(manifest?.slides) ? manifest.slides : [];
  const assets = manifest?.assets && typeof manifest.assets === "object" ? manifest.assets : {};
  const seen = new Set();
  const blocks = slides.map((paths, index) => {
    const payload = {};
    for (const path of Array.isArray(paths) ? paths : []) {
      if (seen.has(path) || typeof assets[path] !== "string") continue;
      seen.add(path);
      payload[path] = assets[path];
    }
    return `\n    <script type="text/plain" data-slide="${index + 1}">${escapeBlockJson(payload)}</script>`;
  }).join("");
  const body = html.toLowerCase().lastIndexOf("</body>");
  if (body === -1) throw new Error("Export assembly: closing </body> is missing.");
  return `${html.slice(0, body)}${blocks}\n  ${html.slice(body)}`;
}

export function appendSlideDataBlocksFromFile(html, manifestPath) {
  return appendSlideDataBlocks(html, readFileSync(manifestPath, "utf8"));
}
