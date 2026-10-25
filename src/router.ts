/*
 * The sections and their web addresses.
 *
 * The home page is the 3D room. Each section is an object in the room (the
 * monitors, the bookshelf, the ID cards…) and also has its own address
 * (/about/, /experience/ …): opening that address flies the camera to the
 * object and opens its panel. The build writes a copy of the page at each
 * address, so links can be shared and work on Netlify and GitHub Pages alike.
 *
 * The single-file copy (opened straight from disk) can't change its address,
 * so it uses #about, #experience … instead.
 */
import { createContext, useContext } from "react";
import { profile } from "@/content";

export const routes = [
  { id: "home", slug: "", label: "Overview", object: "The room" },
  { id: "about", slug: "about", label: "About", object: "Trading monitors" },
  { id: "education", slug: "education", label: "Education", object: "Bookshelf" },
  { id: "experience", slug: "experience", label: "Experience", object: "ID cards" },
  { id: "achievements", slug: "achievements", label: "Achievements", object: "Trophy shelf" },
  { id: "contact", slug: "contact", label: "Contact", object: "Desk phone" },
] as const;

export type RouteId = (typeof routes)[number]["id"];

const route = (id: RouteId) => routes.find((item) => item.id === id) ?? routes[0];

export const hashMode =
  typeof window !== "undefined" &&
  (Boolean(window.__PORTFOLIO_STANDALONE) || window.location.protocol === "file:");

/* Splits an address like /myportfolio/about/ into the page and the site's root folder. */
function parsePath(pathname: string): { id: RouteId; root: string } {
  let path = pathname.replace(/index\.html$/, "");
  if (!path.endsWith("/")) path += "/";
  const segments = path.split("/").filter(Boolean);
  const match = routes.find((item) => item.slug && item.slug === segments[segments.length - 1]);
  if (!match) return { id: "home", root: path };
  return { id: match.id, root: `/${segments.slice(0, -1).map((part) => `${part}/`).join("")}` };
}

function fromHash(hash: string): RouteId | null {
  const slug = hash.replace(/^#\/?/, "");
  if (!slug) return null;
  return routes.find((item) => item.slug === slug || item.id === slug)?.id ?? null;
}

const startPath = typeof window !== "undefined" ? parsePath(window.location.pathname) : null;

/* The folder the site lives in, e.g. "/" on Netlify or "/myportfolio/" on GitHub Pages. */
const siteRoot = startPath?.root ?? "/";

export function currentRoute(): RouteId {
  if (hashMode) return fromHash(window.location.hash) ?? startPath?.id ?? "home";
  return parsePath(window.location.pathname).id;
}

export function hrefFor(id: RouteId): string {
  const { slug } = route(id);
  if (hashMode) return `#${slug || "home"}`;
  return `${siteRoot}${slug ? `${slug}/` : ""}`;
}

/* The address of a file from the public folder (photo, CV). */
export function assetUrl(file: string): string {
  if (/^https?:\/\//.test(file)) return file;
  const clean = file.replace(/^\.?\//, "");
  if (window.__PORTFOLIO_STANDALONE && window.__PORTFOLIO_SITE_URL) {
    return `${window.__PORTFOLIO_SITE_URL}/${clean}`;
  }
  return `${siteRoot}${clean}`;
}

export function titleFor(id: RouteId): string {
  if (id === "home") return `${profile.name} – Portfolio`;
  const label = id === "achievements" ? "Achievements & Certifications" : route(id).label;
  return `${label} – ${profile.name}`;
}

export type Router = {
  current: RouteId;
  go: (id: RouteId) => void;
};

export const RouterContext = createContext<Router>({ current: "home", go: () => undefined });
export const useRouter = () => useContext(RouterContext);
