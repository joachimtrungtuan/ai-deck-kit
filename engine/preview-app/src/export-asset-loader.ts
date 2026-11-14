import { assetKeysInString, visitStrings } from "./deck-asset-paths.ts";

export type AssetState = "pending" | "loading" | "ready" | "failed";

export type AssetLoaderOptions = {
  /** Asset paths each slide renders, in slide order. A path shared by several slides is loaded once. */
  slidePaths: string[][];
  /** Where a path's payload comes from: a data URI, or a URL the browser can fetch as an image. */
  getPayload: (path: string) => Promise<string>;
  /** Resolves once the payload is decoded and ready to paint. Rejects when it cannot be. */
  decode: (payload: string) => Promise<void>;
  /** Slides gating the deck start; nothing after them loads until they have settled. */
  startupSlides?: number;
  concurrency?: number;
};

const DEFAULT_STARTUP_SLIDES = 4;
const DEFAULT_CONCURRENCY = 4;

/** Asset keys one slide renders, found the same way the export collector and the resolver find them. */
export function slideAssetPaths(renderValues: unknown[], table: Record<string, string>): string[] {
  const paths = new Set<string>();
  for (const value of renderValues) {
    visitStrings(value, (text) => assetKeysInString(text).forEach((key) => key in table && paths.add(key)));
  }
  return [...paths];
}

/** Decodes an image off the main thread so painting it later does not stall navigation. */
export async function decodeImage(src: string): Promise<void> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => {
      // Chromium can leave HTMLImageElement.decode() pending for large inline SVG data URLs.
      // createImageBitmap performs an independent decode after load and gives us a resolved,
      // paintable bitmap without treating load alone as sufficient readiness.
      if (typeof createImageBitmap === "function") {
        void createImageBitmap(image).then((bitmap) => {
          bitmap.close();
          resolve();
        }, () => {
          // Some browsers expose createImageBitmap but reject particular image formats. Retry the
          // native image decoder before surfacing the asset failure; load alone is never enough.
          void image.decode().then(resolve, reject);
        });
      } else {
        void image.decode().then(resolve, reject);
      }
    };
    image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
    image.src = src;
  });
}

/**
 * Loads a deck's images in the order the viewer will need them: the first slides first, then the
 * rest in slide order, re-aimed at whichever slide the viewer jumps to. A failed asset counts as
 * settled, so one missing file never holds the deck back; its slide just renders without it.
 */
export class AssetLoader {
  private readonly options: AssetLoaderOptions;
  private readonly slidePaths: string[][];
  private readonly states = new Map<string, AssetState>();
  private readonly startupSlides: number;
  private readonly concurrency: number;
  private readonly listeners = new Set<() => void>();
  private focus = 0;
  private priorityInFlight = false;
  private active = 0;
  private started = false;
  private version = 0;

  constructor(options: AssetLoaderOptions) {
    this.options = options;
    this.slidePaths = options.slidePaths.map((paths) => [...new Set(paths)]);
    this.startupSlides = Math.min(options.startupSlides ?? DEFAULT_STARTUP_SLIDES, this.slidePaths.length);
    this.concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
    for (const paths of this.slidePaths) for (const path of paths) this.states.set(path, "pending");
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.pump();
    this.notify();
  }

  /** Aims loading at `slideIndex`, then the slides after it, then the ones before it. */
  prioritise(slideIndex: number): void {
    if (slideIndex < 0 || slideIndex >= this.slidePaths.length) return;
    if (slideIndex === this.focus && this.started) return;
    this.focus = slideIndex;
    if (this.started) this.pump();
  }

  isSlideReady(slideIndex: number): boolean {
    return (this.slidePaths[slideIndex] ?? []).every((path) => this.states.get(path) === "ready");
  }

  /** True once every asset of the startup slides has settled. */
  isStartupReady(): boolean {
    return this.startupPaths().every((path) => this.states.get(path) === "ready");
  }

  isAllReady(): boolean {
    return [...this.states.keys()].every((path) => this.states.get(path) === "ready");
  }

  hasSlideFailure(slideIndex: number): boolean {
    return (this.slidePaths[slideIndex] ?? []).some((path) => this.states.get(path) === "failed");
  }

  failurePaths(slideIndex?: number): string[] {
    const paths = slideIndex === undefined ? [...this.states.keys()] : this.slidePaths[slideIndex] ?? [];
    return paths.filter((path) => this.states.get(path) === "failed");
  }

  hasFailure(): boolean {
    return this.failurePaths().length > 0;
  }

  /** Startup-slide assets settled so far, against how many there are. */
  startupProgress(): { done: number; total: number } {
    return this.progressOf(this.startupPaths());
  }

  slideProgress(slideIndex: number): { done: number; total: number } {
    return this.progressOf(this.slidePaths[slideIndex] ?? []);
  }

  /** Changes whenever any asset changes state, for `useSyncExternalStore`. */
  getVersion = (): number => this.version;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private settled(path: string): boolean {
    const state = this.states.get(path);
    return state === "ready";
  }

  private progressOf(paths: string[]): { done: number; total: number } {
    return { done: paths.filter((path) => this.settled(path)).length, total: paths.length };
  }

  private startupPaths(): string[] {
    return [...new Set(this.slidePaths.slice(0, this.startupSlides).flat())];
  }

  private notify(): void {
    this.version += 1;
    this.listeners.forEach((listener) => listener());
  }

  /** Slide indexes in the order loading should visit them. */
  private order(): number[] {
    const count = this.slidePaths.length;
    if (this.focus > 0 && !this.isStartupReady()) {
      const prioritised = Array.from({ length: count }, (_, offset) => (this.focus + offset) % count);
      const startup = Array.from({ length: this.startupSlides }, (_, index) => index);
      return [...new Set([...prioritised, ...startup])];
    }
    if (!this.isStartupReady()) return Array.from({ length: this.startupSlides }, (_, index) => index);
    return Array.from({ length: count }, (_, offset) => (this.focus + offset) % count);
  }

  private nextPending(): string | undefined {
    for (const index of this.order()) {
      const path = this.slidePaths[index].find((candidate) => this.states.get(candidate) === "pending");
      if (path) return path;
    }
    return undefined;
  }

  private pump(): void {
    while (this.active < this.concurrency || (this.focus > 0 && !this.isStartupReady() && !this.priorityInFlight)) {
      const path = this.nextPending();
      if (!path) return;
      const priority = this.active >= this.concurrency;
      if (priority) this.priorityInFlight = true;
      void this.load(path, priority);
    }
  }

  private async load(path: string, priority = false): Promise<void> {
    this.states.set(path, "loading");
    this.active += 1;
    let outcome: AssetState = "ready";
    try {
      await this.options.decode(await this.options.getPayload(path));
    } catch {
      outcome = "failed";
    }
    this.active -= 1;
    this.states.set(path, outcome);
    if (priority) this.priorityInFlight = false;
    this.pump();
    this.notify();
  }
}
