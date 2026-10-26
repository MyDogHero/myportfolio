/*
 * Motion helpers, built on GSAP.
 *
 * Rules every animation here follows:
 *  - Only `transform` and `opacity` change from frame to frame (plus the text
 *    of a scrambling label), so things stay smooth on phones.
 *  - Visitors who ask for reduced motion get the finished state straight away.
 *  - Elements start hidden only once JavaScript has run, so nothing is ever
 *    stuck invisible if a script fails.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type RefObject } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);
gsap.defaults({ ease: "power3.out" });

export { gsap, ScrollTrigger, useGSAP };

export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const FINE_POINTER = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Resolves once the fonts are ready (or after a short wait), so text is drawn in its real shape. */
let fontsReady: Promise<void> | null = null;
export function waitForFonts(): Promise<void> {
  if (!fontsReady) {
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    const loaded = fonts
      ? Promise.all([
          fonts.load('900 1em "Archivo"'),
          fonts.load('400 1em "Archivo"'),
          fonts.load('italic 400 1em "Instrument Serif"'),
          fonts.load('700 1em "JetBrains Mono"'),
          fonts.load('500 1em "JetBrains Mono"'),
        ]).then(() => undefined)
      : Promise.resolve();
    fontsReady = Promise.race([
      loaded.catch(() => undefined),
      new Promise<void>((resolve) => window.setTimeout(resolve, 2500)),
    ]);
  }
  return fontsReady;
}

/*
 * Lifts the [data-reveal] children of `scope` into place. In a panel they
 * arrive together when it opens; on the text version they arrive as they
 * scroll into view.
 */
export function useReveal(scope: RefObject<HTMLElement | null>, mode: "open" | "scroll", key?: unknown) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const items = gsap.utils.toArray<HTMLElement>("[data-reveal]");
        if (!items.length) return;
        if (mode === "open") {
          gsap.from(items, { autoAlpha: 0, y: 34, duration: 0.9, stagger: 0.05, ease: "expo.out", delay: 0.45 });
          return;
        }
        gsap.set(items, { autoAlpha: 0, y: 40 });
        ScrollTrigger.batch(items, {
          start: "top 92%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.07, ease: "expo.out", overwrite: true }),
        });
      });
    },
    { scope, dependencies: [key], revertOnUpdate: true },
  );
}

/* Splits a number written in content.js ("96.14", "360,000") so its digits can roll. */
export function parseFigure(value: string) {
  const clean = value.replace(/,/g, "").trim();
  const number = /^\d+(\.\d+)?$/.test(clean) ? Number(clean) : Number.NaN;
  return { number, animatable: Number.isFinite(number) };
}

/*
 * Rolls each digit column of an odometer (see <Odometer>) up to its value,
 * like the numbers on an exchange board: when a panel opens, or when the
 * number scrolls into view on the text version.
 */
export function useOdometer(target: RefObject<HTMLElement | null>, mode: "open" | "scroll") {
  useGSAP(
    () => {
      const root = target.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const columns = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".odo-strip"));
        if (!columns.length) return;
        // Each strip holds 0–9 twice; it rolls through the first set and lands on the second.
        // Until then (and without motion) the plain digit shows instead.
        root.classList.add("is-rolling");
        gsap.set(columns, { yPercent: 0 });
        const roll = (delay: number) =>
          columns.forEach((strip, index) => {
            const digit = Number(strip.dataset.digit) || 0;
            gsap.to(strip, {
              yPercent: -((10 + digit) / 20) * 100,
              duration: 1.5 + index * 0.16,
              ease: "expo.out",
              delay: delay + index * 0.05,
            });
          });
        if (mode === "open") roll(0.6);
        else ScrollTrigger.create({ trigger: root, start: "top 92%", once: true, onEnter: () => roll(0) });
        return () => {
          root.classList.remove("is-rolling");
          gsap.set(columns, { clearProps: "transform" });
        };
      });
    },
    { scope: target },
  );
}

/* Pulls a button gently toward the mouse while it hovers, then lets it settle back. Desktop only. */
export function useMagnetic(target: RefObject<HTMLElement | null>, strength = 0.3) {
  useGSAP(() => {
    const button = target.current;
    if (!button) return;
    const mm = gsap.matchMedia();
    mm.add(FINE_POINTER, () => {
      const label = button.querySelector<HTMLElement>(".magnetic-label");
      const x = gsap.quickTo(button, "x", { duration: 0.6 });
      const y = gsap.quickTo(button, "y", { duration: 0.6 });
      const labelX = label ? gsap.quickTo(label, "x", { duration: 0.6 }) : null;
      const labelY = label ? gsap.quickTo(label, "y", { duration: 0.6 }) : null;
      let box = button.getBoundingClientRect();

      // Measure where the button sits at rest, even if it is still settling back.
      const enter = () => {
        const rect = button.getBoundingClientRect();
        const offsetX = Number(gsap.getProperty(button, "x")) || 0;
        const offsetY = Number(gsap.getProperty(button, "y")) || 0;
        box = new DOMRect(rect.left - offsetX, rect.top - offsetY, rect.width, rect.height);
      };
      const move = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        x(dx * strength);
        y(dy * strength);
        labelX?.(dx * strength * 0.45);
        labelY?.(dy * strength * 0.45);
      };
      const leave = () => {
        x(0);
        y(0);
        labelX?.(0);
        labelY?.(0);
      };

      button.addEventListener("pointerenter", enter);
      button.addEventListener("pointermove", move);
      button.addEventListener("pointerleave", leave);
      return () => {
        button.removeEventListener("pointerenter", enter);
        button.removeEventListener("pointermove", move);
        button.removeEventListener("pointerleave", leave);
      };
    });
  });
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>";

/* Briefly shuffles the letters of `element` before settling on `text`, like a terminal decoding it. */
export function scramble(element: HTMLElement, text: string, duration = 0.5) {
  if (prefersReducedMotion()) return;
  const state = { progress: 0 };
  gsap.to(state, {
    progress: 1,
    duration,
    ease: "none",
    onUpdate: () => {
      const settled = Math.floor(state.progress * text.length);
      let output = "";
      for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        output += i < settled || char === " " ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      element.textContent = output;
    },
    onComplete: () => {
      element.textContent = text;
    },
  });
}
