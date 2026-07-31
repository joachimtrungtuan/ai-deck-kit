#!/usr/bin/env node
// The CLI entrypoint. It loads the compiled output rather than the TypeScript
// source: Node refuses to strip types for any file under node_modules, which is
// exactly where npx and npm install place this package. Run `npm run build`
// after changing anything under cli/.
import "./dist/index.js";
