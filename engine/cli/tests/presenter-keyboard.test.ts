import assert from "node:assert/strict";
import { test } from "node:test";
import { presenterKeyAction } from "../../preview-app/src/presenter/presenter-keyboard.ts";

test("navigation and toggle keys map to actions", () => {
  assert.equal(presenterKeyAction({ key: "ArrowRight" }), "next");
  assert.equal(presenterKeyAction({ key: " " }), "next");
  assert.equal(presenterKeyAction({ key: "PageUp" }), "prev");
  assert.equal(presenterKeyAction({ key: "B" }), "black");
  assert.equal(presenterKeyAction({ key: "f" }), "freeze");
  assert.equal(presenterKeyAction({ key: "=" }), "zoom-in");
  assert.equal(presenterKeyAction({ key: "-" }), "zoom-out");
});

test("typing in a field or using a modifier maps to nothing", () => {
  assert.equal(presenterKeyAction({ key: "ArrowRight", inEditable: true }), null);
  assert.equal(presenterKeyAction({ key: "f", metaKey: true }), null);
  assert.equal(presenterKeyAction({ key: "x" }), null);
});
