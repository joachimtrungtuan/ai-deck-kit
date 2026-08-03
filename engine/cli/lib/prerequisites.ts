// Dependency preflight for install and doctor.
//
// Hard prerequisites block the install: without them nothing works, and the raw
// failure (a syntax error from an old Node, an ENOENT from a missing npm) tells
// a non-technical user nothing. Soft prerequisites only gate optional commands,
// so they are reported as warnings and never stop a workspace from being created.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

// The CLI entrypoint runs TypeScript sources through --experimental-strip-types,
// which landed in 22.6.0.
const MINIMUM_NODE = [22, 6, 0] as const;

export type PrerequisiteCheck = {
  name: string;
  ok: boolean;
  detail: string;
  neededFor: string;
  remedy: string[];
};

export type PrerequisiteReport = { hard: PrerequisiteCheck[]; soft: PrerequisiteCheck[] };

export function checkPrerequisites(): PrerequisiteReport {
  return {
    hard: [checkPlatform(), checkNode(), checkCommand("npm", "installing engine dependencies", npmRemedy()), checkCommand("git", "downloading the kit from GitHub", gitRemedy())],
    soft: [checkArchiveTools(), checkChrome(), checkImageMagick()],
  };
}

export function hasFailures(report: PrerequisiteReport): boolean {
  return report.hard.some((check) => !check.ok);
}

/** Human-readable preflight summary. Plain language first, paths second. */
export function formatPrerequisiteReport(report: PrerequisiteReport): string {
  const lines: string[] = ["Checking what this toolkit needs on your computer:", ""];
  for (const check of [...report.hard, ...report.soft]) {
    lines.push(`  ${check.ok ? "OK  " : "MISSING"}  ${check.name} — ${check.detail}`);
  }
  const failedHard = report.hard.filter((check) => !check.ok);
  const failedSoft = report.soft.filter((check) => !check.ok);
  if (failedHard.length) {
    lines.push("", "Install cannot continue. These are required:", "");
    failedHard.forEach((check) => lines.push(...describe(check)));
  }
  if (failedSoft.length) {
    lines.push("", failedHard.length ? "Also optional, and safe to fix later:" : "Everything required is present. These are optional:", "");
    failedSoft.forEach((check) => lines.push(...describe(check)));
  }
  return lines.join("\n");
}

function describe(check: PrerequisiteCheck): string[] {
  return [`  ${check.name} — needed for ${check.neededFor}`, ...check.remedy.map((line) => `    ${line}`), ""];
}

function checkNode(): PrerequisiteCheck {
  const current = process.versions.node;
  const required = MINIMUM_NODE.join(".");
  return {
    name: `Node.js ${required}+`,
    ok: compareVersions(current, MINIMUM_NODE) >= 0,
    detail: `you have ${current}`,
    neededFor: "running the toolkit at all",
    remedy: [
      `Your Node.js is too old. Version ${required} or newer is required.`,
      "Easiest fix — install the current release from https://nodejs.org (choose the LTS download).",
      "If you use nvm:  nvm install --lts && nvm use --lts",
      ...(process.platform === "darwin" ? ["If you use Homebrew:  brew install node"] : []),
      "Then close and reopen your terminal, and run the install command again.",
    ],
  };
}

function checkCommand(command: string, neededFor: string, remedy: string[]): PrerequisiteCheck {
  const found = onPath(command);
  return { name: command, ok: found, detail: found ? "found" : "not found on your PATH", neededFor, remedy };
}

// Packing and PDF export shell out to Unix tools. Rather than half-working on Windows, say so
// once, up front. WSL reports itself as linux, so it passes.
function checkPlatform(): PrerequisiteCheck {
  const supported = process.platform === "darwin" || process.platform === "linux";
  return {
    name: "Operating system",
    ok: supported,
    detail: supported ? `${process.platform} — supported` : `${process.platform} — not supported`,
    neededFor: "running the toolkit at all",
    remedy: [
      "This toolkit supports macOS and Linux.",
      "On Windows, install WSL (Windows Subsystem for Linux) and run the toolkit inside it:",
      "  https://learn.microsoft.com/windows/wsl/install",
    ],
  };
}

function npmRemedy(): string[] {
  return [
    "npm normally arrives together with Node.js.",
    "Install Node.js from https://nodejs.org (the LTS download includes npm).",
    "Then close and reopen your terminal, and run the install command again.",
  ];
}

function gitRemedy(): string[] {
  const byPlatform: Record<string, string> = {
    darwin: "Run:  xcode-select --install    (or:  brew install git)",
    linux: "Debian/Ubuntu:  sudo apt install git      Fedora:  sudo dnf install git",
  };
  return [
    "git is required because the toolkit is downloaded straight from GitHub.",
    byPlatform[process.platform] ?? "Install git from https://git-scm.com/downloads",
    "Then close and reopen your terminal, and run the install command again.",
  ];
}

function checkArchiveTools(): PrerequisiteCheck {
  const found = onPath("zip") && onPath("unzip");
  return {
    name: "zip / unzip",
    ok: found,
    detail: found ? "found" : "not found on your PATH",
    neededFor: "sharing a deck as a zip file (aideck pack / unpack)",
    remedy: [
      "Everything else works without this. You only need it to share decks as zip files.",
      process.platform === "darwin" ? "Run:  brew install zip unzip" : "Debian/Ubuntu:  sudo apt install zip unzip",
    ],
  };
}

function checkChrome(): PrerequisiteCheck {
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  const found = candidates.some((path) => existsSync(path)) || onPath("google-chrome") || onPath("chromium");
  return {
    name: "Google Chrome",
    ok: found,
    detail: found ? "found" : "not found in the usual locations",
    neededFor: "exporting a deck to PDF (aideck export pdf)",
    remedy: [
      "HTML export and browser preview work without this. Only PDF export needs it.",
      "Download Chrome from https://www.google.com/chrome/",
      "Already installed somewhere unusual? Set CHROME_PATH to the full path of the program.",
    ],
  };
}

function checkImageMagick(): PrerequisiteCheck {
  const found = onPath("magick") || onPath("convert");
  return {
    name: "ImageMagick",
    ok: found,
    detail: found ? "found" : "not found on your PATH",
    neededFor: "exporting a deck to PDF (aideck export pdf)",
    remedy: [
      "HTML export and browser preview work without this. Only PDF export needs it.",
      process.platform === "darwin" ? "Run:  brew install imagemagick" : "Debian/Ubuntu:  sudo apt install imagemagick",
    ],
  };
}

function onPath(command: string): boolean {
  return spawnSync("which", [command], { encoding: "utf8" }).status === 0;
}

function compareVersions(current: string, minimum: readonly number[]): number {
  const parts = current.split(".").map((part) => Number.parseInt(part, 10));
  for (let index = 0; index < minimum.length; index += 1) {
    const difference = (parts[index] ?? 0) - minimum[index];
    if (difference !== 0) return difference;
  }
  return 0;
}
