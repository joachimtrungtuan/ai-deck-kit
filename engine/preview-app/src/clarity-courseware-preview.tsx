import courseCollage from "../../templates/clarity-courseware.template/assets/course-collage.svg";
import learningGrid from "../../templates/clarity-courseware.template/assets/learning-grid.svg";
import courseOrbit from "../../templates/clarity-courseware.template/assets/course-orbit.svg";
import {
  ClarityClosingSlide,
  ClarityCodeSlide,
  ClarityContentMediaSlide,
  ClarityContentTextSlide,
  ClarityDataVisualSlide,
  ClarityFullBleedImageSlide,
  ClarityQuoteSlide,
  ClaritySectionDividerSlide,
  ClarityTableSlide,
  ClarityTitleSlide,
} from "../../templates/clarity-courseware.template/layouts/react";
import type { PreviewSlide } from "./preview-types";

const shared = {
  animation: "gentle-rise",
  courseName: "Designing Intelligent Products",
  lessonName: "Lesson 04 · From signal to system",
  sectionName: "Building a clear mental model",
  pageTotal: 25,
};

function slide(
  type: string,
  Component: PreviewSlide["Component"],
  pageCurrent: number,
  props: Record<string, unknown>,
): PreviewSlide {
  return { type, Component, props: { ...shared, pageCurrent, ...props } };
}

