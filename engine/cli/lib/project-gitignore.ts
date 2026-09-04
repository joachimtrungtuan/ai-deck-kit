// The install boundary, expressed for git: the engine and build output are
// reproducible from an install, while decks/ and ai-deck-kit.json are the user's
// work and stay committable.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MARKER = "# AI Deck Kit";
const MARKER_END = "# END AI Deck Kit";

export type GitignoreResult = "created" | "updated" | "unchanged";

export function ensureProjectGitignore(projectRoot: string, engineDirectory: string): GitignoreResult {
  const path = join(projectRoot, ".gitignore");
  const block = [
    MARKER,
    "# The installed engine and build output are reproducible — no need to commit them.",
    "# decks/ and ai-deck-kit.json are your work: they are deliberately NOT ignored.",
    `/${engineDirectory}/`,
    "/aideck",
    "**/.build/",
    MARKER_END,
    "",
  ].join("\n");

  if (!existsSync(path)) {
    writeFileSync(path, block);
    return "created";
  }
  const existing = readFileSync(path, "utf8");
  if (existing.includes(MARKER)) return "unchanged";
  writeFileSync(path, `${existing.endsWith("\n") ? existing : `${existing}\n`}\n${block}`);
  return "updated";
}

/**
 * Undo `ensureProjectGitignore`: drop the marked block, leaving the rest of the file untouched.
 * A file with no block (including one written before `MARKER_END` existed), or no file at all, is
 * left alone.
 */
export function removeProjectGitignore(projectRoot: string): boolean {
  const path = join(projectRoot, ".gitignore");
  if (!existsSync(path)) return false;
  const existing = readFileSync(path, "utf8");
  const start = existing.indexOf(MARKER);
  if (start === -1) return false;
  const endLine = existing.indexOf(MARKER_END, start);
  if (endLine === -1) return false;
  const end = endLine + MARKER_END.length;
  const before = existing.slice(0, start).replace(/\n+$/, "\n");
  const after = existing.slice(end).replace(/^\n+/, "");
  const stripped = after ? `${before}${before ? "\n" : ""}${after}` : before;
  writeFileSync(path, stripped);
  return true;
}
