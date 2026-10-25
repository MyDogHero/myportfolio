import { createContext, useContext } from "react";
import { sections } from "@/content";

export const LAST = sections.length - 1;

export const clampIndex = (index: number) =>
  Math.max(0, Math.min(LAST, index));

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/*
 * True inside the overview's miniature pages. Miniatures are copies of the
 * real pages, so they skip element ids and anything interactive.
 */
export const ThumbContext = createContext(false);
export const useIsThumb = () => useContext(ThumbContext);

/* Returns the id, or nothing inside a miniature (ids must stay unique). */
export const useOwnId = (id: string) => (useIsThumb() ? undefined : id);
