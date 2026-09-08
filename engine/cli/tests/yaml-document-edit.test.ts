import assert from "node:assert/strict";
import test from "node:test";
import { addMapEntry, moveSequenceItem, parseYamlDocument, removeNode, renameMapKey, serializeYamlDocument, setScalar } from "../../preview-app/src/yaml-document-edit.ts";

test("YAML document edits preserve untouched comments and support row mutations", () => {
  const document = parseYamlDocument("# slide comment\nid: welcome\ntitle: Before\nitems:\n  - First\n  - Second\n");
  setScalar(document, ["title"], "After");
  assert.equal(renameMapKey(document, ["title"], "heading"), undefined);
  moveSequenceItem(document, ["items"], 1, -1);
  addMapEntry(document, []);
  removeNode(document, ["newKey"]);
  assert.equal(String(document), "# slide comment\nid: welcome\nheading: After\nitems:\n  - Second\n  - First\n");
});

test("editing a value keeps that line's own comment and quote style", () => {
  const document = parseYamlDocument(`id: welcome\ntitle: "Before" # keep me\nkicker: 'Single'\n# above description\ndescription: Plain\n`);
  setScalar(document, ["title"], "After");
  setScalar(document, ["kicker"], "Changed");
  setScalar(document, ["description"], "Updated");
  assert.equal(String(document), `id: welcome\ntitle: "After" # keep me\nkicker: 'Changed'\n# above description\ndescription: Updated\n`);
});

test("renaming a key keeps the comment written above it", () => {
  const document = parseYamlDocument("# above title\ntitle: Hello # trailing\n");
  assert.equal(renameMapKey(document, ["title"], "heading"), undefined);
  assert.equal(String(document), "# above title\nheading: Hello # trailing\n");
});

test("typed text is stored verbatim instead of being re-parsed as YAML", () => {
  const document = parseYamlDocument("title: Before\nsubtitle: Before\ncode: Before\nversion: Before\nleading: Before\n");
  setScalar(document, ["title"], "#1 in market");
  setScalar(document, ["subtitle"], "null");
  setScalar(document, ["code"], "007");
  setScalar(document, ["version"], "1.10");
  setScalar(document, ["leading"], "  padded  ");
  const reparsed = parseYamlDocument(String(document)).toJS() as Record<string, unknown>;
  assert.deepEqual(reparsed, { title: "#1 in market", subtitle: "null", code: "007", version: "1.10", leading: "  padded  " });
});

test("numeric and boolean scalars keep their type while the text still parses as one", () => {
  const document = parseYamlDocument("index: 3\nrecommended: true\n");
  setScalar(document, ["index"], "5");
  setScalar(document, ["recommended"], "false");
  assert.deepEqual(parseYamlDocument(String(document)).toJS(), { index: 5, recommended: false });
  setScalar(document, ["index"], "n/a");
  assert.deepEqual(parseYamlDocument(String(document)).toJS(), { index: "n/a", recommended: false });
});

test("YAML document edits reject duplicate mapping keys", () => {
  const document = parseYamlDocument("id: welcome\ntitle: Hello\n");
  assert.equal(renameMapKey(document, ["title"], "id"), '"id" already exists here.');
  assert.match(String(document), /title: Hello/);
});

test("saving keeps untouched long scalars and block scalars exactly as authored", () => {
  const source = `id: slide-20\ntitle: Before\nimageAlt: "Dashboard mock showing rainfall bars, temperature line, and a green health badge"\ncode: |\n  const stations = await loadStations({ region: "north", includeArchived: false, limit: 250 });\n  render(stations);\n`;
  const document = parseYamlDocument(source);
  setScalar(document, ["title"], "After");
  assert.equal(serializeYamlDocument(document), source.replace("title: Before", "title: After"));
});
