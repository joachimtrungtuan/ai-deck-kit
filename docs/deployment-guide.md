# AI Deck Kit — Deployment & Upgrade

## Install

The GitHub-source installer is implemented and locally smoke-tested with a source fixture. A registry-backed clean install was not verifiable in the development environment because npm DNS resolution returned `ENOTFOUND`.

From a project root:

```sh
npx github:<owner>/ai-deck-kit init --here
```

By default, the command creates `engine/`, `decks/`, `templates/`, and the root `ai-deck-kit.json` pointer. To keep the engine in a project subfolder while retaining root-level CLI discovery:

```sh
npx github:<owner>/ai-deck-kit init --dir tools/ai-deck-kit
```

The installer copies the pinned engine and installs its runtime dependencies. Set the package-specific offline install flag only when you need CLI-only scaffolding without preview/export dependencies.

For a workspace created by the ephemeral `npx` command, invoke the copied CLI directly unless you have installed or linked the package's `aideck` binary:

```sh
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

Tags matching `vMAJOR.MINOR.PATCH` run the configured release workflow. The workflow validates the engine, packs the root `ai-deck-kit` package, and is intended to attach the tarball plus `engine.version.json` to the GitHub release. Remote release execution has not been verified. Install from a tagged GitHub source with `npx github:<owner>/ai-deck-kit#v<version> init`.

## Versioning

The package, engine, and root pointer use semver. Deck compatibility is checked separately through `contentSchemaVersion`, `slideTypeCatalog`, `blockCatalog`, and template versions. Upgrade never force-migrates user content.
