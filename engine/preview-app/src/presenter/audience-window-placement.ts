// Chooses where the audience window goes. The decision is pure; the browser wrapper only gathers inputs.
export type ScreenInfo = { isPrimary: boolean; left: number; top: number; width: number; height: number; label?: string };
export type PlacementReason = "external" | "single-screen" | "unsupported" | "denied";
export type Placement = { screen: ScreenInfo | null; reason: PlacementReason };

const sameScreen = (a: ScreenInfo, b: ScreenInfo) => a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;

/** First non-primary screen that is not the one the presenter window is on. */
export function pickAudienceScreen(screens: ReadonlyArray<ScreenInfo>, presenterScreen?: ScreenInfo): Placement {
  if (screens.length < 2) return { screen: null, reason: "single-screen" };
  const external = screens.find((screen) => !screen.isPrimary && !(presenterScreen && sameScreen(screen, presenterScreen)));
  return external ? { screen: external, reason: "external" } : { screen: null, reason: "single-screen" };
}

export function popupFeatures(screen: ScreenInfo | null): string {
  if (!screen) return "popup,width=1280,height=720";
  return `popup,left=${screen.left},top=${screen.top},width=${screen.width},height=${screen.height}`;
}

export const PLACEMENT_HINT: Record<PlacementReason, string> = {
  external: "",
  "single-screen": "Only one screen detected. Drag the audience window to the projector, then press Ctrl+Cmd+F (macOS) or F11 for fullscreen.",
  unsupported: "This browser cannot position windows on other screens. Drag the audience window to the projector, then press Ctrl+Cmd+F (macOS) or F11 for fullscreen.",
  denied: "Screen access was declined, so the window opened beside this one. Drag it to the projector and go fullscreen, or allow window management and try again.",
};

type ScreenDetailsApi = { screens: Array<ScreenInfo & { availLeft?: number; availTop?: number }>; currentScreen: ScreenInfo };

/** Opens the audience window on an external screen when the Window Management API allows; falls back to a plain popup. */
export async function openAudienceWindow(url: string): Promise<{ opened: Window | null; placement: Placement }> {
  let placement: Placement = { screen: null, reason: "unsupported" };
  const getScreenDetails = (window as unknown as { getScreenDetails?: () => Promise<ScreenDetailsApi> }).getScreenDetails;
  if (getScreenDetails) {
    try {
      const details = await getScreenDetails.call(window);
      placement = pickAudienceScreen(details.screens, details.currentScreen);
    } catch { placement = { screen: null, reason: "denied" }; }
  }
  return { opened: window.open(url, "aideck-audience", popupFeatures(placement.screen)), placement };
}
