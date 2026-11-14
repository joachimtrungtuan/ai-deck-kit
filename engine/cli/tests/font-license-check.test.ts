import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { checkTemplateFonts, readFontFsType } from "../../skills/presentation-template-creation/scripts/font-license-check.mjs";

const fixtures = new URL("./fixtures/font-license/", import.meta.url);

test("reads fsType from a real WOFF2 font", () => {
  assert.equal(readFontFsType(new URL("ofl-real.woff2", fixtures)), 0);
});

test("restricted local font fails authoring validation", () => {
  const result = checkTemplateFonts(fileURLToPath(new URL("./fixtures/font-license/", import.meta.url)), { fonts: [] });
  assert.ok(result.errors.some((error) => error.includes("restricted")));
});

test("malformed local font is rejected", () => {
  const root = mkdtempSync(join(tmpdir(), "aideck-font-"));
  writeFileSync(join(root, "broken.woff2"), Buffer.from("not-a-font"));
  const result = checkTemplateFonts(root, { fonts: [] });
  assert.ok(result.errors.some((error) => error.includes("unreadable")));
  rmSync(root, { recursive: true, force: true });
});
