# 02 — Linear-dark template build instructions plan

## What changed

- Created `plans/260610-0831-linear-dark-template/plan.md`: self-contained build instructions for executor models (e.g. Opus) to create the 2nd template set `linear-dark` (Linear.app-style, dark mode, modern SaaS).
- Scope decided mid-session per user input: template targets technical/software-requirements presentations → plan includes Step 0 creating `slide-types-v2.md` catalog = v1 + new Technical category (8 types: code-snippet, terminal-output, architecture-overview, data-flow, api-endpoint, spec-table, comparison-table, decision-record). Typography locked: Inter only, max font-weight 700.
- Contracts extracted from swiss-modern via Explore agent (manifest schema, LinearSlideProps superset of SwissSlideProps, .ld- CSS prefix, preview-app registration with template switcher, validation steps).

## Why

User wants lower models to execute the template build from a precise spec; v2 catalog keeps swiss-modern/v1 untouched per versioning rules.

## Follow-ups

- Execute the plan (separate session/model).
- Pending user answers: final technical type list; preview switcher UI preference.
- Consider adding `references/template-creation-workflow.md` to presentation-crafting skill after linear-dark validates the process (skill currently lacks a creation flow).
