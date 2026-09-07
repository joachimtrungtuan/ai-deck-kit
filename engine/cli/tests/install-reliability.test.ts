// Covers the installer's promises when it runs nested inside another npm (npx, npm exec, npm run),
// when a previous init was cut short or the engine folder was deleted, and when the global launcher
// meets a damaged pointer file.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test, { after } from "node:test";
import { installEngineDependencies, npmChildEnvironment, previewRuntimeBinary } from "../lib/engine-dependencies.ts";
import { engineIntegrityManifestPath } from "../lib/engine-integrity.ts";
import { resumableWorkspace } from "../commands/init.ts";

const RESOLVER = fileURLToPath(new URL("../resolver.mjs", import.meta.url));
const temporaryRoots: string[] = [];
after(() => temporaryRoots.forEach((root) => rmSync(root, { recursive: true, force: true })));

test("the nested npm does not inherit the parent npm's config variables", () => {
  const child = npmChildEnvironment({ PATH: "/bin", HOME: "/home/x", npm_config_allow_scripts: "pkg", NPM_CONFIG_REGISTRY: "r", npm_lifecycle_event: "test" });
  assert.deepEqual(child, { PATH: "/bin", HOME: "/home/x", npm_lifecycle_event: "test" });
});

test("installing under a parent npm succeeds even when its config would be rejected as a flag", () => {
  const fakeNpm = fakeNpmOnPath('env | grep -qi "^npm_config_" && { echo "npm error code EALLOWSCRIPTS" >&2; exit 1; }; exit 0');
  withEnvironment({ PATH: `${fakeNpm}:${process.env.PATH}`, npm_config_allow_scripts: "some-package", AIDECK_SKIP_INSTALL: undefined }, () => {
    assert.doesNotThrow(() => installEngineDependencies(temporaryDirectory()));
  });
});

test("a failed install points at npm's own output instead of guessing at the network", () => {
  const fakeNpm = fakeNpmOnPath('echo "npm error code ETARGET" >&2; exit 1');
  withEnvironment({ PATH: `${fakeNpm}:${process.env.PATH}`, AIDECK_SKIP_INSTALL: undefined }, () => {
    assert.throws(() => installEngineDependencies(temporaryDirectory()), /npm printed the reason just above/);
  });
});

test("init resumes after a cut-short install and re-copies a deleted engine folder", () => {
  const distribution = temporaryDirectory();
  writeFileSync(join(distribution, "engine.version.json"), JSON.stringify({ engineVersion: "1.0.0" }));
  mkdirSync(join(distribution, "cli"));
  writeFileSync(join(distribution, "cli", "index.mjs"), "");
  const project = temporaryDirectory();
  const pointerPath = join(project, "ai-deck-kit.json");
  writeFileSync(pointerPath, JSON.stringify({ engineRoot: "./engine", decksRoot: "./decks", engineVersion: "1.0.0" }));
  const engine = join(project, "engine");

  withEnvironment({ AIDECK_DISTRIBUTION_ROOT: distribution }, () => {
    assert.equal(resumableWorkspace(pointerPath, project)?.engineRoot, engine, "missing engine folder is copied again");
    assert.ok(existsSync(join(engine, "cli", "index.mjs")));

    assert.ok(resumableWorkspace(pointerPath, project), "engine copied but dependencies not installed");

    mkdirSync(dirname(previewRuntimeBinary(engine)), { recursive: true });
    writeFileSync(previewRuntimeBinary(engine), "");
    assert.ok(resumableWorkspace(pointerPath, project), "dependencies installed but manifest not written");

    writeFileSync(engineIntegrityManifestPath(engine), "{}");
    assert.equal(resumableWorkspace(pointerPath, project), undefined, "a finished install is not resumable");
  });
});

test("the global launcher explains a damaged pointer instead of crashing", () => {
  assert.match(runResolver(temporaryDirectory()).stderr, /No AI Deck Kit workspace found here/);
  assert.match(runResolver(projectWithPointer("{")).stderr, /Could not read ai-deck-kit\.json at .*ai-deck-kit\.json\n/);
  assert.match(runResolver(projectWithPointer("{}")).stderr, /no "engineRoot" entry/);
  assert.match(runResolver(projectWithPointer('{"engineRoot":"./engine"}')).stderr, /engine is missing or incomplete/);
});

function runResolver(cwd: string) {
  const result = spawnSync(process.execPath, [RESOLVER], { cwd, encoding: "utf8" });
  assert.equal(result.status, 1);
  return result;
}

function projectWithPointer(contents: string): string {
  const project = temporaryDirectory();
  writeFileSync(join(project, "ai-deck-kit.json"), contents);
  return project;
}

/** A directory holding an executable `npm` that runs the given shell body, for prepending to PATH. */
function fakeNpmOnPath(body: string): string {
  const directory = temporaryDirectory();
  const script = join(directory, "npm");
  writeFileSync(script, `#!/bin/sh\n${body}\n`);
  chmodSync(script, 0o755);
  return directory;
}

function withEnvironment(overrides: Record<string, string | undefined>, run: () => void): void {
  const previous = Object.fromEntries(Object.keys(overrides).map((key) => [key, process.env[key]]));
  const apply = (values: Record<string, string | undefined>) =>
    Object.entries(values).forEach(([key, value]) => (value === undefined ? delete process.env[key] : (process.env[key] = value)));
  apply(overrides);
  try {
    run();
  } finally {
    apply(previous);
  }
}

function temporaryDirectory(): string {
  const root = mkdtempSync(join(tmpdir(), "aideck-install-"));
  temporaryRoots.push(root);
  return root;
}
