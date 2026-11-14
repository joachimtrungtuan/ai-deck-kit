export function embedGoogleFonts(css: string, options?: { fetchImpl?: typeof fetch; warn?: (message: string) => void }): Promise<{ css: string; warnings: string[] }>;
export const GOOGLE_ORIGINS: ReadonlySet<string>;
