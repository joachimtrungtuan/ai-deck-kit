type PayloadMap = Record<string, string>;

class ExportDataBlockSource {
  private readonly payloads: PayloadMap = {};
  private readonly waiters = new Map<string, Array<(value: string) => void>>();
  private closed = false;

  constructor() {
    const scan = () => document.querySelectorAll<HTMLScriptElement>("script[type='text/plain'][data-slide]").forEach((block) => this.read(block));
    scan();
    new MutationObserver((records) => records.flatMap((record) => [...record.addedNodes]).forEach((node) => {
      if (node instanceof HTMLScriptElement && node.type === "text/plain" && node.dataset.slide) this.read(node);
    })).observe(document.body, { childList: true });
    document.addEventListener("DOMContentLoaded", () => { this.closed = true; });
  }

  getPayload(path: string): Promise<string> {
    if (path in this.payloads) return Promise.resolve(this.payloads[path]);
    if (this.closed) return Promise.reject(new Error(`Asset data block did not contain ${path}`));
    return new Promise((resolve) => this.waiters.set(path, [...(this.waiters.get(path) ?? []), resolve]));
  }

  table(): PayloadMap { return { ...this.payloads }; }

  private read(block: HTMLScriptElement): void {
    if (block.dataset.read === "true") return;
    block.dataset.read = "true";
    let parsed: unknown;
    try { parsed = JSON.parse(block.textContent ?? "{}"); } catch { return; }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
    for (const [path, payload] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof payload !== "string") continue;
      this.payloads[path] = payload;
      this.waiters.get(path)?.splice(0).forEach((resolve) => resolve(payload));
      this.waiters.delete(path);
    }
  }
}

export const exportDataBlockSource = new ExportDataBlockSource();
export const getExportAssetTable = (): PayloadMap => exportDataBlockSource.table();
