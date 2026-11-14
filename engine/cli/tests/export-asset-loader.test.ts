import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { AssetLoader, slideAssetPaths } from "../../preview-app/src/export-asset-loader.ts";

const settleMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

/** A payload source whose requests stay open until the test resolves or rejects them. */
function manualSource() {
  const requested: string[] = [];
  const pending = new Map<string, { resolve: () => void; reject: () => void }>();
  return {
    requested,
    getPayload: (path: string) => {
      requested.push(path);
      return new Promise<string>((resolve, reject) => pending.set(path, { resolve: () => resolve(`payload:${path}`), reject: () => reject(new Error(path)) }));
    },
    async finish(...paths: string[]) {
      for (const path of paths) pending.get(path)?.resolve();
      await settleMicrotasks();
    },
    async fail(...paths: string[]) {
      for (const path of paths) pending.get(path)?.reject();
      await settleMicrotasks();
    },
    openPaths: () => [...pending.keys()],
  };
}

const decodeAnything = async () => {};
const slidePath = (index: number) => `assets/slide-${index + 1}.png`;
const fortySlides = () => Array.from({ length: 40 }, (_, index) => [slidePath(index)]);

test("loads the first four slides before anything else, then continues in slide order", async () => {
  const source = manualSource();
  const loader = new AssetLoader({ slidePaths: fortySlides(), getPayload: source.getPayload, decode: decodeAnything });
  loader.start();
  assert.deepEqual(source.requested, [0, 1, 2, 3].map(slidePath));
  assert.equal(loader.isStartupReady(), false);

  await source.finish(slidePath(0), slidePath(1), slidePath(2));
  assert.deepEqual(source.requested, [0, 1, 2, 3].map(slidePath), "nothing past slide 4 starts while slide 4 is still loading");

  await source.finish(slidePath(3));
  assert.equal(loader.isStartupReady(), true);
  assert.deepEqual(source.requested.slice(4), [4, 5, 6, 7].map(slidePath));
});

test("a jump re-aims loading at the target, the slides after it, then the rest in order", async () => {
  const source = manualSource();
  const loader = new AssetLoader({ slidePaths: fortySlides(), getPayload: source.getPayload, decode: decodeAnything });
  loader.start();
  await source.finish(...[0, 1, 2, 3].map(slidePath));
  loader.prioritise(37);
  await source.finish(...[4, 5, 6, 7].map(slidePath));
  assert.deepEqual(source.requested.slice(8, 12), [37, 38, 39, 8].map(slidePath));
  assert.equal(loader.isSlideReady(37), false);
  await source.finish(slidePath(37));
  assert.equal(loader.isSlideReady(37), true);
});

test("an early jump starts the target before the startup batch settles", async () => {
  const source = manualSource();
  const loader = new AssetLoader({ slidePaths: fortySlides(), getPayload: source.getPayload, decode: decodeAnything });
  loader.start();
  loader.prioritise(37);
  assert.equal(source.requested[4], slidePath(37));
  await source.finish(slidePath(37));
  assert.equal(loader.isSlideReady(37), true);
});

test("a path that has loaded or is loading is never requested again", async () => {
  const source = manualSource();
  const loader = new AssetLoader({ slidePaths: fortySlides(), getPayload: source.getPayload, decode: decodeAnything, concurrency: 40 });
  loader.start();
  await source.finish(...[0, 1, 2, 3].map(slidePath));
  loader.prioritise(10);
  loader.prioritise(2);
  loader.prioritise(10);
  await source.finish(...source.openPaths());
  await source.finish(...source.openPaths());
  assert.equal(source.requested.length, 40);
  assert.equal(new Set(source.requested).size, 40);
  assert.equal(loader.isAllReady(), true);
});

test("a path shared by several slides is fetched once and readies every slide using it", async () => {
  const source = manualSource();
  const logo = "assets/logo.png";
  const loader = new AssetLoader({
    slidePaths: [[logo, "assets/a.png"], [logo], [logo, "assets/b.png", logo], []],
    getPayload: source.getPayload,
    decode: decodeAnything,
    startupSlides: 4,
  });
  loader.start();
  assert.deepEqual(source.requested, [logo, "assets/a.png", "assets/b.png"]);
  await source.finish(logo);
  assert.equal(loader.isSlideReady(1), true);
  assert.equal(loader.isSlideReady(0), false, "needs a.png as well");
  assert.equal(loader.isSlideReady(3), true, "a slide with no assets is always ready");
  await source.finish("assets/a.png", "assets/b.png");
  assert.equal(loader.isStartupReady(), true);
  assert.deepEqual(source.requested, [logo, "assets/a.png", "assets/b.png"]);
});

