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

- Home is an interactive 3D room (three.js, `src/scene/`): an analyst's
  office in Bengaluru with the owner typing at the desk (`buildPerson` in
  `src/scene/props.ts`: dark brown skin, mustache, black rounded-rectangle
  glasses, side-parted hair) and a cream Indie dog on the couch. Objects are
  sections: monitors/person → About, bookshelf → Education, pegboard ID cards
  → Experience, trophy shelf → Achievements, desk phone → Contact. Each has a
  floating blue ▼ marker (pointing down at it), an HTML label button (for keyboard and touch), a
  hover effect and a camera view (`hotspots` in `src/scene/room.ts`).
- Two hotspots have no marker: the football opens the hidden `easter` route
  (`/off-the-clock/`, kept out of the menu, sitemap and text version on
  purpose), and the speaker (`radio`) opens the Now Playing card, but only when
  `music.songs` in content.js is not empty.
- The room follows the real time in Bengaluru (`src/scene/daylight.ts`;
  `?hour=13` previews another time): sky and skyline textures, sun/moon light,
  exposure and glow threshold change by phase, and the dog is awake 6:30–19:00.
- Each section has its own address (`/about/`, `/education/`, …; list in
  `src/router.ts`, mirrored in `scripts/build.mjs`). Opening it flies the
  camera and slides in the panel (`src/components/Panel.tsx`). The single-file
  copy uses `#about` etc. instead.
- The room is built from primitives and canvas textures in code; there are no
  model files. Everything written on objects comes from `content.js`.
- three.js loads as a separate chunk after the page appears
  (`src/components/World.tsx`). The loading screen is plain HTML/CSS inside
  `index.html` so it shows at once; `src/boot.ts` moves its counter on and
  lifts it when the room (or the text version) is ready. If WebGL is missing,
  or the visitor picks "Text version", `src/components/TextMode.tsx` shows
  every section on one page. Printing always uses the text version.
- `src/sound.ts` makes the UI sounds with WebAudio (no files) and wakes the
  audio context from any paused state on each touch (Safari "interrupts" it
  when music starts or stops). The HUD mute button silences everything, the
  music included, and is remembered in localStorage.
- Music: clicking the speaker starts the music and opens
  `src/components/NowPlaying.tsx`; clicking it again stops the music. The
  card's – button only shrinks it to one line (music keeps playing). It has a
  seek bar and a volume slider (hidden where browsers ignore volume, i.e.
  iOS). Six free recordings live in `public/music/` (128 kbps MP3,
  loudness-matched); their credits are in content.js and must stay. YouTube
  links play in YouTube's own player (keep it visible and at least 200×200
  while playing; YouTube songs pause while the card is shrunk).
- The side walls and an invisible ceiling cast shadows, so moon and sun light
  only enter through the window. The right wall closes the room when looking
  towards the plant; it is a single-sided plane, so it never blocks the
  camera's usual spot outside it.

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
  achievements, not experience. McKinsey Forward is a certification.
- Music: classic Bollywood songs are still under copyright in India, so only
  add YouTube links to official uploads, or audio files the owner has a
  licence for. Don't add song files on request without that.
- `public/Kaustubh-Santosh-Iyer-CV.pdf` is a starter CV generated from the site
  text; the owner is expected to replace it with their own. It must not repeat
  a result (MHT-CET 96.14 is under Education only).
- `public/og-image.png` is a 1200×630 render of the room at night with the
  name over it; re-render it if the room changes a lot.

## Design rules

- Palette: near-black built on the owner's slate `#141a1e`, off-white ink, and
  blue: Science Blue `#0066cc` for fills (white text on it), `#4d9bff` for
  glows, lines and dots, `#6aaeff` for blue text on dark and `#0059b3` on
  light; YInMn Blue `#2e5090` as a second blue. Fonts (Google Fonts): Archivo
  (condensed 900 capitals for headlines), Instrument Serif italic for accent
  words, JetBrains Mono for labels. The easter-egg cards keep their own
  colours (Arsenal red, a dark blue certificate with a gold seal).
- The room's walls stay dark even by day, so the HUD over it always uses light
  text on dark glass. The panel and text version follow the visitor's
  light/dark setting.
- The neon sign must stay readable: draw it crisp and keep its material
  colour below the bloom threshold (no additive blending).
- Per-frame DOM animation may only set `transform` and `opacity` (the
  scramble effect and the clock are the exceptions). In the 3D scene, keep the
  frame cheap: canvas textures redraw at most a few times a second, and the
  loop stops when the tab is hidden or the text version is showing.
- Respect `prefers-reduced-motion` (camera cuts instead of flights, no bobbing,
  train, ticker scroll, swaying cards, typing or dog animation), keep keyboard
  focus visible, and keep every section reachable without 3D (menu, label
  buttons, text version). The ID cards must sway together and never overlap.

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
