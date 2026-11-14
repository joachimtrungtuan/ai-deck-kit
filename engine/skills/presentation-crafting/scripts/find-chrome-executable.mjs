import { existsSync } from "node:fs";

/** Finds the system browser used by export checks and PDF capture. */
export function findChrome({ override } = {}) {
  const environmentPath = process.env["CHROME_PATH"];
  if (override || environmentPath) return override ?? environmentPath;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  return candidates.find((path) => existsSync(path));
}