test("a slide is ready only when every one of its paths is ready", async () => {
  const source = manualSource();
  const loader = new AssetLoader({
    slidePaths: [["assets/a.png", "assets/b.png", "assets/c.png"]],
    getPayload: source.getPayload,
    decode: decodeAnything,
  });
  loader.start();
  await source.finish("assets/a.png", "assets/b.png");
  assert.equal(loader.isSlideReady(0), false);
  assert.deepEqual(loader.startupProgress(), { done: 2, total: 3 });
  await source.finish("assets/c.png");
  assert.equal(loader.isSlideReady(0), true);
});

test("a failed fetch or decode keeps the affected slide unready and reports the path", async () => {
  const source = manualSource();
  const loader = new AssetLoader({
    slidePaths: [["assets/missing.png"], ["assets/corrupt.png"]],
    getPayload: source.getPayload,
    decode: async (payload) => {
      if (payload.includes("corrupt")) throw new Error("undecodable");
    },
  });
  loader.start();
  await source.fail("assets/missing.png");
  await source.finish("assets/corrupt.png");
  assert.equal(loader.isStartupReady(), false);
  assert.equal(loader.isAllReady(), false);
  assert.deepEqual(loader.failurePaths(), ["assets/missing.png", "assets/corrupt.png"]);
  assert.equal(loader.hasSlideFailure(0), true);
});

test("subscribers hear every state change and can unsubscribe", async () => {
  const source = manualSource();
  const loader = new AssetLoader({ slidePaths: [["assets/a.png"]], getPayload: source.getPayload, decode: decodeAnything });
  let heard = 0;
  const unsubscribe = loader.subscribe(() => (heard += 1));
  const before = loader.getVersion();
  loader.start();
  await source.finish("assets/a.png");
  assert.ok(heard >= 2);
  assert.ok(loader.getVersion() > before);
  unsubscribe();
  const settledHeard = heard;
  loader.start();
  assert.equal(heard, settledHeard);
});

test("slideAssetPaths finds table assets in props and overrides and ignores unknown keys", () => {
  const table = { "assets/a.png": "data:image/png;base64,AA", "assets/b.png": "data:image/png;base64,BB" };
  const paths = slideAssetPaths(
    [{ image: "assets/a.png", rows: [{ logo: "assets/b.png", text: "assets/not-in-table.png" }] }, { html: '<img src="assets/a.png">' }],
    table,
  );
  assert.deepEqual(paths.sort(), ["assets/a.png", "assets/b.png"]);
});

test("PDF capture waits for a delayed real browser readiness marker", (t) => {
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const imageMagick = "/opt/homebrew/bin/magick";
  if (!existsSync(chrome) || !existsSync(imageMagick)) {
    t.skip("Chrome and ImageMagick are required for the transport regression");
    return;
  }
  const work = mkdtempSync(join(tmpdir(), "aideck-pdf-readiness-"));
  try {
    const html = join(work, "delayed.html");
    const output = join(work, "delayed.pdf");
    writeFileSync(html, `<!doctype html><style>*{box-sizing:border-box}html,body{margin:0;background:#000}.deck-page{width:1600px;height:900px;background:#123;color:#fff;font:48px sans-serif}</style><div class="print-deck"><div class="deck-page">ready</div></div><script>setTimeout(() => document.documentElement.dataset.exportReady = "true", 250)</script>`);
    execFileSync(process.execPath, [resolve("engine/skills/presentation-crafting/scripts/export-pdf.mjs"), "--html", html, "--out", output, "--chrome", chrome, "--imagemagick", imageMagick], { encoding: "utf8" });
    assert.ok(existsSync(output));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test("PDF capture rejects a delayed browser asset error marker", (t) => {
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const imageMagick = "/opt/homebrew/bin/magick";
  if (!existsSync(chrome) || !existsSync(imageMagick)) {
    t.skip("Chrome and ImageMagick are required for the transport regression");
    return;
  }
  const work = mkdtempSync(join(tmpdir(), "aideck-pdf-error-"));
  try {
    const html = join(work, "error.html");
    const output = join(work, "error.pdf");
    writeFileSync(html, `<!doctype html><div class="deck-page" style="width:1600px;height:900px">error</div><script>setTimeout(() => document.documentElement.dataset.exportError = "assets/broken.png", 150)</script>`);
    assert.throws(() => execFileSync(process.execPath, [resolve("engine/skills/presentation-crafting/scripts/export-pdf.mjs"), "--html", html, "--out", output, "--chrome", chrome, "--imagemagick", imageMagick], { encoding: "utf8", stdio: "pipe" }), /status 1|PDF export failed/);
    assert.equal(existsSync(output), false);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
