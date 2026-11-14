type PayloadMap = Record<string, string>;

export function shouldReadAssetBlock(block: { nextElementSibling: unknown; dataset: { read?: string } }, force = false): boolean {
  return !block.dataset.read && (force || Boolean(block.nextElementSibling));
}

class ExportDataBlockSource {
  private readonly payloads: PayloadMap = {};
  private readonly waiters = new Map<string, Array<{ resolve: (value: string) => void; reject: (error: Error) => void }>>();
  private closed = false;

  constructor() {
    const scan = (force = false) => document.querySelectorAll<HTMLScriptElement>("script[type='text/plain'][data-slide]").forEach((block) => this.read(block, force));
    scan();
    new MutationObserver(() => scan()).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("DOMContentLoaded", () => { scan(true); this.closed = true; this.rejectMissing(); });
  }

  getPayload(path: string): Promise<string> {
    if (path in this.payloads) return Promise.resolve(this.payloads[path]);
    if (this.closed) return Promise.reject(new Error(`Asset data block did not contain ${path}`));
    return new Promise((resolve, reject) => this.waiters.set(path, [...(this.waiters.get(path) ?? []), { resolve, reject }]));
  }

  table(): PayloadMap { return { ...this.payloads }; }

  private read(block: HTMLScriptElement, force = false): void {
    if (!shouldReadAssetBlock(block, force)) return;
    let parsed: unknown;
    try { parsed = JSON.parse(block.textContent ?? "{}"); } catch {
      block.dataset.read = "error";
      this.rejectAll(new Error(`Invalid asset data block ${block.dataset.slide ?? "unknown"}`));
      return;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      block.dataset.read = "error";
      this.rejectAll(new Error(`Invalid asset data block ${block.dataset.slide ?? "unknown"}`));
      return;
    }
    block.dataset.read = "true";
    for (const [path, payload] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof payload !== "string") continue;
      this.payloads[path] = payload;
      this.waiters.get(path)?.splice(0).forEach(({ resolve }) => resolve(payload));
      this.waiters.delete(path);
    }
  }

  private rejectAll(error: Error): void {
    for (const waiters of this.waiters.values()) waiters.splice(0).forEach(({ reject }) => reject(error));
    this.waiters.clear();
  }

  private rejectMissing(): void {
    for (const [path, waiters] of this.waiters) {
      waiters.splice(0).forEach(({ reject }) => reject(new Error(`Asset data blocks ended before ${path} was provided`)));
    }
    this.waiters.clear();
  }
}

export const exportDataBlockSource = typeof document === "undefined" ? (undefined as unknown as ExportDataBlockSource) : new ExportDataBlockSource();
export const getExportAssetTable = (): PayloadMap => exportDataBlockSource.table();
