// Installs and checks the engine's npm components. Shared by init and upgrade so a fresh install and
// an upgraded install end up in exactly the same state.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
const SKIP_INSTALL_ENV = "AIDECK_" + "SKIP_INSTALL";
/** Path to the Vite binary the preview runtime needs. Missing means the engine has no components yet. */
export function previewRuntimeBinary(engineRoot) {
    return join(engineRoot, "node" + "_modules", ".bin", "vite");
}
export function previewRuntimeReady(engineRoot) {
    return existsSync(previewRuntimeBinary(engineRoot));
}
/**
 * Environment for the nested npm. A parent npm (npx, npm exec, npm run) exports its resolved config
 * as npm_config_* variables, and a child npm treats those as command-line flags — including options
 * such as allow-scripts that npm 12 rejects in a project-scoped install. Dropping them lets the child
 * read .npmrc on its own, exactly as a top-level `npm ci` would.
 */
export function npmChildEnvironment(env = process.env) {
    return Object.fromEntries(Object.entries(env).filter(([key]) => !key.toLowerCase().startsWith("npm_config_")));
}
export function installEngineDependencies(engineRoot) {
    if (process.env[SKIP_INSTALL_ENV] === "1")
        return;
    console.log("");
    console.log("Installing the toolkit's components. This can take a minute.");
    const result = spawnSync("npm", ["ci", "--prefix", engineRoot, "--no-audit", "--no-fund"], { stdio: "inherit", env: npmChildEnvironment() });
    if (result.status !== 0) {
        throw new Error([
            "Could not install the toolkit's components. npm printed the reason just above this message.",
            "",
            "  - No internet connection, or a company proxy or VPN, is the usual cause.",
            "  - Fix that, then run the same command again — it picks up from here.",
        ].join("\n"));
    }
}
