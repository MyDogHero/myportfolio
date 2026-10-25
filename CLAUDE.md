# Notes for Claude Code

Portfolio site for Kaustubh Santosh Iyer (BBA (Hons.), TAPMI Bengaluru), live at
https://kaustubhiyer.netlify.app. See README.md for the file layout.

## Working with the owner

- The owner is not a developer and does not use git or the command line.
  Explain changes in plain language, without file paths or jargon unless asked.
- The owner explicitly rejected a generic "Apple/template" look as boring and
  AI-looking. Keep the site bold and distinctive.
- After any change: run `npm run typecheck` and `npm run build`, and check the
  result in a browser at desktop and phone widths (the 3D room, a panel, and
  the text version), in light and dark modes.

## How the site works

- Home is an interactive 3D room (three.js, `src/scene/`): a late-night
  analyst's office in Bengaluru. Objects are sections: monitors → About,
  bookshelf → Education, pegboard ID cards → Experience, trophy shelf →
  Achievements, desk phone → Contact. Each has a floating lime ▲ marker, an
  HTML label button (for keyboard and touch), a hover effect and a camera view
  (`hotspots` in `src/scene/room.ts`).
- Each section has its own address (`/about/`, `/education/`, …; list in
  `src/router.ts`, mirrored in `scripts/build.mjs`). Opening it flies the
  camera and slides in the panel (`src/components/Panel.tsx`). The single-file
  copy uses `#about` etc. instead.
- The room is built from primitives and canvas textures in code; there are no
  model files. Everything written on objects comes from `content.js`.
- three.js loads as a separate chunk after the page appears
  (`src/components/World.tsx`). If WebGL is missing, or the visitor picks
  "Text version", `src/components/TextMode.tsx` shows every section on one
  page. Printing always uses the text version.

## Content

- All text lives in `content.js` at the repo root (a plain script that sets
  `window.PORTFOLIO_CONTENT`). The owner edits it by hand, so keep its comments,
  examples and layout readable, and keep straight double quotes. Unfilled items
  are marked `PLACEHOLDER`.
- `src/content.ts` imports `content.js` as raw text and also loads the copy
  beside index.html at runtime. If that copy is missing or has a syntax error,
  the site falls back to the built-in copy and shows a red notice. Any new
  content field needs a type and a fallback in `src/content.ts`.
- Entries with `open: true` are deliberate "Reserved for…" lines (and blank
  "Reserved" ID cards), shown on purpose. Case competitions and quizzes are
  achievements, not experience.
- `public/Kaustubh-Santosh-Iyer-CV.pdf` is a starter CV generated from the site
  text; the owner is expected to replace it with their own.

## Design rules

- Palette: near-black built on the owner's slate `#141a1e`, off-white ink, one
  acid-lime accent `#c8f53c` (`#3f6a00` for lime text on light backgrounds).
  Fonts (Google Fonts): Archivo (condensed 900 capitals for headlines),
  Instrument Serif italic for accent words, JetBrains Mono for labels.
- The room is always night-dark, so the HUD over it always uses light text. The
  panel and text version follow the visitor's light/dark setting.
- Per-frame DOM animation may only set `transform` and `opacity` (the
  scramble effect and the clock are the exceptions). In the 3D scene, keep the
  frame cheap: canvas textures redraw at most a few times a second, and the
  loop stops when the tab is hidden or the text version is showing.
- Respect `prefers-reduced-motion` (camera cuts instead of flights, no bobbing,
  train, ticker scroll or swinging cards), keep keyboard focus visible, and
  keep every section reachable without 3D (menu, label buttons, text version).

## Build

- `npm run build` runs `scripts/build.mjs`: two Vite builds. The first writes
  `dist/website/` with one `index.html` per address (relative paths adjusted
  per folder), shared `assets/` (the 3D room is its own chunk), `content.js`,
  a static `404.html`, `sitemap.xml` and the public files. The second inlines
  everything into `dist/Kaustubh-Santosh-Iyer-Portfolio.html`.
- `netlify.toml` builds with `npm run build` and publishes `dist/website`.
  `.github/workflows/pages.yml` is an optional, manually run GitHub Pages
  publisher.
- `node_modules/` and `dist/` must not be committed. If `.gitignore` is missing
  (it was uploaded through the GitHub website once), recreate it.
