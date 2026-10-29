import assert from "node:assert/strict";
import { test } from "node:test";
import { pickAudienceScreen, popupFeatures, type ScreenInfo } from "../../preview-app/src/presenter/audience-window-placement.ts";

const primary: ScreenInfo = { isPrimary: true, left: 0, top: 0, width: 1440, height: 900 };
const projector: ScreenInfo = { isPrimary: false, left: 1440, top: 0, width: 1920, height: 1080 };

test("chooses the external screen", () => {
  assert.deepEqual(pickAudienceScreen([primary, projector], primary), { screen: projector, reason: "external" });
  assert.match(popupFeatures(projector), /left=1440,top=0,width=1920,height=1080/);
});

test("falls back on a single screen or when the external screen is the presenter's own", () => {
  assert.equal(pickAudienceScreen([primary], primary).reason, "single-screen");
  assert.equal(pickAudienceScreen([primary, projector], projector).reason, "single-screen");
  assert.equal(pickAudienceScreen([], undefined).screen, null);
  assert.equal(popupFeatures(null), "popup,width=1280,height=720");
});
