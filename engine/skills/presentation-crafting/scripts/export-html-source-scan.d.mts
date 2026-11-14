export type SourceAllowance = { directive: string; origin: string; source: string };
export function scanExternalSources(options?: { deckRoot?: string; templateRoot?: string; templateManifestPath?: string; layoutRoots?: string[] }): { allowances: SourceAllowance[]; errors: string[] };
export function allowancesForCsp(scan: { allowances?: SourceAllowance[] }): { styleSrc: string[]; fontSrc: string[]; imgSrc: string[]; mediaSrc: string[]; frameSrc: string[]; scriptSrc: string[] };
