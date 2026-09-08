import assert from "node:assert/strict";
import test from "node:test";
import { addMapEntry, moveSequenceItem, parseYamlDocument, removeNode, renameMapKey, setScalar } from "../../preview-app/src/yaml-document-edit.ts";

test("YAML document edits preserve untouched comments and support row mutations", () => {
  const document = parseYamlDocument("# slide comment\nid: welcome\ntitle: Before\nitems:\n  - First\n  - Second\n");
  setScalar(document, ["title"], "After");
  assert.equal(renameMapKey(document, ["title"], "heading"), undefined);
  moveSequenceItem(document, ["items"], 1, -1);
  addMapEntry(document, []);
  removeNode(document, ["newKey"]);
  assert.equal(String(document), "# slide comment\nid: welcome\nheading: After\nitems:\n  - Second\n  - First\n");
});

test("YAML document edits reject duplicate mapping keys", () => {
  const document = parseYamlDocument("id: welcome\ntitle: Hello\n");
  assert.equal(renameMapKey(document, ["title"], "id"), '"id" already exists here.');
  assert.match(String(document), /title: Hello/);
});
