# Preview Slide Field Editor — Phase 1

**What changed:** Added deck-only slide-YAML read/write middleware with revision conflict protection, extracted shared panel resizing and collapse controls, preserved the left slide sidebar, added a right editor placeholder, and restored the active slide by id after preview reloads.

**Why:** Phase 1 establishes the safe write path and responsive shell required before Phase 2 can render editable YAML fields.

**Verification:** Typecheck, lint, CLI build, whitespace check, helper/middleware tests, and final review passed. The Vite loopback integration test remains host-limited by sandbox `listen EPERM` on `127.0.0.1`; its middleware behavior is covered directly without binding a port.

**Follow-ups:** Phase 2 implements recursive YAML field rows and the Save UI over this endpoint.
