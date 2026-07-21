---
module: "export-package"
surface: ["cli", "runtime"]
status: "draft"
version: "0.1.0"
depends_on: ["presentation", "preview"]
---

# Module PRD: Export & Package

## 1. Purpose
Exports .deck to shareable formats (standalone HTML, PDF) and packages .deck as portable zip archive. Uses existing export runtime (React → HTML, Chrome rasterization → PDF).

## 2. Responsibilities
- **In scope:** `aideck export html` (self-contained HTML), `aideck export pdf` (flattened raster), `aideck pack` (zip .deck), `aideck unpack` (restore .deck from zip), asset collection.
- **Out of scope:** preview rendering (owned by preview), content authoring (owned by presentation).

## 3. Surfaces
- **CLI:** `aideck export html <deck-slug> [--out <path>]` (export to self-contained HTML), `aideck export pdf <deck-slug> [--out <path>]` (export to PDF), `aideck pack <deck-slug> [--out <path>]` (create zip), `aideck unpack <zip-path> [--to <dir>]`.
- **Skill:** —
- **Runtime:** existing preview-app serves as rendering engine; Chrome + ImageMagick for PDF rasterization.

## 4. Inputs & Outputs
- **Inputs:** `{slug}.deck/` folder (deck.json, content.md, assets/, template/), template manifest.
- **Outputs:** `{slug}.html` (self-contained bundle), `{slug}.pdf` (flattened raster), `{slug}.zip` (portable archive).

## 5. Files & Data Touched
- **Reads:** `decks/{slug}.deck/*`, `engine/templates/{template-set}.template/`, `engine/primitives/`.
- **Writes:** export directory (HTML, PDF, zip); `.build/` if using .deck/.build/, or user-specified output path.

## 6. Dependencies
- `preview` (React app rendering engine).
- `presentation` (deck.json, content.md structure).
- External: Chrome/Chromium (PDF), ImageMagick (rasterization), zip utilities.
- `deck-format-spec.md` (bundle portability § 8).

## 7. Success Criteria
- [ ] HTML export is self-contained (no external CDN, all assets bundled).
- [ ] PDF export is flattened raster; morph transitions render as keyframes.
- [ ] Pack creates reproducible zip; unpack restores `.deck/` with file permissions intact.
- [ ] Exports run without network; work offline.
- [ ] Missing assets or validation errors reported before export starts.

## 8. Risks & Mitigations
- **Large exports:** assets may bloat HTML. Mitigation: warn on size, offer asset compression.
- **PDF rendering differences:** browser CSS → PDF can shift layouts. Mitigation: existing export contract handles this; smoke test on CI.

## 9. Open Questions
- None blocking.
