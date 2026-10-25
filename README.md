# Kaustubh Santosh Iyer – Portfolio

The personal portfolio website of Kaustubh Santosh Iyer, a BBA (Hons.) student at
T. A. Pai Management Institute, Bengaluru.

**Live site:** https://kaustubhiyer.netlify.app

The site is set out like a finance student's ledger: a cloth-bound cover, then
ruled pages that turn sideways like sheets of paper. There are seven pages
(Cover, About, Education, Experience, Projects, Skills, Contact). It has
index tabs, an "All pages" overview (press `O`), keyboard shortcuts (press `?`),
light and dark themes, a phone layout, and a print / save-as-PDF layout.

## Changing the text

**Every word on the site is in [`content.js`](content.js).** Open it on GitHub,
click the pencil icon, change the text between the "double quotes", and commit.
The top of the file explains the rules (keep straight quotes, commas and
brackets) and each section has notes with examples, including how to add a new
role or project.

## How the files are organised

```
├── content.js           All the text on the site (edit this one)
├── index.html           The page shell: title, link-preview tags, theme setup
├── package.json         The packages the site needs, and its commands
├── package-lock.json    Exact package versions (created by npm; don't edit)
├── vite.config.ts       Settings for Vite, the tool that builds the site
├── tsconfig.json        Settings for TypeScript
├── netlify.toml         Tells Netlify how to build the site from this repository
├── README.md            This file
├── CLAUDE.md            Notes for Claude Code when working on the site
├── .gitignore           Files Git should ignore (hidden on a Mac)
├── public/
│   ├── favicon.svg      The browser-tab icon
│   ├── og-image.png     The image shown when the link is shared (1200 × 630)
│   └── robots.txt       Lets search engines index the site
├── scripts/
│   └── build.mjs        Builds the finished site into dist/
└── src/
    ├── main.tsx         Starts the app and loads the fonts
    ├── App.tsx          Current page, theme, keyboard and scroll handling
    ├── index.css        All the styling (colours, type, layout, print)
    ├── content.ts       Reads content.js and checks it for mistakes
    ├── components/
    │   └── error-boundary.tsx   Fallback screen if something breaks
    ├── pages/
    │   └── not-found.tsx        The "This page doesn't exist" screen
    └── portfolio/
        ├── pages.tsx      The seven pages
        ├── pageTurner.ts  The page-turn animation, swipes and trackpad
        ├── Overview.tsx   The "All pages" overview
        ├── chrome.tsx     Tabs, page arrows, theme switch, shortcuts card
        ├── Stamp.tsx      The rubber stamp on the cover and contact page
        └── shared.ts      Small helpers used by the files above
```

## What it's built with

- [React](https://react.dev) 19 and TypeScript
- [Vite](https://vite.dev) 7 to run and build it
- [Tailwind CSS](https://tailwindcss.com) 4, used only for its baseline styles;
  the design itself is plain CSS in `src/index.css`
- The fonts Besley and Schibsted Grotesk, installed as npm packages from
  [Fontsource](https://fontsource.org) and built into the page, so there are no
  font files to add and nothing loads from Google

There is no server, database or account system. No environment variables are
required; `SITE_URL` is optional (see below).

## Running it on a computer

You need [Node.js](https://nodejs.org) 20.19 or newer. Then, in this folder:

```sh
npm install        # once: downloads the packages listed in package.json
npm run dev        # opens a live preview at http://localhost:5173
npm run build      # builds the finished site into dist/
npm run preview    # previews the built site
npm run typecheck  # checks the code for mistakes
```

`npm run build` creates:

- `dist/website/` – the site to publish (index.html, content.js, 404.html,
  favicon, preview image, robots.txt)
- `dist/Kaustubh-Santosh-Iyer-Portfolio.html` – the whole site as one file that
  opens by double-clicking, handy for sending to someone

## Publishing

**Automatic (recommended).** Link the Netlify site to this repository: in
Netlify, open the site, go to *Project configuration → Developer settings →
Continuous deployment → Repository* and choose *Link repository*, then pick
this repository. Netlify reads `netlify.toml`, runs `npm run build` and
publishes `dist/website`. From then on, every change committed here goes live
within a minute or two.

**By hand.** Run `npm run build` and drag the `dist/website` folder onto the
site's *Deploys* page in Netlify.

The link-preview image needs the site's full address. The build uses
`SITE_URL` if set, otherwise Netlify's own site address, otherwise
`https://kaustubhiyer.netlify.app` (set in `scripts/build.mjs`). Update that
default if the site moves to a new address.
