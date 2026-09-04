// Minimal synchronous terminal prompts.
//
// The whole CLI is synchronous, so a promise-based readline would force every
// caller up the stack to become async for the sake of two questions during
// install. Reading fd 0 a byte at a time keeps the call sites unchanged.
import { readSync } from "node:fs";
const NON_INTERACTIVE_ENV = "AIDECK_" + "NON_INTERACTIVE";
/** False in CI, in pipes, and whenever the caller opts out — callers then take their default. */
export function isInteractive() {
    return Boolean(process.stdin.isTTY) && process.env[NON_INTERACTIVE_ENV] !== "1";
}
export function promptLine(question) {
    process.stdout.write(question);
    return readLineSync().trim();
}
/**
 * Ask the user to pick one numbered option.
 * Returns the zero-based index, or `defaultIndex` when the answer is empty or unparseable.
 */
export function promptChoice(question, options, defaultIndex = 0) {
    process.stdout.write(`${question}\n\n`);
    options.forEach((option, index) => process.stdout.write(`  [${index + 1}] ${option}\n`));
    const answer = promptLine(`\nChoose 1-${options.length} (default ${defaultIndex + 1}): `);
    const picked = Number.parseInt(answer, 10);
    return Number.isInteger(picked) && picked >= 1 && picked <= options.length ? picked - 1 : defaultIndex;
}
function readLineSync() {
    const buffer = Buffer.alloc(1);
    // Fed one byte at a time so a multibyte character split across reads still decodes correctly:
    // `stream: true` holds incomplete sequences internally and returns "" until the last byte arrives.
    const decoder = new TextDecoder("utf-8");
    let line = "";
    while (true) {
        let bytes = 0;
        try {
            bytes = readSync(0, buffer, 0, 1, null);
        }
        catch (error) {
            // A non-blocking TTY returns EAGAIN before input is ready; sleep briefly rather than
            // busy-spinning the CPU while waiting for a keypress.
            if (error.code === "EAGAIN") {
                sleepSync(5);
                continue;
            }
            if (error.code === "EOF")
                break;
            throw error;
        }
        if (bytes === 0)
            break;
        const character = decoder.decode(buffer, { stream: true });
        if (character === "\n")
            break;
        if (character !== "\r")
            line += character;
    }
    return line;
}
function sleepSync(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
