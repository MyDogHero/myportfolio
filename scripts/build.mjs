/*
 * Builds the site.   npm run build
 *
 * Output:
 *   dist/website/      The site to publish: index.html, content.js, 404.html,
 *                      favicon.svg, og-image.png, robots.txt. Netlify publishes
 *                      this folder (see netlify.toml), or drag it onto the
 *                      Netlify Deploys page by hand.
 *   dist/Kaustubh-Santosh-Iyer-Portfolio.html
 *                      The whole site as one file that opens by double-clicking,
 *                      handy for emailing or sending to someone.
 *
 * Everything (code, styles, fonts, icon) is inlined into the HTML, so the page
 * works from any address, or straight from disk, with no server.
 *
 * Link previews (LinkedIn, WhatsApp) need the full web address of the preview
 * image. It comes from SITE_URL, then Netlify's own URL setting, then the
 * default below. Change the default if the site moves to a new address.
 */
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const DEFAULT_SITE_URL = "https://kaustubhiyer.netlify.app";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const tempDir = path.join(dist, "app");
const siteDir = path.join(dist, "website");
const singleFile = path.join(dist, "Kaustubh-Santosh-Iyer-Portfolio.html");
const siteUrl = (process.env.SITE_URL || process.env.URL || DEFAULT_SITE_URL).replace(/\/+$/, "");

await build({
  configFile: path.join(root, "vite.config.ts"),
  mode: "production",
  logLevel: "warn",
  build: {
    outDir: tempDir,
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: false,
  },
});

const fromTemp = (ref) => readFileSync(path.join(tempDir, ref.replace(/^\.?\//, "")), "utf8");

let html = readFileSync(path.join(tempDir, "index.html"), "utf8");

// Inline the stylesheet and the script.
html = html.replace(
  /<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
  (_, href) => `<style>\n${fromTemp(href)}\n</style>`,
);
html = html.replace(
  /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,
  (_, src) => `<script type="module">\n${fromTemp(src).replace(/<\/script/gi, "<\\/script")}\n</script>`,
);

// Inline the favicon.
const favicon = readFileSync(path.join(root, "public", "favicon.svg"));
html = html.replace(
  /href="[^"]*favicon\.svg"/,
  () => `href="data:image/svg+xml;base64,${favicon.toString("base64")}"`,
);

if (/(src|href)="\.?\/?assets\//.test(html)) {
  throw new Error("An asset was not inlined; the page would not work on its own.");
}

// Link-preview image and page address.
html = html.replace(/content="[^"]*og-image\.png"/g, `content="${siteUrl}/og-image.png"`);
html = html.replace(
  '<meta property="og:type"',
  `<meta property="og:url" content="${siteUrl}/" />\n    <meta property="og:type"`,
);

const moduleTag = '<script type="module">';
if (!html.includes(moduleTag)) throw new Error("Could not find the page script.");

// 1. The single file: always shows the portfolio, uses the text built into it.
writeFileSync(
  singleFile,
  html.replace(moduleTag, `<script>window.__PORTFOLIO_STANDALONE = true;</script>\n    ${moduleTag}`),
);

// 2. The website: reads its words from content.js beside index.html, so the text
//    can be changed there without rebuilding. A mistake in that file is caught
//    and reported on the page (see src/content.ts).
const loadContent = `<script>
      window.__PORTFOLIO_CONTENT_LOADING = true;
      window.addEventListener('error', function (event) {
        var fromContent = /content\\.js(\\?|$)/.test(event.filename || '');
        if (fromContent || window.__PORTFOLIO_CONTENT_LOADING) {
          window.__PORTFOLIO_CONTENT_ERROR = { line: event.lineno || undefined, message: event.message };
        }
      });
    </script>
    <script src="content.js" onload="window.__PORTFOLIO_CONTENT_LOADING = false" onerror="window.__PORTFOLIO_CONTENT_LOADING = false"></script>
    <script>window.__PORTFOLIO_CONTENT_LOADING = false;</script>
    `;
const siteHtml = html.replace(moduleTag, `${loadContent}${moduleTag}`);

rmSync(siteDir, { recursive: true, force: true });
mkdirSync(siteDir, { recursive: true });
writeFileSync(path.join(siteDir, "index.html"), siteHtml);
// Netlify shows 404.html for unknown addresses; the page then shows its
// "This page doesn't exist" screen.
writeFileSync(path.join(siteDir, "404.html"), siteHtml);
copyFileSync(path.join(root, "content.js"), path.join(siteDir, "content.js"));
for (const file of ["og-image.png", "favicon.svg", "robots.txt"]) {
  copyFileSync(path.join(root, "public", file), path.join(siteDir, file));
}

rmSync(tempDir, { recursive: true, force: true });

const kb = Math.round(Buffer.byteLength(html) / 1024);
console.log(`Built dist/website/ (publish this folder) for ${siteUrl}`);
console.log(`Built dist/${path.basename(singleFile)} (${kb} KB, opens on its own)`);
