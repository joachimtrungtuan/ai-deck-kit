import type { Preview } from "@storybook/react-vite";
import "../templates/swiss-modern/design-system.css";
import "../templates/swiss-modern/animation-presets.css";
import "../primitives/blocks/primitives.css";
import "./storybook.css";

const preview: Preview = {
  decorators: [(Story) => <div className="swiss-deck primitive-story-canvas"><Story /></div>],
};

export default preview;
