# AI Deck Kit — Deployment & Upgrade

End-user installation and daily commands are documented in [../README.md](../README.md). This guide covers the mechanics behind them.

## Install

The GitHub-source installer is implemented and locally smoke-tested with a source fixture. A registry-backed clean install was not verifiable in the development environment because npm DNS resolution returned `ENOTFOUND`.

From a project root:

```sh
npx github:joachimtrungtuan/ai-deck-kit init --here
```

By default, the command creates `engine/`, `decks/`, `templates/`, and the root `ai-deck-kit.json` pointer. To keep the engine in a project subfolder while retaining root-level CLI discovery:

```sh
npx github:joachimtrungtuan/ai-deck-kit init --dir tools/ai-deck-kit
```

### Install sequence

1. **Prerequisite preflight.** Hard requirements (Node ≥ 22.6.0, npm, git) abort the install before anything is written; soft ones (`zip`/`unzip`, Chrome, ImageMagick) only warn, naming the feature each unlocks. `--skip-checks` downgrades a hard failure to a warning. `aideck doctor` runs the same report.
2. **Engine copy + pointer.** The pinned engine is copied to the chosen root and `ai-deck-kit.json` is written.
3. **Dependency install.** `npm install --prefix <engineRoot>`. Set the package-specific offline install flag for CLI-only scaffolding without preview/export dependencies.
4. **Version-control boundary.** A `.gitignore` block ignores the resolved engine directory, the `./aideck` wrapper, and `**/.build/`; `decks/` and `ai-deck-kit.json` are deliberately left committable. A missing file is created; an existing one is appended to, and a file already carrying the block is left untouched.
5. **Project wrapper.** `./aideck` is written at the project root, so the toolkit is fully usable with no global registration.
6. **Skill wiring.** See below.
7. **Command registration offer.** Interactive only; see [Command registration](#command-registration).

### Skill wiring

`engine/skills/*` are linked into the agent home (`.claude` or `.agents`) so the agent runtime can load them. Resolution walks up from the project root:

- An agent home **at the project root** is wired without prompting.
- A home found **further up** triggers a three-way prompt: use that folder, type an explicit path, or skip.
- Non-interactive runs (no TTY, or the non-interactive env flag) wire only a root-level home and otherwise skip with a pointer to `aideck skills wire`.

Links are relative symlinks, with a copy fallback where symlinks are unavailable. An existing real directory that the toolkit did not create is never replaced. Re-running is idempotent:

```sh
aideck skills wire [--to <path>]
```

### Command registration

```sh
aideck link
aideck unlink
```

`link` writes `engine/cli/resolver.mjs` into npm's global bin directory. The resolver holds no toolkit logic and no version: it walks up from the working directory to the nearest `ai-deck-kit.json` and executes that workspace's `engine/cli/index.mjs`. Consequences:

- One registration serves every workspace on the machine, permanently.
- Each project runs its own pinned engine; upgrading one project cannot affect another.
- Moving or re-installing a project needs no re-registration.

The same resolver backs the package's `aideck` bin entry, so `npm i -g ai-deck-kit` resolves per-workspace rather than pinning the globally installed engine.

Registration refuses to overwrite a binary it does not recognise, but does replace an earlier `npm link`-style symlink that pointed straight at one project's engine CLI. `globalBinDir()` prefers an explicit npm prefix env override, falls back to `npm prefix -g` when that path exists — npm masks path segments it mistakes for secrets — and otherwise uses the directory holding the running `node`.

Without registration, invoke the project wrapper or the copied CLI directly:

```sh
./aideck new my-talk --template swiss-modern
node ./engine/cli/index.mjs new my-talk --template swiss-modern
```

Use `./tools/ai-deck-kit/cli/index.mjs` when `--dir tools/ai-deck-kit` was used.

## Preview

The same shared, read-only preview app handles the gallery, decks, and templates:

```sh
aideck serve
aideck serve --deck my-talk
aideck serve --template swiss-modern
```

The browser opens automatically. Add `--no-open` for automation and `--port <port>` to select a port. `--deck` and `--template` are mutually exclusive.

Template selection checks `templates/{name}.template/` first so an agent can edit and review a user draft. If no draft exists, it loads the installed template from `engine/templates/{name}.template/`. The CLI validates the selected template's manifest, CSS files, layout index, and declared layout sources before starting Vite.

## Upgrade

When the `aideck` binary is installed or linked, run from the project root or any descendant directory:

```sh
aideck upgrade
aideck upgrade --to 0.2.0
```

An upgrade replaces only the resolved `engineRoot`, updates `engineVersion` in `ai-deck-kit.json`, and runs `aideck doctor`. The `decks/` and project `templates/` roots are never copied, removed, or migrated. `aideck doctor` reports schema, slide-catalog, and template-version mismatches without silently rewriting a deck. The same commands can be run through the copied CLI entrypoint shown above.

For a local release smoke test, pass an engine directory explicitly:

```sh
aideck upgrade --to 0.2.0 --source /path/to/engine
```

For remote upgrades, set `AIDECK_GITHUB_REPOSITORY=owner/ai-deck-kit`; otherwise the package name `ai-deck-kit` is used as the package source. `AIDECK_PACKAGE_SPEC` can override either source for CI or a private registry.

## CI/CD

Pull requests and pushes to `main` run:

- JavaScript syntax lint.
- TypeScript typecheck.
- Template manifest validation plus release-package checks for both shipped `.template` bundles.
- Clean nested-engine install smoke test for both shipped templates (workflow configured; local registry-backed install remains unverified).
- HTML and raster PDF export smoke tests.
- Upgrade hash check proving `decks/` is unchanged.

Tags matching `vMAJOR.MINOR.PATCH` run the configured release workflow. The workflow validates the engine, packs the root `ai-deck-kit` package, and is intended to attach the tarball plus `engine.version.json` to the GitHub release. Remote release execution has not been verified. Install from a tagged GitHub source with `npx github:joachimtrungtuan/ai-deck-kit#v<version> init`.

## Versioning

The package, engine, and root pointer use semver. Deck compatibility is checked separately through `contentSchemaVersion`, `slideTypeCatalog`, `blockCatalog`, and template versions. Upgrade never force-migrates user content.
