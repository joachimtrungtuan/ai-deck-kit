import type { ComponentType } from "react";
import type { PreviewSource } from "./preview-types";
import { createManifestDeckSourceV1 } from "./content-schema-v1";
import { createManifestDeckSourceV2 } from "./content-schema-v2";

type Manifest = {
  title: string;
  slug: string;
  template: { set: string };
  contentSchemaVersion?: string;
  defaults?: { animation?: string; transition?: string };
  slides: { id: string; type: string; animation?: string; transition?: string }[];
};

const DEFAULT_CONTENT_SCHEMA_VERSION = "1.0.0";
const SUPPORTED_CONTENT_SCHEMA_MAJORS = [1, 2, 3] as const;

export function createManifestDeckSource(
  manifest: Manifest,
  content: string,
  deckClass: string,
  components: Record<string, ComponentType<any>>,
): PreviewSource {
  const version = manifest.contentSchemaVersion ?? DEFAULT_CONTENT_SCHEMA_VERSION;
  const versionMatch = /^(\d+)\.\d+\.\d+$/.exec(version);
  const major = versionMatch ? Number(versionMatch[1]) : Number.NaN;
  if (!SUPPORTED_CONTENT_SCHEMA_MAJORS.includes(major as (typeof SUPPORTED_CONTENT_SCHEMA_MAJORS)[number])) {
    throw new Error(
      "Deck \"" + manifest.slug + "\" declares unsupported content schema version \"" + version
        + "\". Supported schema majors: " + SUPPORTED_CONTENT_SCHEMA_MAJORS.join(", ") + ".",
    );
  }
  const source = major === 1
    ? createManifestDeckSourceV1(manifest, content, deckClass, components)
    : createManifestDeckSourceV2(manifest, content, deckClass, components);
  return { ...source, contentSchemaMajor: major };
}
