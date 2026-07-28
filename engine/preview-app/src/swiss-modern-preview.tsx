import type { ComponentType } from "react";
import {
  SwissAgendaSlide,
  SwissBeforeAfterSlide,
  SwissCaseStudySlide,
  SwissChartSlide,
  SwissClosingSlide,
  SwissDiagramSlide,
  SwissEvidenceStackSlide,
  SwissFullBleedImageSlide,
  SwissIconGridSlide,
  SwissImageGridSlide,
  SwissImageTextSplitSlide,
  SwissMetricHighlightSlide,
  SwissNumberedFrameworkSlide,
  SwissProcessFlowSlide,
  SwissQuoteSlide,
  SwissSectionDividerSlide,
  SwissTextListSlide,
  SwissTextStatementSlide,
  SwissTimelineSlide,
  SwissTitleSlide,
  SwissTwoColumnTextSlide,
  SwissUiShowcaseSlide,
  type SwissSlideProps,
} from "../../templates/swiss-modern.template/layouts/react";

type PreviewSlide = {
  type: string;
  Component: ComponentType<SwissSlideProps>;
  props: SwissSlideProps;
};

const list = ["Define the problem", "Map the flow", "Prototype the path", "Review with evidence"];
const leftItems = ["Unclear hierarchy", "Disconnected page goals", "Weak trust signals"];
const rightItems = ["One primary path", "Evidence-led layout", "Visible decision support"];

export const swissModernSlides: PreviewSlide[] = [
  { type: "title", Component: SwissTitleSlide, props: { kicker: "Template 01", title: "Swiss Editorial", body: "A print-influenced presentation system with measured type, strict alignment, grayscale imagery, and structural rules." } },
  { type: "section-divider", Component: SwissSectionDividerSlide, props: { index: "05", title: "Fight against the ugliness.", body: "Clarity comes from scale, spacing, hierarchy, and restraint." } },
  { type: "closing", Component: SwissClosingSlide, props: { title: "End With One Decision", body: "The final slide should tell the room what to do next.", items: ["Discuss", "Approve", "Iterate"] } },
  { type: "agenda", Component: SwissAgendaSlide, props: { title: "Working Sequence", items: list } },
  { type: "text-statement", Component: SwissTextStatementSlide, props: { title: "One slide, one idea.", body: "Swiss Modern uses scale and rules to make hierarchy unavoidable." } },
  { type: "text-list", Component: SwissTextListSlide, props: { title: "What Makes Us Different.", items: ["Sustainable Innovation", "Intelligent Design", "Emotionally-Driven Spaces", "End-to-End Experience"] } },
  { type: "two-column-text", Component: SwissTwoColumnTextSlide, props: { title: "Before And After", leftTitle: "Before", rightTitle: "After", leftItems, rightItems } },
  { type: "quote", Component: SwissQuoteSlide, props: { title: "The grid is not the visible decoration. It is the discipline behind the page.", attribution: "Template note" } },
  { type: "numbered-framework", Component: SwissNumberedFrameworkSlide, props: { title: "Four-Part Method", items: list } },
  { type: "full-bleed-image", Component: SwissFullBleedImageSlide, props: { title: "Image As Context", caption: "Grayscale visual slot" } },
  { type: "image-text-split", Component: SwissImageTextSplitSlide, props: { title: "Split The Argument", body: "Large visual evidence on one side, precise interpretation on the other.", caption: "Image slot" } },
  { type: "image-grid", Component: SwissImageGridSlide, props: { title: "Visual Set", items: ["Production", "Starring", "Screenplay", "Released"] } },
  { type: "icon-grid", Component: SwissIconGridSlide, props: { title: "Concept Grid", body: "Icons stay semantic and aligned.", items: ["Audience", "Evidence", "Structure", "Action"] } },
  { type: "diagram", Component: SwissDiagramSlide, props: { title: "System Map", items: ["Input", "Decision", "Output"] } },
  { type: "metric-highlight", Component: SwissMetricHighlightSlide, props: { title: "Metric Highlight", metric: "70%", metricLabel: "Primary metric label", items: ["Context", "Interpretation", "Next action"] } },
  { type: "chart", Component: SwissChartSlide, props: { title: "Chart Reading", body: "The side rail explains how to read the data." } },
  { type: "evidence-stack", Component: SwissEvidenceStackSlide, props: { title: "Evidence Stack", items: ["Claim with source", "Observed behavior", "Design implication"] } },
  { type: "case-study", Component: SwissCaseStudySlide, props: { title: "Case Study", body: "Context, action, result.", items: ["The site had unclear product hierarchy.", "The team rebuilt the page flow around user intent.", "Users reached the task faster."] } },
  { type: "process-flow", Component: SwissProcessFlowSlide, props: { title: "Process Flow", items: list } },
  { type: "before-after", Component: SwissBeforeAfterSlide, props: { title: "Transformation", leftItems, rightItems } },
  { type: "ui-showcase", Component: SwissUiShowcaseSlide, props: { title: "Interface Review", body: "Use the side rail for callouts.", items: ["Primary action", "Trust cue", "Friction point"] } },
  { type: "timeline", Component: SwissTimelineSlide, props: { title: "Timeline", items: ["Discovery", "Structure", "Design", "Review"] } },
];
