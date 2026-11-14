import { useEffect, useState, useSyncExternalStore } from "react";
import { deckAssets } from "virtual:aideck-deck";
import { AssetLoader, decodeImage, slideAssetPaths } from "./export-asset-loader.ts";
import type { PreviewSource } from "./preview-types";

/**
 * Starts loading the deck's images and keeps the static loader in `export.html` in step: it fills
 * as the first slides arrive and leaves once `until` is met. The loader sits outside React so it
 * paints before any script has run.
 */
export function useExportAssetLoader(source: PreviewSource, until: "startup" | "all"): AssetLoader {
  const [loader] = useState(
    () =>
      new AssetLoader({
        slidePaths: source.slides.map((slide) => slideAssetPaths([slide.props, slide.override], deckAssets)),
        getPayload: async (path) => deckAssets[path],
        decode: decodeImage,
      }),
  );
  const version = useSyncExternalStore(loader.subscribe, loader.getVersion);
  useEffect(() => loader.start(), [loader]);
  useEffect(() => {
    const element = document.getElementById("export-loader");
    if (!element) return;
    if (until === "all" ? loader.isAllReady() : loader.isStartupReady()) return element.remove();
    const { done, total } = loader.startupProgress();
    const bar = element.firstElementChild as HTMLElement | null;
    bar?.classList.add("is-determinate");
    bar?.style.setProperty("--export-loader-progress", `${total === 0 ? 0 : Math.round((done / total) * 100)}%`);
  }, [loader, until, version]);
  return loader;
}
