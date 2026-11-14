/** Authoring keys the deck contract owns: the validator requires them and the CLI scaffolds
 * them, but the renderer reads them from deck.json rather than from the slide fence. They are
 * recognized so the editor does not flag them as unread, and the export skips them when
 * collecting the assets a slide actually renders. */
export const authoringSlideYamlKeys = ["status", "intent", "animation", "transition", "assets", "icons"];
