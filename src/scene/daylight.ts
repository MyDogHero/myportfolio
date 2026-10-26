/*
 * The time of day in Bengaluru, which sets the sky outside the window, the
 * light in the room and whether the dog is awake. Add ?hour=13 (any hour,
 * 0–24) to the address to preview another time of day.
 */
import type { Phase } from "./textures";

const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "numeric",
  hour12: false,
});

/* The hour in Bengaluru as a decimal: 19.5 is half past seven in the evening. */
export function bengaluruHour(now = new Date()) {
  try {
    const override = new URLSearchParams(window.location.search).get("hour");
    if (override !== null && override.trim() !== "" && Number.isFinite(Number(override))) {
      return ((Number(override) % 24) + 24) % 24;
    }
  } catch {
    // No address to read (shouldn't happen in a browser); use the clock.
  }
  const [h, m] = clock.format(now).split(":").map(Number);
  return (h % 24) + m / 60;
}

export function phaseAt(hour: number): Phase {
  if (hour >= 19.5 || hour < 5) return "night";
  if (hour < 6.75) return "dawn";
  if (hour < 17.25) return "day";
  return "dusk";
}

/* The dog sleeps through the night and is up from half past six to seven in the evening. */
export const dogAwakeAt = (hour: number) => hour >= 6.5 && hour < 19;
