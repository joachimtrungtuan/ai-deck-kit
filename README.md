# AI Deck Kit

Portable, agent-native presentation toolkit. The root package provides the `npx` installer; the copied `engine/` owns the deterministic `aideck` CLI, shared primitives, templates, preview runtime, and export pipeline.

```sh
npx github:<owner>/ai-deck-kit init --here
node ./engine/cli/index.mjs new my-talk --template swiss-modern
node ./engine/cli/index.mjs serve --deck my-talk
node ./engine/cli/index.mjs serve --template swiss-modern
node ./engine/cli/index.mjs export html my-talk
```

`serve` uses the single shared, read-only preview app and opens the browser by default. Use `--no-open` for automation or a headless terminal. With no target, `serve` opens the installed template gallery.

See [docs/deployment-guide.md](docs/deployment-guide.md) for installation, upgrade, binary linking, and CI/CD behavior.
