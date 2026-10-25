/*
 * Builds the site.   npm run build
 *
 * Output:
 *   dist/website/      The site to publish. Netlify publishes this folder (see
 *                      netlify.toml), or drag it onto the Netlify Deploys page
 *                      by hand. It holds:
 *                        index.html, about/, education/, experience/,
 *                        achievements/, contact/   one page per address, so
 *                                   every link works
 *                        assets/    the code and styles, shared by all pages
 *                                   (the 3D room loads as a separate file)
 *                        content.js the words (editable without rebuilding)
 *                        404.html   shown for addresses that don't exist
 *                        plus everything from public/ (photo, CV, preview image…)
 *   dist/Kaustubh-Santosh-Iyer-Portfolio.html
 *                      The whole site as one file that opens by double-clicking,
 *                      handy for emailing or sending to someone.
 *
 * Link previews (LinkedIn, WhatsApp) need the full web address of the preview
 * image. It comes from SITE_URL, then Netlify's own URL setting, then the
 * default below. Change the default if the site moves to a new address.
 */
import { copyFileSync, cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { build } from "vite";

const DEFAULT_SITE_URL = "https://kaustubhiyer.netlify.app";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const tempDir = path.join(dist, "app");
const singleDir = path.join(dist, "single");
const siteDir = path.join(dist, "website");
const singleFile = path.join(dist, "Kaustubh-Santosh-Iyer-Portfolio.html");
const siteUrl = (process.env.SITE_URL || process.env.URL || DEFAULT_SITE_URL).replace(/\/+$/, "");

// The same pages as src/router.ts.
const routes = [
  { slug: "", label: "" },
  { slug: "about", label: "About" },
  { slug: "education", label: "Education" },
  { slug: "experience", label: "Experience" },
  { slug: "achievements", label: "Achievements & Certifications" },
  { slug: "contact", label: "Contact" },
];

// Read content.js now, to catch a mistake before publishing and to name the pages.
const contentSource = readFileSync(path.join(root, "content.js"), "utf8");
let content;
try {
  const sandbox = { window: {} };
  vm.runInNewContext(contentSource, sandbox, { filename: "content.js" });
  content = sandbox.window.PORTFOLIO_CONTENT;
} catch (error) {
  console.error(`\ncontent.js has a mistake, so the site was not built:\n${error.stack?.split("\n").slice(0, 3).join("\n")}\n`);
  process.exit(1);
}
const name = content?.profile?.name || "Kaustubh Santosh Iyer";

const viteBuild = (outDir, single) =>
  build({
    configFile: path.join(root, "vite.config.ts"),
    mode: "production",
    logLevel: "warn",
    build: {
      outDir,
      emptyOutDir: true,
      cssCodeSplit: false,
      modulePreload: false,
      chunkSizeWarningLimit: 1200,
      // The single file needs all the code in one script.
      rollupOptions: single ? { output: { inlineDynamicImports: true } } : {},
    },
  });

// 1. The website: the 3D room is a separate file that loads after the page appears.
await viteBuild(tempDir, false);
// 2. The single file: everything in one script.
await viteBuild(singleDir, true);

const fromSingle = (ref) => readFileSync(path.join(singleDir, ref.replace(/^\.?\//, "")), "utf8");
const escapeAttr = (text) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

let html = readFileSync(path.join(tempDir, "index.html"), "utf8");

// Link-preview image as a full address.
html = html.replace(/content="[^"]*og-image\.png"/g, `content="${siteUrl}/og-image.png"`);

const moduleTag = /<script type="module"[^>]*><\/script>/;
if (!moduleTag.test(html)) throw new Error("Could not find the page script.");

/* One copy of the page for each address, with paths adjusted for its folder. */
function pageFor({ slug, label }) {
  const prefix = slug ? "../" : "./";
  const address = `${siteUrl}/${slug ? `${slug}/` : ""}`;
  const title = label ? `${label} – ${name}` : `${name} – Portfolio`;
  let page = html
    .replace(/(src|href)="\.\/assets\//g, `$1="${prefix}assets/`)
    .replace(/href="\.\/favicon\.svg"/, `href="${prefix}favicon.svg"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(title)}</title>`)
    .replace(
      '<meta property="og:type"',
      `<link rel="canonical" href="${address}" />\n    <meta property="og:url" content="${address}" />\n    <meta property="og:type"`,
    );

  // The words come from content.js beside the site, so they can be changed
  // without rebuilding. A mistake in that file is caught and reported on the
  // page, which then uses its built-in copy (see src/content.ts).
  const loadContent = `<script>
      window.__PORTFOLIO_CONTENT_LOADING = true;
      window.addEventListener('error', function (event) {
        var fromContent = /content\\.js(\\?|$)/.test(event.filename || '');
        if (fromContent || window.__PORTFOLIO_CONTENT_LOADING) {
          window.__PORTFOLIO_CONTENT_ERROR = { line: event.lineno || undefined, message: event.message };
        }
      });
    </script>
    <script src="${prefix}content.js" onload="window.__PORTFOLIO_CONTENT_LOADING = false" onerror="window.__PORTFOLIO_CONTENT_LOADING = false"></script>
    <script>window.__PORTFOLIO_CONTENT_LOADING = false;</script>
    `;
  page = page.replace(moduleTag, (tag) => `${loadContent}${tag}`);
  return page;
}

/* A small stand-alone page for addresses that don't exist. */
function notFoundPage() {
  const home = new URL(`${siteUrl}/`).pathname;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Page not found – ${escapeAttr(name)}</title>
    <meta name="robots" content="noindex" />
    <meta name="color-scheme" content="dark light" />
    <link rel="icon" type="image/svg+xml" href="${home}favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@800&family=Inter:wght@400..600&display=swap" />
    <style>
      :root { color-scheme: dark; --bg: #0c1013; --text: #f3f2ee; --text-2: #a9b1b8; --accent: #e2b664; --on-accent: #17130a; }
      @media (prefers-color-scheme: light) {
        :root { color-scheme: light; --bg: #fbfbf9; --text: #141a1e; --text-2: #4f585f; --accent: #8c5f10; --on-accent: #fffaf0; }
      }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: var(--bg); color: var(--text); font: 17px/1.6 Inter, system-ui, sans-serif; text-align: center; }
      p.code { margin: 0 0 12px; color: var(--accent); font-weight: 600; }
      h1 { margin: 0; font: 800 clamp(2.4rem, 8vw, 5rem)/1 "Inter Tight", Inter, system-ui, sans-serif; letter-spacing: -0.05em; }
      p.text { margin: 20px 0 36px; color: var(--text-2); }
      a { display: inline-flex; align-items: center; min-height: 52px; padding: 0 26px; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-weight: 600; text-decoration: none; }
      a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
    </style>
  </head>
  <body>
    <main>
      <p class="code">404</p>
      <h1>This page doesn’t exist.</h1>
      <p class="text">The link may be mistyped or out of date.</p>
      <a href="${home}">Go to the portfolio</a>
    </main>
  </body>
</html>
`;
}

rmSync(siteDir, { recursive: true, force: true });
mkdirSync(siteDir, { recursive: true });

// Everything Vite produced (code, styles, public files) except its index.html.
for (const entry of readdirSync(tempDir)) {
  if (entry === "index.html") continue;
  cpSync(path.join(tempDir, entry), path.join(siteDir, entry), { recursive: true });
}
for (const route of routes) {
  const folder = path.join(siteDir, route.slug);
  mkdirSync(folder, { recursive: true });
  writeFileSync(path.join(folder, "index.html"), pageFor(route));
}
writeFileSync(path.join(siteDir, "404.html"), notFoundPage());
copyFileSync(path.join(root, "content.js"), path.join(siteDir, "content.js"));

// Help search engines find every page.
writeFileSync(
  path.join(siteDir, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(({ slug }) => `  <url><loc>${siteUrl}/${slug ? `${slug}/` : ""}</loc></url>`).join("\n")}
</urlset>
`,
);
writeFileSync(
  path.join(siteDir, "robots.txt"),
  `${readFileSync(path.join(root, "public", "robots.txt"), "utf8").trim()}\nSitemap: ${siteUrl}/sitemap.xml\n`,
);

// The single file: code, styles and icon inlined; the words built in.
let single = readFileSync(path.join(singleDir, "index.html"), "utf8").replace(
  /content="[^"]*og-image\.png"/g,
  `content="${siteUrl}/og-image.png"`,
);
single = single.replace(
  /<link rel="stylesheet"[^>]*href="(\.\/assets\/[^"]+)"[^>]*>/g,
  (_, href) => `<style>\n${fromSingle(href)}\n</style>`,
);
single = single.replace(
  /<script type="module"[^>]*src="(\.\/assets\/[^"]+)"[^>]*><\/script>/g,
  (_, src) =>
    `<script>window.__PORTFOLIO_STANDALONE = true; window.__PORTFOLIO_SITE_URL = ${JSON.stringify(siteUrl)};</script>\n    <script type="module">\n${fromSingle(src).replace(/<\/script/gi, "<\\/script")}\n</script>`,
);
const favicon = readFileSync(path.join(root, "public", "favicon.svg"));
single = single.replace(
  /href="[^"]*favicon\.svg"/,
  () => `href="data:image/svg+xml;base64,${favicon.toString("base64")}"`,
);
if (/(src|href)="\.?\/?assets\//.test(single)) {
  throw new Error("An asset was not inlined; the single file would not work on its own.");
}
writeFileSync(singleFile, single);

rmSync(tempDir, { recursive: true, force: true });
rmSync(singleDir, { recursive: true, force: true });

const kb = Math.round(Buffer.byteLength(single) / 1024);
console.log(`Built dist/website/ (publish this folder) for ${siteUrl}`);
console.log(`Built dist/${path.basename(singleFile)} (${kb} KB, opens on its own)`);
