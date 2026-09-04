/** Reads the value following a flag (e.g. `--to v1`). Throws if the flag is given with no value or one that looks like another flag. */
export function valueAfter(args, option) {
    const index = args.indexOf(option);
    if (index === -1)
        return undefined;
    const value = args[index + 1];
    if (!value || value.startsWith("--"))
        throw new Error(`${option} requires a value.`);
    return value;
}
