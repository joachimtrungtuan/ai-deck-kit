# Marusei nested Google font import fix

## Root cause

Marusei imports Google Fonts from `template/styles/base.css`, nested beneath the
template `design-system.css` import. Vite's emitted stylesheet is minified to a
bare `@import"https://fonts.googleapis.com/...";` rule. The prior CSS transform
hook did not reliably see this post-bundle form, and the embedder only matched
`url(...)` imports while also replacing the URL text instead of the full rule.
The result retained the Google stylesheet import in final HTML; CSP correctly
blocked it.

## Fix

- Move Google embedding to the export boundary, after Vite emits `export.html`
  and before assembly/CSP hashing. Every emitted style block is processed.
- Match both `@import url(...)` and minified bare-string `@import"..."` forms,
  including semicolon-bearing Google query parameters.
- Replace the complete import rule with fetched CSS, then embed all gstatic font
  bytes as data URLs.
- Remove the superseded Vite plugin transform and its dead export-mode state to
  prevent duplicate fetches. Preview remains network-free.

## Evidence

Focused suite: 8 passed, 0 failed.

Real read-only Marusei scratch exports:

- `/private/tmp/marusei-acceptance.1zIU0V/out-single-fixed4/index.html` — single mode; CSP check passed normal + print (7291ms).
- `/private/tmp/marusei-acceptance.1zIU0V/out-web-fixed4/index.html` — web mode; CSP check passed normal + print (4668ms).

Both final HTML files contain no `fonts.googleapis.com` or `fonts.gstatic.com`
origins and contain `data:font/woff2` bytes. The original consumer deck was not
modified.

## Remaining proof limits

Visual browser review of Marusei is outside this code fix; headless CSP normal and
print checks passed for both delivery modes. Full repository gates are run separately
before commit handoff.
