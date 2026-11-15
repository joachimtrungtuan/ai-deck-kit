import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { findChrome } from "./find-chrome-executable.mjs";

function htmlAttribute(html, name) {
  const opening = html.match(/<html\b[^>]*>/i)?.[0];
  if (!opening) return undefined;
  return opening.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1];
}

function decodeAttribute(value) {
  return value?.replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
}

function readViolations(dom) {
  const encoded = htmlAttribute(dom, "data-csp-violations");
  if (!encoded) return [];
  let decoded;
  try { decoded = decodeURIComponent(decodeAttribute(encoded)); } catch (error) { throw new Error(`CSP violation recorder emitted invalid encoding: ${error.message}`); }
  try {
    const parsed = JSON.parse(decoded);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    return parsed;
  } catch (error) {
    throw new Error(`CSP violation recorder emitted invalid JSON: ${error.message}`);
  }
}

function checkDom(dom, url) {
  if (htmlAttribute(dom, "data-csp-check") !== "ran") {
    throw new Error(`CSP check failed for ${url}: recorder did not run (missing data-csp-check marker).`);
  }
  const violations = readViolations(dom);
  if (violations.length) {
    const details = violations.map((violation) => `${violation.directive || "unknown-directive"} blocked ${violation.blockedURI || "unknown URI"}${violation.sourceFile ? ` at ${violation.sourceFile}:${violation.line || 0}` : ""}`).join("; ");
    throw new Error(`CSP violation(s) for ${url}: ${details}`);
  }
}

// Headless Chrome on macOS can crash ("Trying to load the allocator multiple times") or hang during
// teardown after dumping a complete DOM. The recorder marker proves the page ran, so that DOM is judged.
// A hung run is killed by the spawn timeout, so it also needs the export-ready marker to show the dump
// is the finished page. Any other spawn error, or a dump without the marker, fails closed.
export function chromeDumpIsJudgeable({ error, status, stdout }) {
  const ranRecorder = htmlAttribute(stdout ?? "", "data-csp-check") === "ran";
  if (error) return error.code === "ETIMEDOUT" && ranRecorder && htmlAttribute(stdout ?? "", "data-export-ready") === "true";
  return status === 0 || ranRecorder;
}

const CHECK_LOCK =join(tmpdir(), "aideck-csp-check.lock");

function acquireCheckLock(timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      mkdirSync(CHECK_LOCK);
      writeFileSync(join(CHECK_LOCK, "owner"), `${process.pid}\n${Date.now()}\n`);
      return;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      try {
        if (Date.now() - statSync(join(CHECK_LOCK, "owner")).mtimeMs > timeoutMs) rmSync(CHECK_LOCK, { recursive: true, force: true });
      } catch { /* Another checker is creating or releasing the lock. */ }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
  throw new Error("Chrome CSP check could not acquire the shared headless-browser lease within 60 seconds.");
}

function releaseCheckLock() {
  rmSync(CHECK_LOCK, { recursive: true, force: true });
}

export function runHtmlCspHeadlessCheck({ htmlPath, chrome: chromeOverride, slideCount = 1 } = {}) {
  const chrome = findChrome({ override: chromeOverride });
  if (!chrome || !existsSync(chrome)) {
    console.warn("Warning: CSP check skipped (no Chrome/Chromium found). Export succeeded without headless CSP verification.");
    return { skipped: true, elapsedMs: 0 };
  }
  if (!htmlPath || !existsSync(htmlPath)) throw new Error(`CSP check HTML not found: ${htmlPath}`);
  const budget = Math.min(15000, Math.max(5000, 2500 + Number(slideCount) * 500));
  const baseArgs = ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-default-apps", "--disable-background-networking", "--disable-sync", "--hide-scrollbars", "--log-level=3"];
  const started = Date.now();
  acquireCheckLock();
  try {
    for (const suffix of ["", "?print"]) {
      const profile = mkdtempSync(resolve(tmpdir(), "aideck-csp-check-"));
      try {
        const url = `${pathToFileURL(resolve(htmlPath)).href}${suffix}`;
        const result = spawnSync(chrome, [...baseArgs, `--user-data-dir=${profile}`, `--virtual-time-budget=${budget}`, "--dump-dom", url], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, timeout: budget + 10000 });
        if (!chromeDumpIsJudgeable(result)) {
          const details = [result.error?.message, result.stderr?.trim(), result.stdout?.trim()].filter(Boolean).join("\n");
          throw new Error(`Chrome CSP check failed for ${url}${details ? `:\n${details}` : " (runtime failure)"}`);
        }
        checkDom(result.stdout ?? "", url);
      } finally {
        rmSync(profile, { recursive: true, force: true });
      }
    }
  } finally {
    releaseCheckLock();
  }
  return { skipped: false, elapsedMs: Date.now() - started };
}

export function countExportSlides(htmlPath) {
  const html = readFileSync(htmlPath, "utf8");
  return Math.max(1, (html.match(/class=["'][^"']*\bdeck-page\b/g) ?? []).length);
}
