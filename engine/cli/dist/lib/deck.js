import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { copyTree, readJson, writeJson, writeText } from "./fs.js";
import { getTemplate } from "./templates.js";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function deckPath(workspace, slugOrPath) {
    if (!isAbsolute(slugOrPath) && slugOrPath.endsWith(".deck") && !slugOrPath.includes("/"))
        return join(workspace.decksRoot, slugOrPath);
    const candidate = resolve(workspace.root, slugOrPath);
    if (candidate.endsWith(".deck") || slugOrPath.includes("/")) {
        const decksRoot = resolve(workspace.decksRoot);
        if (!candidate.startsWith(`${decksRoot}/`) && candidate !== decksRoot)
            throw new Error(`Deck path must stay inside ${workspace.decksRoot}.`);
        return candidate;
    }
    if (!SLUG_RE.test(slugOrPath))
        throw new Error(`Invalid deck slug "${slugOrPath}". Use kebab-case.`);
    return join(workspace.decksRoot, `${slugOrPath}.deck`);
}
export function readDeck(workspace, slugOrPath) {
    const root = deckPath(workspace, slugOrPath);
    const manifest = readJson(join(root, "deck.json"));
    const content = readFileSync(join(root, "content.md"), "utf8");
    return { root, manifest, content };
}
export function writeDeck(root, manifest, content) {
    writeJson(join(root, "deck.json"), manifest);
    writeText(join(root, "content.md"), content);
}
export function createDeck(workspace, slug, templateName, title = titleFromSlug(slug)) {
    if (!SLUG_RE.test(slug))
        throw new Error(`Invalid deck slug "${slug}". Use kebab-case.`);
    const root = deckPath(workspace, slug);
    if (existsSync(root))
        throw new Error(`Deck already exists: ${root}`);
    const template = getTemplate(workspace, templateName);
    mkdirSync(join(root, "assets"), { recursive: true });
    copyTree(template.root, join(root, "template"));
    const firstType = template.manifest.supportedSlideTypes.includes("title") ? "title" : template.manifest.supportedSlideTypes[0];
    if (!firstType)
        throw new Error(`Template "${templateName}" declares no supported slide types.`);
    const firstSlide = { id: "slide-01", type: firstType, file: "content.md#slide-01", animation: template.manifest.defaultAnimation, transition: "none" };
    const manifest = {
        schema: "ai-deck-kit/deck@1.0.0",
        title,
        slug,
        audience: "",
        goal: "",
        template: { set: template.manifest.name, version: template.manifest.templateVersion },
        slideTypeCatalog: template.manifest.slideTypeCatalog,
        blockCatalog: template.manifest.blockCatalog ?? "v1",
        contentSchemaVersion: "1.0.0",
        outputMode: "react-and-static-html",
        status: "draft",
        defaults: { animation: template.manifest.defaultAnimation, transition: "none" },
        slides: [firstSlide],
    };
    writeDeck(root, manifest, slideContent(firstSlide, title));
    return root;
}
export function titleFromSlug(slug) {
    return slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
export function parseSections(content) {
    const matches = [...content.matchAll(/^## Slide\s+\d+:\s+.+$/gm)];
    if (!matches.length)
        throw new Error("content.md has no slide sections.");
    const prefix = content.slice(0, matches[0].index);
    const sections = matches.map((match, index) => content.slice(match.index, matches[index + 1]?.index ?? content.length).trimEnd());
    return { prefix, sections };
}
export function sectionId(section) {
    const match = section.match(/^```ya?ml\n[\s\S]*?^id:\s*["']?([^"'\n]+)["']?/m);
    if (!match)
        throw new Error("A slide section is missing metadata id.");
    return match[1].trim();
}
export function setYamlField(section, field, value) {
    const line = `${field}: "${value}"`;
    const pattern = new RegExp(`^${field}:.*$`, "m");
    return pattern.test(section) ? section.replace(pattern, line) : section.replace(/^```ya?ml\n/, (opening) => `${opening}${line}\n`);
}
export function slideContent(slide, title) {
    return `## Slide 01: ${title}\n\n\`\`\`yaml\nid: "${slide.id}"\ntype: "${slide.type}"\nstatus: "draft"\nintent: "Describe the purpose of this slide."\nanimation: "${slide.animation ?? "gentle-rise"}"\ntransition: "${slide.transition ?? "none"}"\nicons: []\nassets: []\noverride:\n  layout: "none"\n  animation: "none"\n  reason: ""\n\`\`\`\n\n### On-Slide Text\n\n- Add visible slide copy.\n\n### Visual Direction\n\nDescribe the visual treatment.\n\n### Speaker Notes\n\nAdd presenter notes.\n\n### Design Notes\n\nAdd layout constraints.\n\n### Review Questions\n\n- None.\n`;
}
