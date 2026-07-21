import type { ComponentType } from "react";
import {
  LinearAgendaSlide,
  LinearApiEndpointSlide,
  LinearArchitectureOverviewSlide,
  LinearBeforeAfterSlide,
  LinearCaseStudySlide,
  LinearChartSlide,
  LinearClosingSlide,
  LinearCodeSnippetSlide,
  LinearComparisonTableSlide,
  LinearDataFlowSlide,
  LinearDecisionRecordSlide,
  LinearDiagramSlide,
  LinearEvidenceStackSlide,
  LinearFullBleedImageSlide,
  LinearIconGridSlide,
  LinearImageGridSlide,
  LinearImageTextSplitSlide,
  LinearMetricHighlightSlide,
  LinearNumberedFrameworkSlide,
  LinearProcessFlowSlide,
  LinearQuoteSlide,
  LinearSectionDividerSlide,
  LinearSpecTableSlide,
  LinearTerminalOutputSlide,
  LinearTextListSlide,
  LinearTextStatementSlide,
  LinearTimelineSlide,
  LinearTitleSlide,
  LinearTwoColumnTextSlide,
  LinearUiShowcaseSlide,
  type LinearSlideProps,
} from "../../templates/linear-dark/layouts/react";

export type PreviewSlide = {
  type: string;
  Component: ComponentType<LinearSlideProps>;
  props: LinearSlideProps;
};

const flow = ["Capture intent", "Resolve graph", "Sync state", "Render view"];
const before = ["Manual triage", "Scattered context", "Slow handoffs"];
const after = ["Auto-routed issues", "Unified timeline", "Real-time sync"];

const sampleCode = `export async function syncIssues(orgId: string) {
  const since = await getCursor(orgId);
  // pull only what changed since the last sync
  const delta = await api.issues.list({ orgId, since });
  for (const issue of delta) {
    await store.upsert(issue);
  }
  await setCursor(orgId, delta.cursor);
  return delta.length;
}`;