export const clarityCoursewareSlides: PreviewSlide[] = [
  slide("title · editorial-left", ClarityTitleSlide, 1, {
    backgroundVariant: "white", layoutVariant: "editorial-left", kicker: "Course 01 · Product systems",
    title: "Turn complexity into a clear learning journey", highlightPhrase: "clear learning journey",
    body: "A modular course template for rigorous ideas, visual evidence, and memorable explanations.",
    imageSrc: courseOrbit, imageAlt: "Abstract orange learning orbit",
  }),
  slide("title · orange-statement", ClarityTitleSlide, 2, {
    backgroundVariant: "orange", layoutVariant: "orange-statement", kicker: "The core promise",
    title: "Teach the system, not just the steps", highlightPhrase: "the system",
    body: "Move learners from isolated facts toward durable mental models.",
  }),
  slide("title · black-hero", ClarityTitleSlide, 3, {
    backgroundVariant: "black", layoutVariant: "black-hero", kicker: "Module 04",
    title: "Signals become useful when they form a pattern", highlightPhrase: "form a pattern",
    body: "A visual-first entry point for a lesson, workshop, or intensive.",
    imageSrc: learningGrid, imageAlt: "Modular learning grid",
  }),
  slide("section · number-led", ClaritySectionDividerSlide, 4, {
    backgroundVariant: "white", layoutVariant: "number-led", index: "01",
    title: "Start with the learner’s existing model", highlightPhrase: "existing model",
    body: "Make prior assumptions visible before introducing a new framework.",
  }),
  slide("section · chapter-band", ClaritySectionDividerSlide, 5, {
    backgroundVariant: "orange", layoutVariant: "chapter-band", kicker: "Chapter 02",
    title: "Build the bridge from concept to practice", highlightPhrase: "concept to practice",
    body: "A strong lesson alternates explanation, example, and application.",
  }),
  slide("content · statement", ClarityContentTextSlide, 6, {
    backgroundVariant: "white", layoutVariant: "statement", kicker: "Principle",
    title: "Clarity is a sequence of deliberate choices", highlightPhrase: "deliberate choices",
    body: "A learner should always know what matters now, why it matters, and what comes next.",
    source: "Course design principle 01",
  }),
  slide("content · rule-list", ClarityContentTextSlide, 7, {
    backgroundVariant: "white", layoutVariant: "rule-list", kicker: "Four rules",
    title: "Structure text before you shorten it", highlightPhrase: "Structure text",
    body: "Density is manageable when hierarchy is explicit.",
    items: ["Lead with the decision", "Group related evidence", "Label the relationship", "End with an action"],
  }),
  slide("content · two-column", ClarityContentTextSlide, 8, {
    backgroundVariant: "white", layoutVariant: "two-column", kicker: "Compare the models",
    title: "Facts create recall; relationships create transfer", highlightPhrase: "relationships create transfer",
    leftTitle: "Information", rightTitle: "Understanding",
    leftItems: ["Definitions", "Features", "Examples"], rightItems: ["Causality", "Trade-offs", "Application"],
  }),
  slide("content · concept-callout", ClarityContentTextSlide, 9, {
    backgroundVariant: "orange", layoutVariant: "concept-callout", kicker: "Key term",
    title: "Cognitive scaffolding", highlightPhrase: "scaffolding",
    body: "Temporary structure that helps a learner perform a task they could not yet complete alone.",
  }),
  slide("media · split-figure", ClarityContentMediaSlide, 10, {
    backgroundVariant: "white", layoutVariant: "split-figure", imagePosition: "right", kicker: "Visual explanation",
    title: "A strong diagram reveals the relationship", highlightPhrase: "reveals the relationship",
    body: "Use images as evidence or explanation—not decoration.",
    imageSrc: courseOrbit, imageAlt: "Learning system orbit", caption: "One core idea, connected supporting concepts.",
  }),
  slide("media · captioned-figure", ClarityContentMediaSlide, 11, {
    backgroundVariant: "white", layoutVariant: "captioned-figure", kicker: "Exhibit 02",
    title: "Modularity makes a lesson easier to navigate", highlightPhrase: "easier to navigate",
    body: "Caption the learning value, not merely the visible object.",
    imageSrc: learningGrid, imageAlt: "Modular course grid", caption: "Reusable modules preserve rhythm while allowing variation.",
  }),
  slide("media · image-grid", ClarityContentMediaSlide, 12, {
    backgroundVariant: "white", layoutVariant: "image-grid", kicker: "Pattern library",
    title: "Show several examples without losing the thread", highlightPhrase: "without losing the thread",
    body: "A compact visual set helps learners compare form, scale, and context.",
    images: [
      { src: courseOrbit, alt: "Orange learning orbit", caption: "System" },
      { src: learningGrid, alt: "Black modular grid", caption: "Structure" },
      { src: courseCollage, alt: "Editorial course collage", caption: "Evidence" },
      { src: courseOrbit, alt: "Orange learning orbit detail", caption: "Connection" },
    ],
  }),
  slide("table · reference", ClarityTableSlide, 13, {
    backgroundVariant: "white", layoutVariant: "reference-table", kicker: "Reference",
    title: "Choose the format that matches the learning job", highlightPhrase: "matches the learning job",
    body: "A compact table keeps operational knowledge scannable.",
    tableColumns: ["Format", "Best for", "Watch for"],
    tableRows: [["Statement", "One decisive idea", "Overclaiming"], ["List", "Rules or sequence", "Flat hierarchy"], ["Diagram", "Relationships", "Decorative detail"], ["Table", "Comparison", "Tiny type"]],
  }),
  slide("table · comparison", ClarityTableSlide, 14, {
    backgroundVariant: "white", layoutVariant: "comparison-table", kicker: "Decision matrix",
    title: "Select the right level of learner support", highlightPhrase: "learner support",
    body: "Highlight a recommendation without obscuring alternatives.",
    recommendedColumn: 2, tableColumns: ["Dimension", "Self-guided", "Facilitated", "Workshop"],
    tableRows: [["Pace", "Flexible", "Structured", "Intensive"], ["Feedback", "Delayed", "Regular", "Immediate"], ["Practice", "Individual", "Guided", "Collaborative"], ["Best fit", "Recall", "Application", "Synthesis"]],
  }),
  slide("code · explain-and-code", ClarityCodeSlide, 15, {
    backgroundVariant: "white", layoutVariant: "explain-and-code", kicker: "TypeScript",
    title: "Make the invariant visible beside the implementation", highlightPhrase: "invariant visible",
    body: "Keep the explanation short and let the code demonstrate the rule.",
    language: "ts", highlightLines: [3, 4],
    code: "type Lesson = {\n  title: string;\n  objective: string;\n  evidence: Evidence[];\n};\n\nexport const isReady = (lesson: Lesson) =>\n  lesson.objective.length > 0 &&\n  lesson.evidence.length > 0;",
  }),
  slide("code · focus-lines", ClarityCodeSlide, 16, {
    backgroundVariant: "black", layoutVariant: "focus-lines", kicker: "Python · Focus lines 04–06",
    title: "Progressive disclosure", language: "python", highlightLines: [4, 5, 6],
    code: "def build_lesson(concept, examples):\n    context = establish_context(concept)\n    model = explain_relationships(context)\n    practice = guided_application(model)\n    feedback = inspect_reasoning(practice)\n    return reinforce(model, feedback)",
  }),
  slide("data · metric-highlight", ClarityDataVisualSlide, 17, {
    backgroundVariant: "white", layoutVariant: "metric-highlight", kicker: "Learning signal",
    title: "84%", metric: "84%", metricLabel: "of learners completed the practice after the explanation was split into three decisions.",
    items: ["Smaller conceptual steps", "Immediate example", "Visible progress cue"],
  }),
  slide("data · comparison-chart", ClarityDataVisualSlide, 18, {
    backgroundVariant: "orange", layoutVariant: "comparison-chart", kicker: "Before / after",
    title: "Structure improves transfer, not only recall", highlightPhrase: "improves transfer",
    body: "A restrained chart keeps the comparison legible.",
    chartData: [{ label: "Read", value: 42 }, { label: "Recall", value: 55 }, { label: "Apply", value: 68 }, { label: "Explain", value: 76 }, { label: "Transfer", value: 91 }],
  }),
  slide("data · concept-diagram", ClarityDataVisualSlide, 19, {
    backgroundVariant: "white", layoutVariant: "concept-diagram", kicker: "Concept map",
    title: "Four moves turn content into instruction", highlightPhrase: "content into instruction",
    body: "Show the parts and the relationship between them.",
    items: ["Frame the question", "Explain the model", "Apply the model", "Reflect on evidence"],
  }),
  slide("image · editorial-overlay", ClarityFullBleedImageSlide, 20, {
    backgroundVariant: "black", layoutVariant: "editorial-overlay", kicker: "Field note",
    title: "Learning is a designed experience", highlightPhrase: "designed experience",
    imageSrc: courseCollage, imageAlt: "Editorial course collage",
  }),
  slide("image · caption-strip", ClarityFullBleedImageSlide, 21, {
    backgroundVariant: "white", layoutVariant: "caption-strip", kicker: "Case study 03",
    title: "A visual anchor can carry a whole section",
    body: "Use one strong image, then explain why it matters.",
    imageSrc: learningGrid, imageAlt: "Learning grid and modular system", caption: "A repeated visual system helps learners recognize where they are.",
  }),
  slide("quote · centered", ClarityQuoteSlide, 22, {
    backgroundVariant: "white", layoutVariant: "centered-quote",
    title: "“A lesson succeeds when the learner can make the next decision without you.”",
    highlightPhrase: "make the next decision", attribution: "Course design maxim",
  }),
  slide("quote · pull-quote", ClarityQuoteSlide, 23, {
    backgroundVariant: "white", layoutVariant: "pull-quote", kicker: "Why it matters",
    title: "“Explanation creates confidence. Practice creates capability.”",
    highlightPhrase: "Practice creates capability", attribution: "Instruction principle",
    body: "Pair every new model with a concrete act of interpretation, choice, or construction.",
  }),
  slide("closing · next-steps", ClarityClosingSlide, 24, {
    backgroundVariant: "white", layoutVariant: "next-steps", kicker: "Continue the lesson",
    title: "Turn the model into your own teaching sequence", highlightPhrase: "your own teaching sequence",
    body: "Close with a small, specific action that makes progress feel inevitable.",
    items: ["Choose one concept", "Name the key relationship", "Add one practice prompt"],
  }),
  slide("closing · final-statement", ClarityClosingSlide, 25, {
    backgroundVariant: "black", layoutVariant: "final-statement", kicker: "End of lesson",
    title: "Clear structure gives difficult ideas room to breathe", highlightPhrase: "room to breathe",
    body: "Thank you · Questions and discussion",
  }),
];
