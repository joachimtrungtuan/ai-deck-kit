declare module "virtual:aideck-deck" {
  import type { PreviewSource } from "./preview-types";
  export const runtimeDeck: PreviewSource | null;
  export const runtimeTemplate: PreviewSource | null;
  /** Every template this project can resolve, as the CLI resolved it. Empty when run outside the CLI. */
  export const runtimeGallery: PreviewSource[];
}
