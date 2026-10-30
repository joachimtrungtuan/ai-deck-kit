declare module "virtual:aideck-deck" {
  import type { PreviewSource } from "./preview-types";
  export const runtimeDeck: PreviewSource | null;
  export const runtimeTemplate: PreviewSource | null;
  /** Every template this project can resolve, as the CLI resolved it. Empty when run outside the CLI. */
  /** Vite /@fs URL of the deck's built export; null without a deck. The file exists only after an export. */
  export const runtimeDeckExportUrl: string | null;
  /** Changes on every dev-server start; null in a build. */
  export const runtimeServerRunId: number | null;
  export const runtimeGallery: PreviewSource[];
}
