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
export function installEngineDependencies(engineRoot) {
    if (process.env[SKIP_INSTALL_ENV] === "1")
        return;
    console.log("");
    console.log("Installing the toolkit's components. This can take a minute.");
    const result = spawnSync("npm", ["ci", "--prefix", engineRoot, "--no-audit", "--no-fund"], { stdio: "inherit" });
    if (result.status !== 0) {
        throw new Error([
            "Could not install the toolkit's components.",
            "",
            "  - Check that you are connected to the internet.",
            "  - If you are behind a company proxy or VPN, that is the usual cause.",
            "  - Then run the same command again — it picks up from here.",
        ].join("\n"));
    }
}
