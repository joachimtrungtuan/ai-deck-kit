import fs from "node:fs";
import path from "node:path";
import { brotliDecompressSync, inflateSync } from "node:zlib";
const CATALOG_FAMILIES = new Set(["inter", "jetbrains-mono", "newsreader", "dm-sans", "figtree", "fraunces", "lora", "manrope", "plus-jakarta-sans", "source-serif-4", "space-grotesk", "work-sans"]);

export function readFontFsType(input) {
  const bytes = Buffer.isBuffer(input) ? input : fs.readFileSync(input);
  try {
    let data = bytes;
    if (data.subarray(0, 4).toString() === "wOFF") {
      if (data.length < 44 || data.readUInt32BE(8) > data.length || data.readUInt32BE(8) < 44) return null;
      const flavor = data.readUInt32BE(4); const length = data.readUInt32BE(16); const numTables = data.readUInt16BE(12);
      if (44 + numTables * 20 > data.length) return null;
      for (let i = 0; i < numTables; i++) { const p = 44 + i * 20; const tag = data.subarray(p, p + 4).toString(); const off = data.readUInt32BE(p + 4); const compLength = data.readUInt32BE(p + 8); const originalLength = data.readUInt32BE(p + 12); if (off > data.length || compLength > data.length - off || originalLength < 10) return null; if (tag !== "OS/2") continue; const raw = data.subarray(off, off + compLength); data = compLength === originalLength ? raw : inflateSync(raw); return data.length >= 10 ? data.readUInt16BE(8) : null; }
      return null;
    }
    if (data.subarray(0, 4).toString() === "wOF2") return readWoff2FsType(data);
    if (!["\0\x01\0\0", "OTTO", "true", "typ1"].includes(data.subarray(0, 4).toString("latin1")) || data.length < 12) return null;
    const numTables = data.readUInt16BE(4);
    if (12 + numTables * 16 > data.length) return null;
    for (let i = 0; i < numTables; i++) { const p = 12 + i * 16; if (data.subarray(p, p + 4).toString() === "OS/2") { const off = data.readUInt32BE(p + 8); const length = data.readUInt32BE(p + 12); if (off > data.length || length < 10 || length > data.length - off) return null; return data.readUInt16BE(off + 8); } }
    return null;
  } catch { return null; }
}

function readWoff2FsType(bytes) {
  try {
    const numTables = bytes.readUInt16BE(12);
    let cursor = 48;
    const records = [];
    const knownTags = ["cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar", "bdat", "bloc", "bsln", "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd", "prop", "Trak", "Zapf", "Silf", "Glat", "Gloc", "Feat", "Sill" ];
    for (let i = 0; i < numTables; i++) {
      const flags = bytes[cursor++];
      const tagIndex = flags & 0x3f;
      const tag = tagIndex === 0x3f ? bytes.subarray(cursor, cursor += 4).toString() : knownTags[tagIndex];
      const originalLength = readBase128(bytes, () => cursor++);
      const transformVersion = flags >> 6;
      const transformed = ["glyf", "loca", "hmtx", "vmtx", "TSI0", "TSI1", "TSI2", "TSI3"].includes(tag) && transformVersion === 0;
      const transformedLength = transformed ? readBase128(bytes, () => cursor++) : originalLength;
      records.push({ tag, originalLength, transformedLength });
    }
    const compressedLength = bytes.readUInt32BE(20);
    if (cursor > bytes.length || compressedLength > bytes.length - cursor) return null;
    const compressed = brotliDecompressSync(bytes.subarray(cursor, cursor + compressedLength));
    let offset = 0;
    for (const record of records) {
      if (record.transformedLength > compressed.length - offset) return null;
      const table = compressed.subarray(offset, offset + record.transformedLength);
      offset += record.transformedLength;
      if (record.tag === "OS/2") return table.length >= 10 ? table.readUInt16BE(8) : null;
    }
    return null;
  } catch { return null; }
}

function readBase128(bytes, advance) {
  let value = 0;
  for (let count = 0; count < 5; count++) {
    const byte = bytes[advance()];
    if (byte === undefined || (value === 0 && byte === 0x80)) throw new Error("Invalid WOFF2 UIntBase128 value");
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) return value;
  }
  throw new Error("Invalid WOFF2 UIntBase128 length");
}

export function checkTemplateFonts(templateRoot, manifest) {
  const errors = []; const checked = [];
  for (const family of manifest.fonts ?? []) {
    if (CATALOG_FAMILIES.has(family)) { checked.push({ family, source: "catalog", status: "pass" }); continue; }
    if (/googleapis\.com|fonts\.googleapis/i.test(String(family))) { checked.push({ family, source: "google", status: "pass" }); continue; }
    errors.push(`Font family "${family}" is not in the engine font catalog and has no local licence provenance.`);
  }
  for (const file of collectFonts(templateRoot)) {
    try {
      const fsType = readFontFsType(file);
      if (fsType === null) errors.push(`Font licence is unreadable or unsupported: ${file}`);
      else if ((fsType & 0x0002) !== 0) errors.push(`Font embedding is restricted by fsType: ${file}`);
      checked.push({ file, fsType, status: errors.some((e) => e.endsWith(file)) ? "fail" : "pass" });
    } catch { errors.push(`Font licence is unreadable: ${file}`); }
  }
  return { errors, checked };
}

function collectFonts(root) {
  if (!root || !fs.existsSync(root)) return [];
  return fs.readdirSync(root, { recursive: true }).filter((f) => typeof f === "string" && /\.(?:ttf|otf|woff2?)$/i.test(f)).map((f) => path.join(root, f));
}
