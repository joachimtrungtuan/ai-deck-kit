# External source scan and font embedding

Implemented Phase 07 scanner, exact-origin CSP allowance plumbing, Google Fonts build-time embedding,
and offline font fsType licence checks for template and pinned deck validation. Added focused scanner
coverage for HTTP rejection, exact ports, SVG namespaces, and internal fragments.

Evidence: real @fontsource WOFF2 reports fsType 0; a restricted OS/2 TTF copy fails authoring
validation; malformed fonts fail; Google CSS/font embedding tests cover data URL replacement,
offline failure, and warn-only restricted export behavior. Shipped template validation and the
scanner test suite pass. The read-only Marusei scratch export reached Vite but stopped on its
consumer layout's unresolved `react/jsx-runtime` dependency; this is an existing external-template
dependency boundary, not a scanner/CSP failure.

Review follow-up: Google embedding is now export-only; malformed SFNT/WOFF/WOFF2 bounds return
unreadable; protocol-relative and non-HTTP CSS resources fail classification; production transform
tests assert no Google CDN URL remains and font URLs are data URLs. Full suite still reports the
environmental Chrome PDF and loopback failures.

Phase 07 follow-up completed: HTML and JSON `src`/`href` protocol-relative and non-HTTP
values now fail as unclassifiable, while relative/data/fragment values remain ignored.
The production export test creates a temporary consumer deck, links engine dependencies
and primitives, runs `export-standalone-html.mjs` through Vite, and inspects final
`index.html`. Escalated run passed with no Google origins, data-font bytes present, and
CSP `font-src data:`. Focused scanner and font suites: 9 passed.
