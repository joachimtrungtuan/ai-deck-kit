export function readFontFsType(input: string | Buffer | URL): number | null;
export function checkTemplateFonts(templateRoot: string, manifest: { fonts?: string[] }): { errors: string[]; checked: Array<Record<string, unknown>> };
