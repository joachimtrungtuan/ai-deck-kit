declare module "virtual:aideck-deck" {
  import type { PreviewSource } from "./preview-types";
  export const runtimeDeck: PreviewSource | null;
  export const runtimeTemplate: PreviewSource | null;
}
