# Kaustubh Santosh Iyer – Portfolio

The personal portfolio of Kaustubh Santosh Iyer, BBA (Hons.) student at
T. A. Pai Management Institute, Bengaluru.

**Live site:** https://kaustubhiyer.netlify.app

## What the site is

The home page is a **3D office in Bengaluru**, lit in Science Blue: you at
your desk, typing, with an Indie dog on the couch. Every object in the room is
part of the portfolio. Floating blue ▼ markers show what can be clicked:

| Object in the room | Opens | Address |
| --- | --- | --- |
| Twin trading monitors (live chart + terminal) | About | `/about/` |
| Bookshelf (the spines are your real courses) | Education | `/education/` |
| Pegboard with lanyard ID cards | Experience & projects | `/experience/` |
| Trophy shelf, medals and framed certificates | Achievements & certifications | `/achievements/` |
| Phone and business card on the desk | Contact (with Download CV) | `/contact/` |
| The football by the couch (no marker: a secret) | Off the clock (Arsenal, your Taekwondo record) | `/off-the-clock/` |

Clicking an object flies the camera to it and slides in a panel with the
details. The pill menu at the bottom does the same (the football's section is
left out of the menu on purpose, so visitors have to find it).

**The room follows the real time in Bengaluru.** The window shows night,
dawn, day or dusk over the skyline, the light in the room changes with it, and
the dog sleeps at night (with little purple zZ) and is awake from 6:30 in the
morning to 7 in the evening. To preview another time, add `?hour=` to the
address, for example `kaustubhiyer.netlify.app/?hour=13` for one in the
afternoon. A metro passes the window, an LED ticker runs your results along
the wall, and the wall clock shows Bengaluru time.

**Sound.** Clicks, opening and closing panels, and pointing at objects make
small sounds. They are made in the browser (no audio files). Visitors can
switch all sound off (the music too) with the speaker button at the top; the
site remembers.

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
brackets. Words written between *stars* show in the blue italic accent style.
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
  certificate link into `link`). The first three hang as framed certificates
  on the wall.
- **Your interests** (the football's secret section) → `easterEgg`. Fill in
  the year of your Taekwondo record and, if there is one online, a link to it.
- **A project or case study** → `projects` and `caseStudy`.
- **The ticker on the wall** → `ticker`. Put a ▲ in an item to make it light
  up like a rising stock.
- **The neon sign** → `sign` (near the top, in `profile`).
- **The book you're reading** → `reading`: the title, the author and a short
  note on why you're reading it. The book lies open, pages up, on the right
  of the desk. Clicking it (or "Why I'm reading it" in About) opens
  `/currently-reading/`: your chair rolls back and turns to face the room,
  you pick the book up and read it (visitors see the cover), and a panel
  beside you shows the book and your note. Set the title to `""` to hide it.

## Music on the speaker

Clicking the speaker next to the couch starts the music and opens a small
"Now playing" card: the song, who plays it, a bar to jump to any point, a
volume slider (phones use their own volume buttons), and back, play/pause and
skip. The – button shrinks the card to one line while the music carries on;
clicking the speaker again stops the music.

It comes with six calm, human-played recordings of famous pieces, all free to
use. Recordings marked CC BY or CC BY-SA must keep their credit, which the
card shows:

| Piece | Played by | Licence |
| --- | --- | --- |
| Satie, Gymnopédie No. 1 | Michael Laucke, guitar | CC BY-SA 4.0 |
| Debussy, Clair de Lune | Laurens Goedhart, piano | CC BY 3.0 |
| Bach, Air on the G String | Air Force Strings, U.S. Air Force Band | Public domain |
| Saint-Saëns, The Swan | John Michel, cello | CC BY-SA 3.0 |
| Chopin, Nocturne Op. 9 No. 2 | Musopen | Public domain (CC0) |
| Bach, Cello Suite No. 1: Prelude | John Michel, cello | CC BY-SA 3.0 |

The files are in `public/music/` and the list (with credits and links to each
licence) is `music` in `content.js`. To remove a song, delete its entry there.

**About copyright.** Classic Bollywood songs are almost all still under
copyright in India: the recording, and separately the music and the lyrics,
which stay protected until 60 years after the composer and lyricist have
died. So "old" doesn't mean free to use, and putting audio files of these
songs on the site would need a licence.

The simple, legal way is to **use YouTube links to the songs' official
uploads** (for example from the Saregama Music channel). The site then plays
them in YouTube's own small player inside the card, as YouTube allows. For each
song, add its title, singer, film and link:

```js
songs: [
  {
    title: "Lag Jaa Gale",
    artist: "Lata Mangeshkar",
    film: "Woh Kaun Thi? (1964)",
    youtube: "https://www.youtube.com/watch?v=…",
  },
],
```

Use links from official channels, check that the video says it can be
embedded (if it can't, the card skips it and says so), and don't upload song
files unless you have permission. A recording you own or have a licence for
can go in `public/music/` and be listed with `file: "music/name.mp3"`
instead of `youtube:` (this is how the six songs above are added, with no ads).
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
├── index.html            The page shell: title, link-preview tags, fonts, loading screen
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
    ├── sound.ts          The click and open/close sounds
    ├── boot.ts           Lifts the loading screen once the room is ready
    ├── styles.css        All the styling
    ├── components/       Menu, panel, labels, Now Playing card, text version
    └── scene/            The 3D room (three.js)
        ├── room.ts       Every object in the room, built from simple shapes
        ├── props.ts      You at the desk, the couch and dog, speaker, football
        ├── kit.ts        Small shared building blocks for the shapes
        ├── textures.ts   Everything drawn onto objects (cards, spines, ticker…)
        ├── daylight.ts   The time of day in Bengaluru
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
