import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function readJson<T>(file: string): T {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch (error) {
    throw new Error(`Could not read valid JSON: ${file}\n${error instanceof Error ? error.message : String(error)}`);
  }
}

export function writeJson(file: string, value: unknown): void {
  writeText(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function writeText(file: string, value: string): void {
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}`;
  writeFileSync(temporary, value, "utf8");
  renameSync(temporary, file);
}

export function copyTree(source: string, destination: string, excluded = new Set([".build", "storybook-static"])): void {
  if (!existsSync(source)) throw new Error(`Source does not exist: ${source}`);
  cpSync(source, destination, {
    recursive: true,
    filter: (entry) => {
      const name = entry.split("/").at(-1) ?? "";
      return !excluded.has(name) && name !== "node_modules";
    },
  });
}

export function removeTree(target: string): void {
  rmSync(resolve(target), { recursive: true, force: true });
}

export function replaceTree(source: string, destination: string): void {
  const target = resolve(destination);
  const staging = `${target}.staging-${process.pid}`;
  const backup = `${target}.backup-${process.pid}`;
  removeTree(staging);
  copyTree(source, staging);
  try {
    if (existsSync(target)) renameSync(target, backup);
    renameSync(staging, target);
    removeTree(backup);
  } catch (error) {
    removeTree(staging);
    if (existsSync(backup) && !existsSync(target)) renameSync(backup, target);
    throw error;
  }
}
