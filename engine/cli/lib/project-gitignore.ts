// The install boundary, expressed for git: the engine and build output are
// reproducible from an install, while decks/ and ai-deck-kit.json are the user's
// work and stay committable.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MARKER = "# AI Deck Kit";

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
