import { createHash } from "node:crypto";
import { parseDocument } from "yaml";

type SlideYamlBlock = { bodyEnd: number; bodyStart: number; yaml: string };

/** Returns the raw YAML fence body for a slide identified by its YAML id. */
export function readSlideYamlBlock(content: string, slideId: string): string | undefined {
  return findSlideYamlBlock(content, slideId)?.yaml;
}

/** Replaces only the YAML fence body for one slide, preserving all surrounding bytes. */
export function replaceSlideYamlBlock(content: string, slideId: string, yamlBody: string): string {
  const block = findSlideYamlBlock(content, slideId);
  if (!block) {
    const section = findSlideSection(content, slideId);
    if (section) throw new Error(`Slide ${slideId} has no YAML fence.`);
    throw new Error(`Unknown slide id: ${slideId}`);
  }
  return `${content.slice(0, block.bodyStart)}${yamlBody}${content.slice(block.bodyEnd)}`;
}

function findSlideYamlBlock(content: string, slideId: string): SlideYamlBlock | undefined {
  const section = findSlideSection(content, slideId);
  if (!section) return undefined;
  const fence = /```ya?ml\r?\n([\s\S]*?)\r?\n```/.exec(section.text);
  if (!fence || fence.index === undefined) return undefined;
  const bodyStart = section.start + fence.index + fence[0].indexOf(fence[1]);
  return { bodyStart, bodyEnd: bodyStart + fence[1].length, yaml: fence[1] };
}

function findSlideSection(content: string, slideId: string): { start: number; text: string } | undefined {
  const headers = [...content.matchAll(/^## Slide\s+\d+.*$/gm)];
  for (let index = 0; index < headers.length; index += 1) {
    const start = headers[index].index ?? 0;
    const text = content.slice(start, headers[index + 1]?.index ?? content.length);
    const fence = /```ya?ml\r?\n([\s\S]*?)\r?\n```/.exec(text);
    if (!fence && new RegExp(`^id:\\s*(?:${escapeRegExp(slideId)}|"${escapeRegExp(slideId)}"|'${escapeRegExp(slideId)}')\\s*$`, "m").test(text)) return { start, text };
    if (!fence) continue;
    const document = parseDocument(fence[1]);
    if (!document.errors.length && document.get("id") === slideId) return { start, text };
  }
  return undefined;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function contentRevision(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/** One slide fence, so a couple of megabytes is already far past any real deck. Capping the
 * body keeps a runaway or hostile request on the dev server from buffering without bound. */
const MAX_REQUEST_BODY_BYTES = 2 * 1024 * 1024;

export function readJsonBody(request: NodeJS.ReadableStream): Promise<Record<string, unknown>> {
  return new Promise((resolveBody, reject) => {
    let raw = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      if (raw.length > MAX_REQUEST_BODY_BYTES) return;
      raw += chunk;
      if (raw.length > MAX_REQUEST_BODY_BYTES) reject(new Error("Request body is too large."));
    });
    request.on("end", () => {
      try {
        resolveBody(JSON.parse(raw) as Record<string, unknown>);
      } catch {
        reject(new Error("Request body must be JSON."));
      }
    });
    request.on("error", reject);
  });
}

export function respondJson(response: { end: (body: string) => void; setHeader: (name: string, value: string) => void; statusCode: number }, status: number, body: Record<string, string>): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}
