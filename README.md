# Kaustubh Santosh Iyer – Portfolio

The personal portfolio of Kaustubh Santosh Iyer, BBA (Hons.) student at
T. A. Pai Management Institute, Bengaluru.

**Live site:** https://kaustubhiyer.netlify.app

## What the site is

The home page is a **3D office at night in Bengaluru**: an analyst's desk.
Every object in the room is part of the portfolio. Floating lime ▲ markers
show what can be clicked:

| Object in the room | Opens | Address |
| --- | --- | --- |
| Twin trading monitors (live chart + terminal) | About | `/about/` |
| Bookshelf (the spines are your real courses) | Education | `/education/` |
| Pegboard with lanyard ID cards | Experience & projects | `/experience/` |
| Trophy shelf, medals and framed certificate | Achievements & certifications | `/achievements/` |
| Phone and business card on the desk | Contact (with Download CV) | `/contact/` |

Clicking an object flies the camera to it and slides in a panel with the
details. The pill menu at the bottom does the same. The window shows the
Bengaluru skyline with a passing metro, an LED ticker runs your results along
the wall, and the clock shows Bengaluru time.

There is also a **Text version** button (top right): the same content as one
plain scrolling page. It is used automatically on devices that can't show 3D,
and whenever someone prints the page. Visitors who have asked their device for
reduced motion get the room without the camera swoops and moving parts.

## Changing the text

**Every word on the site is in [`content.js`](content.js)**, including the
words drawn inside the 3D room (ID cards, book spines, ticker, certificate,
trophy plate).

1. On GitHub, open `content.js` and click the **pencil icon** (Edit).
2. Change the text between the "double quotes".
3. Click **Commit changes** (green button), then **Commit changes** again.
4. If Netlify is linked to this repository (see *Publishing* below), the live
   site updates by itself in a minute or two.

The top of the file explains the rules: keep straight quotes, commas and
brackets. Words written between *stars* show in the lime italic accent style.
If you make a mistake, the site still opens and shows a red notice naming the
line to fix.

**Search the file for `PLACEHOLDER`** to find everything still to fill in.

## Swapping in your photo

1. On GitHub, open the **`public`** folder, click **Add file → Upload files**,
   drop in your photo (for example `photo.jpg`; a portrait, under 500 KB, works
   best) and click **Commit changes**.
2. Open `content.js`, find `photo: "",` near the top and change it to
   `photo: "photo.jpg",` (the exact file name you uploaded). Commit.

Your photo then appears in the About panel **and on your ID card on the 3D
pegboard**. Until then, your initials are shown.

## Replacing the CV

The **Download CV** button gives `public/Kaustubh-Santosh-Iyer-CV.pdf`. The
current file is a simple starter CV made from the text on this site. To use
your own: upload your PDF into `public` with **the same file name** (GitHub
will replace the old one), and commit.

## Adding things later

All of these are in `content.js`, and each section has a commented example
you can copy.

- **A new role or internship** → copy a real entry in `experience` (from `{`
  to `},`), paste it at the top of the list and change the text. A new ID card
  appears on the pegboard automatically. Delete a `Reserved for…` line when
  you no longer need it.
- **A new achievement** (competition result, award) → add it to
  `achievements`. It appears in the Achievements panel, and the first three
  get a medal on the trophy shelf.
- **A new certification** → add it to `certifications` (paste the
  certificate link into `link`). The first two hang as framed certificates on
  the wall.
- **A project or case study** → `projects` and `caseStudy`.
- **The ticker on the wall** → `ticker`. Put a ▲ in an item to make it light
  up like a rising stock.

## Publishing

**Automatic (recommended).** Link the Netlify site to this repository once:
in Netlify, open the site, go to *Project configuration → Developer settings →
Continuous deployment → Repository*, choose *Link repository*, pick GitHub and
then this repository, and choose the `main` branch. Netlify reads
`netlify.toml`, runs `npm run build` and publishes `dist/website`. From then
on, every change committed to `main` goes live within a minute or two.

**By hand.** Someone with Node.js runs `npm run build` and drags the
`dist/website` folder onto the site's *Deploys* page in Netlify.

**GitHub Pages (optional).** In this repository on GitHub, open *Settings →
Pages* and set *Source* to *GitHub Actions*. Then open the *Actions* tab,
choose *Publish to GitHub Pages* and click *Run workflow*. Run it again
whenever you want to publish changes there.

The link-preview image (WhatsApp, LinkedIn) needs the site's full address. The
build uses `SITE_URL` if set, otherwise Netlify's own address, otherwise
`https://kaustubhiyer.netlify.app` (set in `scripts/build.mjs`).

## How the files are organised

```
├── content.js            All the text on the site (edit this one)
├── index.html            The page shell: title, link-preview tags, fonts
├── netlify.toml          Tells Netlify how to build and publish the site
├── package.json          The packages the site needs, and its commands
├── public/
│   ├── Kaustubh-Santosh-Iyer-CV.pdf   The CV the Download CV button gives
│   ├── og-image.png      The image shown when the link is shared (1200 × 630)
│   ├── favicon.svg       The browser-tab icon
│   └── robots.txt        Lets search engines index the site
├── scripts/build.mjs     Builds the finished site into dist/
├── .github/workflows/    The optional GitHub Pages publisher
└── src/
    ├── main.tsx, App.tsx Starts the site; addresses, panel, text version
    ├── content.ts        Reads content.js and checks it for mistakes
    ├── router.ts         The sections and their web addresses
    ├── sections.tsx      What each panel shows (About, Education, …)
    ├── motion.ts         Animation helpers (GSAP)
    ├── styles.css        All the styling
    ├── components/       Menu, panel, labels, loading screen, text version
    └── scene/            The 3D room (three.js)
        ├── room.ts       Every object in the room, built from simple shapes
        ├── textures.ts   Everything drawn onto objects (cards, spines, ticker…)
        └── world.ts      Camera, lights, glow, hover and click
```

## What it's built with

- [three.js](https://threejs.org) for the 3D room (built from shapes in code;
  there are no 3D model files)
- [GSAP](https://gsap.com) for camera flights and animation
- [React](https://react.dev) 19, TypeScript and [Vite](https://vite.dev) 7
- Fonts from Google Fonts: Archivo, Instrument Serif and JetBrains Mono

No server, database or account system. No environment variables are required.

## Running it on a computer

You need [Node.js](https://nodejs.org) 20.19 or newer. Then, in this folder:

```sh
npm install        # once: downloads the packages
npm run dev        # live preview at http://localhost:5173
npm run build      # builds the finished site into dist/
npm run typecheck  # checks the code for mistakes
```

`npm run build` creates `dist/website/` (the site to publish) and
`dist/Kaustubh-Santosh-Iyer-Portfolio.html` (the whole site as one file that
opens by double-clicking, handy for sending to someone).
