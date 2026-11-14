export type CspAllowances = {
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  fontSrc?: string[];
  mediaSrc?: string[];
  frameSrc?: string[];
};

export function addExportSecurityMeta(html: string, options?: { mode?: "single" | "web"; allowances?: CspAllowances }): string;
export const exportFrameBusterScript: string;
export function hashInlineContent(text: string): string;
