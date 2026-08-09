# Third-Party Notices

This project uses the following third-party software.

## agentation

- **Package:** [`agentation`](https://www.npmjs.com/package/agentation) (npm)
- **Homepage:** https://github.com/benjitaylor/agentation
- **Copyright:** © 2026 Benji Taylor
- **License:** [PolyForm Shield 1.0.0](https://polyformproject.org/licenses/shield/1.0.0)

`agentation` is used as a **devDependency** of `engine/` to power the click-to-annotate
feedback toolbar mounted in the shared preview app (`engine/preview-app/src/main.tsx`),
active while running `aideck serve`. It is resolved from the npm registry via `npm
install` — this project does not vendor, bundle, or redistribute its source — and it is
absent from `aideck export html/pdf` output.
