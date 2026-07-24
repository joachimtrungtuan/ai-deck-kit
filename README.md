# AI Deck Kit

Portable, agent-native presentation toolkit. The root package provides the `npx` installer; the copied `engine/` owns the deterministic `aideck` CLI, shared primitives, templates, preview runtime, and export pipeline.

```sh
npx github:<owner>/ai-deck-kit init --here
node ./engine/cli/index.mjs new my-talk --template swiss-modern
node ./engine/cli/index.mjs export html my-talk
```

See [docs/deployment-guide.md](docs/deployment-guide.md) for installation, upgrade, binary linking, and CI/CD behavior.
