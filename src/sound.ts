/*
 * Small interface sounds, made in the browser (no audio files): a tick for
 * clicks, a rising chime when a section opens, a falling one when it closes,
 * a soft tap when the pointer finds an object, and a little fanfare for the
 * football. Visitors can switch them off from the top bar; the choice is
 * remembered on their device.
 */
import { useSyncExternalStore } from "react";

export type Cue = "click" | "open" | "close" | "hover" | "toggle" | "secret";

const KEY = "ksi-sound";
const listeners = new Set<() => void>();
let enabled = (() => {
  try {
    return window.localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
})();
let context: AudioContext | null = null;
let output: GainNode | null = null;

function audio() {
  // A closed context can't be reopened, so start a fresh one.
  if (context?.state === "closed") context = null;
  if (!context) {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return null;
    context = new Context();
    output = context.createGain();
    output.gain.value = 0.5;
    output.connect(context.destination);
  }
  return context;
}

/*
 * Browsers only allow sound after the visitor has touched the page, and they
 * can pause it again later: Safari, for one, "interrupts" it when the music
 * starts or stops. So every touch, key press or return to the tab wakes the
 * audio up again if it isn't running.
 */
function unlock() {
  const ctx = enabled ? audio() : null;
  if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
}
window.addEventListener("pointerdown", unlock, { capture: true, passive: true });
window.addEventListener("touchend", unlock, { capture: true, passive: true });
window.addEventListener("keydown", unlock, { capture: true });
document.addEventListener("visibilitychange", () => !document.hidden && unlock());

/* One soft note: a sine (or triangle) with a quick attack and a gentle fade. */
function note(ctx: AudioContext, frequency: number, start: number, length: number, volume: number, type: OscillatorType = "sine", slideTo?: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + length);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(output as GainNode);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

/* A breath of filtered noise, like a panel sliding. */
function whoosh(ctx: AudioContext, start: number, length: number, from: number, to: number, volume: number) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(from, start);
  filter.frequency.exponentialRampToValueAtTime(to, start + length);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + length * 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  source.connect(filter).connect(gain).connect(output as GainNode);
  source.start(start);
}

let lastHover = 0;

export function play(cue: Cue) {
  if (!enabled) return;
  const ctx = audio();
  if (!ctx) return;
  if (ctx.state === "running") {
    sound(ctx, cue);
    return;
  }
  // The browser has paused the audio: wake it, then play, if that's quick enough to still feel instant.
  const asked = performance.now();
  ctx
    .resume()
    .then(() => {
      if (ctx.state === "running" && performance.now() - asked < 400) sound(ctx, cue);
    })
    .catch(() => {});
}

function sound(ctx: AudioContext, cue: Cue) {
  const t = ctx.currentTime + 0.005;
  switch (cue) {
    case "click":
      note(ctx, 1400, t, 0.05, 0.12, "triangle", 900);
      break;
    case "hover":
      // At most a few taps a second, however fast the pointer moves.
      if (t - lastHover < 0.12) return;
      lastHover = t;
      note(ctx, 2200, t, 0.03, 0.035, "sine");
      break;
    case "open":
      whoosh(ctx, t, 0.38, 500, 2600, 0.08);
      note(ctx, 523.25, t + 0.04, 0.32, 0.1);
      note(ctx, 783.99, t + 0.12, 0.42, 0.09);
      break;
    case "close":
      whoosh(ctx, t, 0.32, 2400, 450, 0.07);
      note(ctx, 659.25, t + 0.02, 0.26, 0.08);
      note(ctx, 440, t + 0.1, 0.34, 0.07);
      break;
    case "toggle":
      note(ctx, 880, t, 0.07, 0.09, "triangle");
      note(ctx, 1320, t + 0.07, 0.09, 0.08, "triangle");
      break;
    case "secret":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(ctx, f, t + i * 0.08, 0.3, 0.09, "triangle"));
      break;
  }
}

export function soundEnabled() {
  return enabled;
}

export function setSound(on: boolean) {
  enabled = on;
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* Storage can be unavailable (private mode); the choice still applies for this visit. */
  }
  if (on) unlock();
  listeners.forEach((fn) => fn());
}

export function useSoundEnabled() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => enabled,
  );
}

/* Every button and link ticks when pressed (unless it plays its own sound). */
document.addEventListener(
  "click",
  (event) => {
    const target = (event.target as Element | null)?.closest?.("a, button");
    if (target && !target.closest("[data-sound='none']")) play("click");
  },
  { capture: true },
);
