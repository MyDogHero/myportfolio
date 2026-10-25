import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { LAST, clampIndex, prefersReducedMotion } from "./shared";

/*
 * The page-turn engine.
 *
 * One number, `position`, says where the reader is (2.4 = 40% of the way from
 * page 3 to page 4). Every frame, each sheet is placed from that number: pages
 * already turned stay put, the next page slides in over them, the rest wait
 * off to the right. Because every sheet is moved together in the same frame,
 * nothing can drift or shake, whichever direction the pages turn.
 *
 * Keys, tabs and the scroll wheel animate `position`; a finger or a trackpad
 * swipe moves it directly and it settles on the nearest page when let go.
 */

type Ease = (t: number) => number;
const easeInOut: Ease = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut: Ease = (t) => 1 - Math.pow(1 - t, 3);

const clampPosition = (value: number) => Math.max(0, Math.min(LAST, value));
const isDialogOpen = () => Boolean(document.querySelector("dialog[open]"));

type SheetState = { x: number; covered: number; entering: number };

export function usePageTurner({
  trackRef,
  ambientRef,
  initial,
  onSettleTarget,
  onLiveIndex,
}: {
  trackRef: RefObject<HTMLElement | null>;
  ambientRef: RefObject<HTMLElement | null>;
  initial: number;
  /* Called when a turn starts, with the page it will land on. */
  onSettleTarget: (index: number) => void;
  /* Called while a finger or trackpad moves the pages, with the nearest page. */
  onLiveIndex: (index: number) => void;
}) {
  const position = useRef(initial);
  const frame = useRef<number | null>(null);
  const width = useRef(1);
  const drawn = useRef<SheetState[]>([]);
  const callbacks = useRef({ onSettleTarget, onLiveIndex });
  callbacks.current = { onSettleTarget, onLiveIndex };

  const render = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const sheets = track.children as HTMLCollectionOf<HTMLElement>;
    const p = clampPosition(position.current);
    const base = Math.min(Math.floor(p + 1e-4), LAST);
    const progress = p - base < 1e-4 ? 0 : p - base;
    const w = width.current;

    for (let i = 0; i < sheets.length; i += 1) {
      const next: SheetState = {
        x: i <= base ? 0 : i === base + 1 ? (1 - progress) * w : w,
        covered: i === base ? progress : 0,
        entering: i === base + 1 && progress > 0 ? Math.min(1, progress * 10) : 0,
      };
      // Only transform and opacity change here, so the browser just moves
      // and fades layers it has already drawn; nothing is repainted.
      const last = drawn.current[i];
      const sheet = sheets[i];
      if (!last || Math.abs(last.x - next.x) > 0.01) {
        sheet.style.transform = `translate3d(${next.x.toFixed(2)}px, 0, 0)`;
      }
      if (!last || last.covered !== next.covered) {
        const shade = sheet.querySelector<HTMLElement>(":scope > .panel-shade");
        if (shade) shade.style.opacity = next.covered ? next.covered.toFixed(3) : "";
      }
      if (!last || last.entering !== next.entering) {
        const edge = sheet.querySelector<HTMLElement>(":scope > .panel-edge");
        if (edge) edge.style.opacity = next.entering ? next.entering.toFixed(3) : "";
      }
      drawn.current[i] = next;
    }

    if (ambientRef.current) {
      ambientRef.current.style.transform = `translate3d(${(
        (p / Math.max(LAST, 1)) *
        -45
      ).toFixed(2)}%, 0, 0)`;
    }
  }, [trackRef, ambientRef]);

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  /* Glide to a page. Used by keys, tabs, the pager, the wheel and swipes. */
  const turnTo = useCallback(
    (
      index: number,
      options: { instant?: boolean; ease?: Ease; duration?: number } = {},
    ) => {
      const target = clampIndex(index);
      stop();
      callbacks.current.onSettleTarget(target);
      const from = position.current;
      const distance = Math.abs(target - from);
      if (options.instant || prefersReducedMotion() || distance < 0.001) {
        position.current = target;
        render();
        return;
      }
      const duration = options.duration ?? Math.min(1050, 420 + 170 * distance);
      const ease = options.ease ?? easeInOut;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        position.current = from + (target - from) * ease(t);
        render();
        frame.current = t < 1 ? requestAnimationFrame(step) : null;
      };
      frame.current = requestAnimationFrame(step);
    },
    [render, stop],
  );

  /* Move the pages directly (finger or trackpad), within one page either side. */
  const follow = useCallback(
    (value: number, anchor: number) => {
      position.current = clampPosition(
        Math.max(anchor - 1, Math.min(anchor + 1, value)),
      );
      render();
      callbacks.current.onLiveIndex(Math.round(position.current));
    },
    [render],
  );

  /* Where a swipe should land: the next page if it moved far or fast enough. */
  const settle = useCallback(
    (anchor: number, velocity = 0) => {
      const moved = position.current - anchor;
      let target = anchor;
      if (Math.abs(velocity) > 0.35) target = anchor + Math.sign(velocity);
      else if (Math.abs(moved) > 0.2) target = anchor + Math.sign(moved);
      turnTo(target, { ease: easeOut, duration: 380 });
    },
    [turnTo],
  );

  // First placement, before the first paint.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (track) width.current = Math.max(track.clientWidth, 1);
    render();
  }, [render, trackRef]);

  // Re-place the sheets when the window changes size.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      width.current = Math.max(track.clientWidth, 1);
      drawn.current = [];
      render();
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, [render, trackRef]);

  // Touch: follow the finger sideways; vertical drags scroll the page as usual.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let drag: {
      id: number;
      startX: number;
      startY: number;
      from: number;
      anchor: number;
      sideways: boolean | null;
      samples: { t: number; x: number }[];
    } | null = null;

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || isDialogOpen()) return;
      drag = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        from: position.current,
        anchor: Math.round(position.current),
        sideways: null,
        samples: [{ t: event.timeStamp, x: event.clientX }],
      };
    };

    const onMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (drag.sideways === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        drag.sideways = Math.abs(dx) > Math.abs(dy);
        if (!drag.sideways) return;
        stop();
        drag.from = position.current;
        drag.anchor = Math.round(position.current);
        drag.startX = event.clientX;
        track.setPointerCapture?.(event.pointerId);
      }
      if (!drag.sideways) return;
      drag.samples.push({ t: event.timeStamp, x: event.clientX });
      while (drag.samples.length > 2 && event.timeStamp - drag.samples[0].t > 100) {
        drag.samples.shift();
      }
      follow(drag.from - (event.clientX - drag.startX) / width.current, drag.anchor);
    };

    const onUp = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      const finished = drag;
      drag = null;
      if (!finished.sideways) return;
      const first = finished.samples[0];
      const last = finished.samples[finished.samples.length - 1];
      const elapsed = Math.max(1, last.t - first.t);
      // Finger speed in px/ms, positive when swiping towards later pages.
      const velocity =
        event.type === "pointercancel" ? 0 : -(last.x - first.x) / elapsed;
      settle(finished.anchor, velocity);
    };

    // Stop the page scrolling vertically once a sideways swipe has begun.
    const onTouchMove = (event: TouchEvent) => {
      if (drag?.sideways) event.preventDefault();
    };

    track.addEventListener("pointerdown", onDown);
    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onUp);
    track.addEventListener("pointercancel", onUp);
    track.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      track.removeEventListener("pointerdown", onDown);
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerup", onUp);
      track.removeEventListener("pointercancel", onUp);
      track.removeEventListener("touchmove", onTouchMove);
    };
  }, [follow, settle, stop, trackRef]);

  // Trackpad sideways swipes (and shift + wheel) move the pages directly.
  useEffect(() => {
    let gesture: { anchor: number; last: number } | null = null;
    let timer: number | null = null;

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || isDialogOpen()) return;
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      const now = performance.now();
      if (!gesture || now - gesture.last > 180) {
        stop();
        gesture = { anchor: Math.round(position.current), last: now };
      }
      gesture.last = now;
      const delta = event.deltaMode === 1 ? event.deltaX * 16 : event.deltaX;
      follow(position.current + delta / width.current, gesture.anchor);

      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (gesture) settle(gesture.anchor);
        gesture = null;
        timer = null;
      }, 140);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [follow, settle, stop]);

  useEffect(() => stop, [stop]);

  return { turnTo, position };
}
