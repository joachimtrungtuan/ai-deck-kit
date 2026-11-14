import assert from "node:assert/strict";
import { test } from "node:test";
import { appendSlideDataBlocks } from "../../skills/presentation-crafting/scripts/export-html-slide-data-blocks.mjs";

test("data blocks escape script terminators and preserve first-use placement", () => {
  const html = appendSlideDataBlocks("<body><div id=\"root\"></div></body>", {
    slides: [["assets/shared.png", "assets/first.png"], ["assets/shared.png", "assets/second.png"]],
    assets: {
      "assets/shared.png": "data:image/svg+xml,</script><!--shared>",
      "assets/first.png": "data:image/svg+xml,first",
      "assets/second.png": "data:image/svg+xml,second",
    },
  });
  assert.equal((html.match(/data-slide=/g) ?? []).length, 2);
  assert.equal((html.match(/assets\/shared\.png/g) ?? []).length, 1);
  const blocks = [...html.matchAll(/data-slide="(\d+)">([\s\S]*?)<\/script>/g)];
  assert.equal(blocks[0][2].includes("</script"), false);
  assert.equal(blocks[0][2].includes("<!--"), false);
  assert.deepEqual(JSON.parse(blocks[0][2]), {
    "assets/shared.png": "data:image/svg+xml,</script><!--shared>",
    "assets/first.png": "data:image/svg+xml,first",
  });
  assert.deepEqual(JSON.parse(blocks[1][2]), { "assets/second.png": "data:image/svg+xml,second" });
});
