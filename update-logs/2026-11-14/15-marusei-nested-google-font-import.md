# Marusei nested Google font import

Found and fixed a production-only export defect where Vite emitted a nested Google
Fonts import as minified bare `@import"..."` CSS after the plugin transform stage.
The export now embeds fonts after Vite output and before CSP hashing, replacing the
complete import rule and embedding gstatic bytes. Real read-only Marusei single and
web exports passed normal + print CSP checks; final HTML has no Google origins.

Follow-up: retain the focused nested-import regression and rerun the full five gates
before merge.
