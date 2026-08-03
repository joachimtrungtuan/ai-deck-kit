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
  /** `origin` records which source the deck was born from, so drift reporting can tell an engine
   *  upgrade apart from the user editing their own copy. Absent on decks created before it existed. */
  template: { set: string; version: string; origin?: "project" | "shipped" };
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
