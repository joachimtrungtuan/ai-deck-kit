import assert from "node:assert/strict";
import { test } from "node:test";
import { recordVisit, rehearsalMarkdown, rehearsalRows } from "../../preview-app/src/presenter/rehearsal-log.ts";

const slides = [{ id: "a", title: "Intro", targetSeconds: 60 }, { id: "b", title: "Pri|cing" }, { id: "c", title: "Unvisited" }];

test("revisits accumulate and zero-length visits are ignored", () => {
  let log = recordVisit([], "a", 30000);
  log = recordVisit(log, "b", 10000);
  log = recordVisit(log, "a", 45000);
  log = recordVisit(log, "c", 0);
  assert.deepEqual(log, [{ slideId: "a", ms: 75000 }, { slideId: "b", ms: 10000 }]);
});

test("rows follow deck order and markdown compares to target", () => {
  const rows = rehearsalRows([{ slideId: "b", ms: 10000 }, { slideId: "a", ms: 75000 }], slides);
  assert.deepEqual(rows.map((r) => r.slideId), ["a", "b"]);
  const md = rehearsalMarkdown(rows);
  assert.match(md, /\| 1 \| Intro \| 1:15 \| 1:00 \| \+0:15 \|/);
  assert.match(md, /Pri\\\|cing \| 0:10 \| – \| – \|/);
  assert.match(md, /\*\*1:25\*\*/);
});
