import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

const projectRoot = fileURLToPath(new URL("../../..", import.meta.url));
const require = createRequire(import.meta.url);

test("v2 parser forwards Technical YAML metadata to layout props", () => {
  const outputDir = mkdtempSync(join(tmpdir(), "aideck-v2-parser-test-"));
  const bundlePath = join(outputDir, "content-schema-v2.cjs");
  try {
    buildSync({
      entryPoints: [join(projectRoot, "engine", "preview-app", "src", "content-schema-v2.tsx")],
      bundle: true,
      format: "cjs",
      outfile: bundlePath,
      platform: "node",
    });
    const { createManifestDeckSourceV2 } = require(bundlePath) as typeof import("../../preview-app/src/content-schema-v2.tsx");
    const source = createManifestDeckSourceV2(
      {
        title: "Technical",
        slug: "technical",
        template: { set: "swiss-modern" },
        slides: [
          { id: "terminal", type: "terminal-output" },
          { id: "flow", type: "data-flow" },
          { id: "api", type: "api-endpoint" },
          { id: "decision", type: "decision-record" },
        ],
      },
      `## Slide 01

\`\`\`yaml
id: terminal
title: Terminal
commands:
  - prompt: aideck serve
    output: ready
\`\`\`

## Slide 02

\`\`\`yaml
id: flow
title: Flow
flowSteps:
  - from: Content
    to: Preview
    label: Render
\`\`\`

## Slide 03

\`\`\`yaml
id: api
title: API
method: POST
path: /v1/preview
requestExample: "{}"
responseExample: "{ status: ready }"
\`\`\`

## Slide 04

\`\`\`yaml
id: decision
title: Decision
context: Existing state
decision: Use v2
consequences:
  - Portable decks
\`\`\``,
      "swiss-deck",
      {
        "terminal-output": () => null,
        "data-flow": () => null,
        "api-endpoint": () => null,
        "decision-record": () => null,
      },
    );

    assert.deepEqual(source.slides[0].props.commands, [{ prompt: "aideck serve", output: "ready" }]);
    assert.deepEqual(source.slides[1].props.flowSteps, [{ from: "Content", to: "Preview", label: "Render" }]);
    assert.deepEqual(source.slides[2].props, expectApiProps());
    assert.deepEqual(source.slides[3].props.context, "Existing state");
    assert.deepEqual(source.slides[3].props.decision, "Use v2");
    assert.deepEqual(source.slides[3].props.consequences, ["Portable decks"]);
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
});

function expectApiProps() {
  return {
    animation: "gentle-rise",
    kicker: undefined,
    title: "API",
    body: undefined,
    items: [],
    leftTitle: undefined,
    rightTitle: undefined,
    tableColumns: undefined,
    tableRows: undefined,
    code: undefined,
    language: undefined,
    highlightLines: undefined,
    commands: undefined,
    flowSteps: undefined,
    method: "POST",
    path: "/v1/preview",
    requestExample: "{}",
    responseExample: "{ status: ready }",
    layoutVariant: undefined,
    backgroundVariant: undefined,
    highlightPhrase: undefined,
    courseName: "Technical",
    lessonName: undefined,
    sectionName: undefined,
    imageSrc: undefined,
    imageAlt: undefined,
    imagePosition: undefined,
    images: undefined,
    caption: undefined,
    source: undefined,
    attribution: undefined,
    metric: undefined,
    metricLabel: undefined,
    chartData: undefined,
    stats: undefined,
    regionSeries: undefined,
    index: undefined,
    recommendedColumn: undefined,
    context: undefined,
    decision: undefined,
    consequences: undefined,
    pageCurrent: 3,
    pageTotal: 4,
  };
}
