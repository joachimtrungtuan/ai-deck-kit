#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const cliRoot = dirname(fileURLToPath(import.meta.url));
const result = spawnSync(process.execPath, ["--experimental-strip-types", join(cliRoot, "index.ts"), ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(result.status ?? 1);
