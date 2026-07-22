export type DeckSlide = {
  id: string;
  type: string;
  file: string;
  animation?: string;
  transition?: string;
};

export type DeckManifest = {
  schema: string;
  title: string;
  slug: string;
  audience: string;
  goal: string;
  template: { set: string; version: string };
  slideTypeCatalog: string;
  blockCatalog: string;
  contentSchemaVersion: string;
  outputMode: string;
  status: string;
  defaults: { animation: string; transition: string };
  slides: DeckSlide[];
  generation?: { source: "prompt" | "document" | "outline"; params?: Record<string, unknown> };
};

export type WorkspacePointer = {
  engineRoot: string;
  decksRoot: string;
  engineVersion: string;
};

export type Workspace = {
  root: string;
  pointerPath: string;
  pointer: WorkspacePointer;
  engineRoot: string;
  decksRoot: string;
};
