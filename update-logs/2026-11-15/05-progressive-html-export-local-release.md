# Progressive HTML export local release preparation

Prepared local 1.5.0 so installing users can receive the reviewed progressive export implementation once publication is approved. Main merge `6830ee7`; lockstep version commit `160dde7`; annotated `v1.5.0` targets that release commit. Existing `v1.4.1` target `324532d` unchanged; content schema remains 3.2.0.

Five premerge gates passed (228/228 tests); postbump build/lint/typecheck/validate passed. Actual pack, unpacked scratch install with dependencies, and real 1.4.1→1.5.0 CLI upgrade passed; 44 seeded user files preserved byte-for-byte. [Full evidence](../../plans/261114-0021-progressive-html-export/reports/local-release-verification.md) records artifact path/hash, commands, refs and limitations. Marusei acceptance remains in [manual acceptance](../../plans/261114-0021-progressive-html-export/reports/manual-acceptance.md), including accepted soft size target miss.

Workflow result: **not run**; no GitHub writes. Follow-up: obtain user approval, push main before release tags, verify Engine Release assets, edit notes, record actual publication, close remaining Phase 01/09 tasks. Registry-backed clean install unverified.
