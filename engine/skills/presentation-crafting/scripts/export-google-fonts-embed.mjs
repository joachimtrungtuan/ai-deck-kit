import { readFontFsType } from "../../presentation-template-creation/scripts/font-license-check.mjs";

const GOOGLE_ORIGINS = new Set(["https://fonts.googleapis.com", "https://fonts.gstatic.com"]);
const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

/** Download Google Fonts CSS and font bytes at export time, replacing every remote URL with data:. */
export async function embedGoogleFonts(css, { fetchImpl = fetch, warn = console.warn } = {}) {
  const warnings = [];
  let output = css;
  const imports = [...css.matchAll(/@import\s+url\(\s*["']?(https:\/\/fonts\.googleapis\.com\/[^\s)'";]+)["']?\s*\)\s*;?/gi)].map((m) => m[1]);
  for (const url of imports) {
    let response;
    try { response = await fetchImpl(url, { headers: { "user-agent": USER_AGENT } }); }
    catch (error) { throw new Error(`Could not download Google Font CSS for ${url}: ${error.message}`); }
    if (!response.ok) throw new Error(`Could not download Google Font CSS for ${url}: HTTP ${response.status}`);
    const fontCss = await response.text();
    output = output.replaceAll(url, fontCss);
  }
  const urls = [...output.matchAll(/url\(\s*["']?(https:\/\/fonts\.gstatic\.com\/[^\s)'";]+)["']?\s*\)/gi)].map((m) => m[1]);
  for (const url of [...new Set(urls)]) {
    let response;
    try { response = await fetchImpl(url, { headers: { "user-agent": USER_AGENT } }); }
    catch (error) { throw new Error(`Could not download Google Font file ${url}: ${error.message}`); }
    if (!response.ok) throw new Error(`Could not download Google Font file ${url}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const fsType = readFontFsType(bytes);
    if (fsType !== null && (fsType & 0x0002) !== 0) {
      const warning = `Google Font embedding is restricted for ${url}; embedding anyway as export backstop.`;
      warnings.push(warning); warn(warning);
    }
    const mime = response.headers.get("content-type")?.split(";", 1)[0] || "font/woff2";
    output = output.replaceAll(url, `data:${mime};base64,${bytes.toString("base64")}`);
  }
  return { css: output, warnings };
}

export { GOOGLE_ORIGINS };
