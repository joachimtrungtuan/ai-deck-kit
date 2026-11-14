import { createHash } from "node:crypto";

const FRAME_BUSTER = `(function(){document.documentElement.dataset.cspCheck="ran";document.addEventListener("securitypolicyviolation",function(event){var root=document.documentElement;root.dataset.cspViolations=(root.dataset.cspViolations?root.dataset.cspViolations+"|":"")+(event.blockedURI||event.violatedDirective||"unknown");});try{if(window.top===window)return;void window.top.location.href;}catch(error){window.top.location.replace(window.location.href);}})();`;

function sha256(text) {
  return `sha256-${createHash("sha256").update(text).digest("base64")}`;
}

function cspSource(value) {
  return value.startsWith("sha256-") ? `'${value}'` : value;
}

function attribute(attrs, name) {
  return attrs.match(new RegExp(`\\b${name}\\s*=\\s*[\\\"']([^\\\"']*)`, "i"))?.[1] ?? "";
}

function collectOverrideCss(html) {
  const css = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1];
    const source = match[2];
    if (attribute(attrs, "type").toLowerCase() === "text/plain") {
      try {
        const payload = JSON.parse(source);
        const visit = (value) => {
          if (!value || typeof value !== "object") return;
          if (typeof value.css === "string") css.push(value.css);
          for (const child of Object.values(value)) visit(child);
        };
        visit(payload);
      } catch {
        // Data blocks are validated by the runtime; a malformed block must not make export CSP broad.
      }
      continue;
    }
    // Web mode keeps the deck manifest in the app script rather than text/plain blocks. Vite emits
    // those override fields as JSON-like `css:"..."` properties; hash the exact decoded strings.
    for (const cssMatch of source.matchAll(/(?:["']?css["']?)\s*:\s*("(?:\\.|[^"\\])*")/g)) {
      try { css.push(JSON.parse(cssMatch[1])); } catch { /* not an override string */ }
    }
  }
  return css;
}

/** Adds the strict export CSP, referrer policy, violation recorder and frame-busting fallback. */
export function addExportSecurityMeta(html, { mode = "single", allowances = {} } = {}) {
  if (mode !== "single" && mode !== "web") throw new Error(`Unknown export mode: ${mode}`);
  const scriptHashes = [];
  const styleHashes = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1];
    if (attribute(attrs, "src") || attribute(attrs, "type").toLowerCase() === "text/plain") continue;
    scriptHashes.push(sha256(match[2]));
  }
  for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) styleHashes.push(sha256(match[1]));
  for (const css of collectOverrideCss(html)) styleHashes.push(sha256(css));
  scriptHashes.push(sha256(FRAME_BUSTER));

  const append = (base, values = []) => [...new Set([...(base ?? []), ...values])];
  const scriptSrc = append(scriptHashes, allowances.scriptSrc);
  const styleSrc = append(styleHashes, allowances.styleSrc);
  const imageSrc = append(mode === "web" ? ["data:", "'self'"] : ["data:"], allowances.imgSrc);
  const directives = [
    ["default-src", ["'none'"]],
    ["script-src", scriptSrc],
    ["style-src", styleSrc],
    ["img-src", imageSrc],
    ["font-src", ["data:", "'self'", ...(allowances.fontSrc ?? [])]],
    ["media-src", ["'none'", ...(allowances.mediaSrc ?? [])]],
    ["frame-src", ["'none'", ...(allowances.frameSrc ?? [])]],
    ["connect-src", ["'none'"]],
    ["base-uri", ["'none'"]],
    ["form-action", ["'none'"]],
    ["object-src", ["'none'"]],
  ];
  const policy = directives.map(([name, values]) => `${name} ${values.map(cspSource).join(" ")}`).join("; ");
  const security = `    <meta http-equiv="Content-Security-Policy" content="${policy}" />\n    <meta name="referrer" content="no-referrer" />\n    <script>${FRAME_BUSTER}</script>\n`;
  const charset = html.match(/<meta\b[^>]*charset=[^>]*>/i);
  if (!charset || charset.index === undefined) throw new Error("Export security: charset meta is required.");
  const end = charset.index + charset[0].length;
  return html.slice(0, end) + `\n${security}` + html.slice(end);
}

export const exportFrameBusterScript = FRAME_BUSTER;
export const hashInlineContent = sha256;