export const linearDarkSlides: PreviewSlide[] = [
  { type: "title", Component: LinearTitleSlide, props: { kicker: "Product Spec 2026", title: "Realtime Sync Engine", body: "A dark, engineering-grade presentation system for software requirements — built for code, architecture, and decisions." } },
  { type: "section-divider", Component: LinearSectionDividerSlide, props: { index: "02", title: "Architecture", body: "How the sync engine resolves state across clients." } },
  { type: "closing", Component: LinearClosingSlide, props: { title: "Ship the sync engine.", body: "One decision closes the room.", items: ["Approve scope", "Lock the API", "Start Phase 1"] } },
  { type: "agenda", Component: LinearAgendaSlide, props: { title: "What we will cover", items: ["Problem & goals", "System architecture", "API surface", "Rollout plan"] } },
  { type: "text-statement", Component: LinearTextStatementSlide, props: { kicker: "Thesis", title: "Local-first, server-authoritative.", body: "Clients stay instant; the server stays the source of truth.", source: "Engineering RFC-014" } },
  { type: "text-list", Component: LinearTextListSlide, props: { kicker: "Goals", title: "Non-negotiables", items: ["Sub-50ms local writes", "Conflict-free merges", "Offline tolerance", "Audit trail"] } },
  { type: "two-column-text", Component: LinearTwoColumnTextSlide, props: { title: "Scope", leftTitle: "In scope", rightTitle: "Out of scope", leftItems: ["Issue sync", "Comment sync", "Presence"], rightItems: ["Attachments", "Cross-org sharing", "Mobile push"] } },
  { type: "quote", Component: LinearQuoteSlide, props: { title: "The best sync engine is the one users never notice.", attribution: "Platform Team" } },
  { type: "numbered-framework", Component: LinearNumberedFrameworkSlide, props: { kicker: "Method", title: "Sync loop", items: flow } },
  { type: "full-bleed-image", Component: LinearFullBleedImageSlide, props: { kicker: "Overview", title: "The product surface", caption: "Dashboard" } },
  { type: "image-text-split", Component: LinearImageTextSplitSlide, props: { kicker: "Context", title: "Where state lives", body: "Each client holds a local replica reconciled against the server graph.", caption: "Replica diagram" } },
  { type: "image-grid", Component: LinearImageGridSlide, props: { kicker: "Surfaces", title: "Touchpoints", items: ["Web", "Desktop", "CLI", "API"] } },
  { type: "icon-grid", Component: LinearIconGridSlide, props: { kicker: "Pillars", title: "Design pillars", body: "Four properties drive every decision.", items: ["Speed", "Consistency", "Resilience", "Observability"], icons: ["lightning", "sync", "shield", "chart"] } },
  { type: "diagram", Component: LinearDiagramSlide, props: { kicker: "Model", title: "State machine", items: ["Idle", "Syncing", "Reconciled"] } },
  { type: "metric-highlight", Component: LinearMetricHighlightSlide, props: { kicker: "Performance", title: "Latency", metric: "42ms", metricLabel: "p95 local write latency", items: ["Measured at scale", "10k issues / org", "Offline-tolerant"], icon: "lightning" } },
  { type: "chart", Component: LinearChartSlide, props: { kicker: "Throughput", title: "Sync volume", body: "The side rail explains how to read the data." } },
  { type: "evidence-stack", Component: LinearEvidenceStackSlide, props: { kicker: "Evidence", title: "Why local-first", items: ["Latency drops 6x (benchmark)", "Offline edits never lost", "Server stays authoritative"] } },
  { type: "case-study", Component: LinearCaseStudySlide, props: { kicker: "Pilot", title: "Beta org results", items: ["Sync conflicts blocked merges.", "Migrated to CRDT-backed store.", "Conflicts dropped to near zero."], icons: ["lock", "sync", "chart"] } },
  { type: "process-flow", Component: LinearProcessFlowSlide, props: { kicker: "Pipeline", title: "Request lifecycle", items: flow, icons: ["target", "branch", "sync", "globe"] } },
  { type: "before-after", Component: LinearBeforeAfterSlide, props: { title: "Impact", leftItems: before, rightItems: after } },
  { type: "ui-showcase", Component: LinearUiShowcaseSlide, props: { kicker: "Interface", title: "Sync status UI", body: "Live state surfaced in the corner.", items: ["Connection state", "Pending writes", "Last synced"], caption: "app.linear.dark" } },
  { type: "timeline", Component: LinearTimelineSlide, props: { kicker: "Rollout", title: "Delivery plan", items: ["Spec", "Prototype", "Beta", "GA"], icons: ["code", "cpu", "users", "rocket"] } },
  { type: "code-snippet", Component: LinearCodeSnippetSlide, props: { kicker: "TypeScript", language: "ts", title: "Delta sync", body: "Only changed records are pulled per cursor.", code: sampleCode, highlightLines: [4], caption: "sync-issues.ts" } },
  { type: "terminal-output", Component: LinearTerminalOutputSlide, props: { kicker: "Install", title: "Get started", caption: "zsh", commands: [{ prompt: "npm i @linear/sync", output: "added 1 package in 1.2s" }, { prompt: "linear sync --once", output: "synced 128 issues · cursor advanced" }] } },
  { type: "architecture-overview", Component: LinearArchitectureOverviewSlide, props: { kicker: "System", title: "Sync topology", items: ["Client", "Edge", "Sync core", "Postgres"], icons: ["globe", "cloud", "cpu", "database"] } },
  { type: "data-flow", Component: LinearDataFlowSlide, props: { kicker: "Flow", title: "Write path", flowSteps: [{ from: "Client", to: "Edge", label: "Optimistic write" }, { from: "Edge", to: "Sync core", label: "Validate + order" }, { from: "Sync core", to: "Postgres", label: "Commit" }, { from: "Sync core", to: "Client", label: "Ack + broadcast" }] } },
  { type: "api-endpoint", Component: LinearApiEndpointSlide, props: { kicker: "REST", title: "Sync endpoint", method: "POST", path: "/v1/issues/sync", body: "Pulls changes since the provided cursor.", requestExample: `{\n  "orgId": "org_42",\n  "since": "c_8f2a"\n}`, responseExample: `{\n  "issues": [ ... ],\n  "cursor": "c_91b3",\n  "count": 12\n}` } },
  { type: "spec-table", Component: LinearSpecTableSlide, props: { kicker: "Requirements", title: "Acceptance criteria", tableColumns: ["ID", "Requirement", "Priority", "Status"], tableRows: [["R1", "Local write < 50ms", "P0", "Done"], ["R2", "Conflict-free merge", "P0", "In progress"], ["R3", "Offline queue", "P1", "Planned"], ["R4", "Audit log", "P2", "Planned"]] } },
  { type: "comparison-table", Component: LinearComparisonTableSlide, props: { kicker: "Options", title: "Sync strategy", recommendedColumn: 1, tableColumns: ["Criteria", "CRDT", "OT", "Last-write-wins"], tableRows: [["Merge safety", "High", "High", "Low"], ["Complexity", "Medium", "High", "Low"], ["Offline", "Strong", "Weak", "Weak"]] } },
  { type: "decision-record", Component: LinearDecisionRecordSlide, props: { kicker: "ADR-014", title: "Adopt CRDT store", context: "Conflicting offline edits were blocking merges and losing data.", decision: "Use a CRDT-backed store for issues and comments.", consequences: ["Conflict-free merges", "Higher memory per replica", "New migration path"] } },
];
