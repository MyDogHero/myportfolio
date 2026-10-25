# Notes for Claude Code

Portfolio site for Kaustubh Santosh Iyer (BBA (Hons.), TAPMI Bengaluru), live at
https://kaustubhiyer.netlify.app. See README.md for the file layout.

## Working with the owner

- The owner is not a developer and does not use git or the command line.
  Explain changes in plain language, without file paths or jargon unless asked.
- After any change: run `npm run typecheck` and `npm run build`, and check the
  result in a browser at desktop and phone widths, in light and dark themes.

## Content

- All text lives in `content.js` at the repo root (a plain script that sets
  `window.PORTFOLIO_CONTENT`). The owner edits it by hand, so keep its comments,
  examples and layout readable, and keep straight double quotes.
- `src/content.ts` imports `content.js` as raw text and also loads the copy
  beside index.html at runtime. If that copy is missing or has a syntax error,
  the site falls back to the built-in copy and shows a red notice. Any new
  content field needs a type and a fallback in `src/content.ts`.
- Experience entries with `open: true` are deliberate "Reserved for…" lines,
  shown on purpose. Case competitions and quizzes are not experience; they
  belong under Projects or in the About text.

## Design rules

- The look is a finance student's ledger: paper `--paper`, ink `--ink`, red
  `--red` (margin rule, accents), feint green grid, cloth-bound cover. Fonts:
  Besley (serif) and Schibsted Grotesk (sans). Avoid generic template styling
  (all-caps mono labels, card grids, gradient washes).
- Page turning is done by `src/portfolio/pageTurner.ts`: one `position` value
  places every sheet each frame (keys, tabs and the wheel animate it; touch and
  trackpad swipes follow it). There is no native horizontal scrolling. Don't
  bring back scroll-snap; it made backwards turns jitter.
- Anything that changes every frame may only set `transform` and `opacity`.
  No CSS custom properties and no `mix-blend-mode` layers over moving sheets,
  or the turn drops frames.
- Respect `prefers-reduced-motion`, keep keyboard focus visible, and keep the
  print layout (`@media print` in `src/index.css`) working.

## Build

- `npm run build` runs `scripts/build.mjs`: a Vite build inlined into one HTML
  file, written out as `dist/website/` (index.html + 404.html + content.js +
  public files) and `dist/Kaustubh-Santosh-Iyer-Portfolio.html` (single file).
- `netlify.toml` builds with `npm run build` and publishes `dist/website`.
- `node_modules/` and `dist/` must not be committed. If `.gitignore` is missing
  (it was uploaded through the GitHub website), recreate it.
