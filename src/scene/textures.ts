/*
 * Everything drawn onto objects in the room: ID cards, book spines, monitor
 * screens, the LED ticker, the sky and skyline outside the window, the
 * certificates, the clock face, the neon sign and so on. All of it is drawn
 * on canvases from the words in content.js, so editing that file updates the
 * room too.
 */
import * as THREE from "three";

export const MONO = '"JetBrains Mono", ui-monospace, monospace';
export const SANS = '"Archivo", "Helvetica Neue", Arial, sans-serif';
export const SERIF = '"Instrument Serif", Georgia, serif';

/* Science Blue, YInMn Blue, and a lighter blue for things that glow. */
export const SCIENCE = "#0066cc";
export const YINMN = "#2e5090";
export const GLOW = "#4d9bff";
export const SLATE = "#141a1e";
export const INK = "#eceae2";
export const DREAM = "#a77bff"; // the dog's zZ

export type Phase = "night" | "dawn" | "day" | "dusk";

export function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  return { canvas, ctx };
}

export function texture(canvas: HTMLCanvasElement, repeat?: [number, number]) {
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  if (repeat) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeat[0], repeat[1]);
  }
  return map;
}

/* Text squeezed horizontally, like a condensed typeface. */
function condensed(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  maxWidth: number,
  { weight = 900, squeeze = 0.7, align = "left" as CanvasTextAlign } = {},
) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${SANS}`;
  const natural = ctx.measureText(text).width * squeeze;
  const scale = natural > maxWidth ? maxWidth / natural : 1;
  ctx.translate(x, y);
  ctx.scale(squeeze * scale, 1);
  ctx.textAlign = align;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/* Wraps text into lines that fit `width`. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function noise(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  const image = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    image.data[i] += n;
    image.data[i + 1] += n;
    image.data[i + 2] += n;
  }
  ctx.putImageData(image, 0, 0);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/* A seeded random number generator, so the skyline keeps its shape between redraws. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ------------------------------------------------------------- surfaces */

/* Slate wall panels with fine seams. */
export function wallTexture() {
  const { canvas, ctx } = makeCanvas(1024, 1024);
  ctx.fillStyle = "#192027";
  ctx.fillRect(0, 0, 1024, 1024);
  const cols = 2;
  const rows = 3;
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      const x = (c * 1024) / cols;
      const y = (r * 1024) / rows;
      const g = ctx.createLinearGradient(x, y, x + 512, y + 341);
      g.addColorStop(0, "#1f2730");
      g.addColorStop(1, "#182028");
      ctx.fillStyle = g;
      ctx.fillRect(x + 4, y + 4, 1024 / cols - 8, 1024 / rows - 8);
    }
  }
  noise(ctx, 1024, 1024, 10);
  return canvas;
}

/* Dark herringbone floorboards. */
export function floorTexture() {
  const { canvas, ctx } = makeCanvas(1024, 1024);
  ctx.fillStyle = "#16110d";
  ctx.fillRect(0, 0, 1024, 1024);
  const w = 64;
  const l = 256;
  const tones = ["#2b2018", "#31251c", "#261c15", "#2e2219", "#352820"];
  for (let row = -4; row < 20; row += 1) {
    for (let col = -4; col < 20; col += 1) {
      const baseX = col * w * 2 + (row % 2) * w;
      const baseY = row * w * 2;
      for (let k = 0; k < 2; k += 1) {
        ctx.save();
        ctx.translate(baseX + k * w, baseY + k * w);
        ctx.rotate(k ? -Math.PI / 4 : Math.PI / 4);
        ctx.fillStyle = tones[(row * 7 + col * 3 + k) % tones.length];
        ctx.fillRect(0, 0, l, w - 3);
        ctx.restore();
      }
    }
  }
  noise(ctx, 1024, 1024, 14);
  return canvas;
}

export function rugTexture() {
  const { canvas, ctx } = makeCanvas(1024, 768);
  ctx.fillStyle = "#1d2531";
  ctx.fillRect(0, 0, 1024, 768);
  ctx.strokeStyle = "#384456";
  ctx.lineWidth = 18;
  ctx.strokeRect(40, 40, 944, 688);
  ctx.strokeStyle = GLOW;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 4;
  ctx.strokeRect(80, 80, 864, 608);
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 18; i += 1) {
    ctx.beginPath();
    ctx.moveTo(120 + i * 44, 680);
    ctx.lineTo(120 + i * 44 + 80, 100);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  noise(ctx, 1024, 768, 18);
  return canvas;
}

/* A pegboard: dark board with rows of holes. */
export function pegboardTexture() {
  const { canvas, ctx } = makeCanvas(1024, 480);
  ctx.fillStyle = "#11161c";
  ctx.fillRect(0, 0, 1024, 480);
  ctx.fillStyle = "#05080b";
  for (let x = 24; x < 1024; x += 28) {
    for (let y = 22; y < 480; y += 28) {
      ctx.beginPath();
      ctx.arc(x, y, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return canvas;
}

/* Couch fabric: a fine weave. */
export function fabricTexture(base: string) {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#000";
  for (let i = 0; i < 256; i += 4) {
    ctx.fillRect(i, 0, 1, 256);
    ctx.fillRect(0, i, 256, 1);
  }
  ctx.globalAlpha = 1;
  noise(ctx, 256, 256, 16);
  return canvas;
}

/* ----------------------------------------------------------- the window */

const SKIES: Record<Phase, [number, string][]> = {
  night: [
    [0, "#060a1a"],
    [0.45, "#141a42"],
    [0.72, "#3a2a5a"],
    [0.9, "#8a4a50"],
    [1, "#c9783f"],
  ],
  dawn: [
    [0, "#1c2756"],
    [0.4, "#5a5c96"],
    [0.68, "#d98c88"],
    [0.86, "#f6b47a"],
    [1, "#ffdca0"],
  ],
  day: [
    [0, "#2f73d6"],
    [0.45, "#6aa6ec"],
    [0.8, "#b9d8f6"],
    [1, "#e3eef8"],
  ],
  dusk: [
    [0, "#1d2160"],
    [0.4, "#62408a"],
    [0.66, "#d0607a"],
    [0.86, "#ff8f52"],
    [1, "#ffc66e"],
  ],
};

/* The sky over Bengaluru for the time of day: stars and moon at night, sun and clouds by day. */
export function skyTexture(phase: Phase) {
  const { canvas, ctx } = makeCanvas(2048, 1024);
  const sky = ctx.createLinearGradient(0, 0, 0, 1024);
  SKIES[phase].forEach(([stop, colour]) => sky.addColorStop(stop, colour));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 2048, 1024);
  const random = seeded(7);

  if (phase === "night" || phase === "dawn") {
    for (let i = 0; i < (phase === "night" ? 260 : 60); i += 1) {
      ctx.fillStyle = `rgba(255,255,255,${random() * (phase === "night" ? 0.75 : 0.35)})`;
      ctx.fillRect(random() * 2048, random() * 520, 2, 2);
    }
  }
  if (phase === "night") {
    const moon = ctx.createRadialGradient(1500, 190, 10, 1500, 190, 150);
    moon.addColorStop(0, "rgba(255,248,230,1)");
    moon.addColorStop(0.28, "rgba(240,240,255,0.95)");
    moon.addColorStop(0.32, "rgba(200,210,255,0.25)");
    moon.addColorStop(1, "rgba(160,180,255,0)");
    ctx.fillStyle = moon;
    ctx.fillRect(1300, 0, 400, 400);
  } else {
    // The sun: high by day, low and orange at dawn and dusk.
    const low = phase !== "day";
    const sx = phase === "dawn" ? 520 : phase === "dusk" ? 1520 : 1450;
    const sy = low ? 820 : 210;
    const sun = ctx.createRadialGradient(sx, sy, 10, sx, sy, low ? 260 : 220);
    sun.addColorStop(0, low ? "rgba(255,230,170,1)" : "rgba(255,255,240,1)");
    sun.addColorStop(0.18, low ? "rgba(255,200,120,0.95)" : "rgba(255,250,220,0.9)");
    sun.addColorStop(0.24, low ? "rgba(255,160,90,0.35)" : "rgba(255,245,210,0.3)");
    sun.addColorStop(1, "rgba(255,200,150,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(sx - 300, sy - 300, 600, 600);
  }
  if (phase === "day" || phase === "dusk") {
    // Soft clouds.
    ctx.fillStyle = phase === "day" ? "rgba(255,255,255,0.75)" : "rgba(255,190,170,0.45)";
    for (let i = 0; i < 9; i += 1) {
      const cx = random() * 2048;
      const cy = 120 + random() * 330;
      for (let k = 0; k < 6; k += 1) {
        ctx.beginPath();
        ctx.ellipse(cx + k * 34 - 90, cy + Math.sin(k) * 10, 60 + random() * 40, 22 + random() * 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Distant towers.
  const lit = phase === "night" ? 0.22 : phase === "day" ? 0 : 0.12;
  const tower = { night: "#1c1830", dawn: "#4e4870", day: "#8a9bb4", dusk: "#3e2f55" }[phase];
  let x = 0;
  while (x < 2048) {
    const w = 40 + random() * 90;
    const h = 120 + random() * 260;
    ctx.fillStyle = tower;
    ctx.fillRect(x, 1024 - h, w, h);
    for (let wy = 1024 - h + 12; wy < 1010; wy += 16) {
      for (let wx = x + 6; wx < x + w - 6; wx += 12) {
        const r = random();
        if (r < lit) {
          ctx.fillStyle = r < lit * 0.8 ? "rgba(255,190,110,0.55)" : "rgba(180,220,255,0.5)";
          ctx.fillRect(wx, wy, 5, 7);
        } else if (phase === "day" && r < 0.3) {
          ctx.fillStyle = "rgba(220,235,250,0.35)";
          ctx.fillRect(wx, wy, 5, 7);
        }
      }
    }
    x += w + random() * 10;
  }
  return canvas;
}

/* Nearer buildings, on a transparent background, so they slide past the sky as the camera moves. */
export function skylineTexture(phase: Phase) {
  const { canvas, ctx } = makeCanvas(2048, 1024);
  const random = seeded(19);
  const body = { night: "#0f0d1c", dawn: "#2c2840", day: "#5b6a80", dusk: "#21182e" }[phase];
  const side = { night: "#171427", dawn: "#3a3552", day: "#6e7d93", dusk: "#2c2140" }[phase];
  const lit = phase === "night" ? 0.34 : phase === "day" ? 0 : 0.2;
  let x = -20;
  while (x < 2060) {
    const w = 110 + random() * 180;
    const h = 260 + random() * 520;
    const top = 1024 - h;
    ctx.fillStyle = body;
    ctx.fillRect(x, top, w, h);
    ctx.fillStyle = side;
    ctx.fillRect(x, top, w * 0.18, h);
    if (random() < 0.4) {
      ctx.fillStyle = body;
      ctx.fillRect(x + w * 0.45, top - 50, 6, 50);
      ctx.fillStyle = phase === "day" ? "#c94a4a" : "#ff4d4d";
      ctx.beginPath();
      ctx.arc(x + w * 0.45 + 3, top - 52, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let wy = top + 18; wy < 1010; wy += 26) {
      for (let wx = x + 14; wx < x + w - 14; wx += 22) {
        const r = random();
        if (r < lit) {
          ctx.fillStyle = r < lit * 0.82 ? "rgba(255,196,120,0.9)" : "rgba(200,240,255,0.85)";
          ctx.fillRect(wx, wy, 11, 14);
        } else if (phase === "day" && r < 0.45) {
          // By day the windows reflect the sky.
          ctx.fillStyle = r < 0.2 ? "rgba(190,215,240,0.55)" : "rgba(120,150,185,0.6)";
          ctx.fillRect(wx, wy, 11, 14);
        }
      }
    }
    x += w + 8 + random() * 40;
  }
  return canvas;
}

/* The lit window strip of a metro train. */
export function trainTexture() {
  const { canvas, ctx } = makeCanvas(512, 64);
  ctx.fillStyle = "#6b2d8f";
  ctx.fillRect(0, 0, 512, 64);
  ctx.fillStyle = "#4a1d66";
  ctx.fillRect(0, 44, 512, 20);
  for (let i = 0; i < 9; i += 1) {
    ctx.fillStyle = "rgba(255,240,210,0.95)";
    ctx.fillRect(14 + i * 56, 12, 38, 22);
  }
  return canvas;
}

/* -------------------------------------------------------- signs & LEDs */

/* The neon sign: bold letters with a white-hot core and a blue glow, so it stays readable. */
export function neonTexture(text: string) {
  const { canvas, ctx } = makeCanvas(1600, 360);
  let size = 170;
  const font = (px: number) => `800 ${px}px ${SANS}`;
  ctx.font = font(size);
  while (ctx.measureText(text).width > 1380 && size > 60) {
    size -= 4;
    ctx.font = font(size);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Outer glow, then the tube, then its bright core.
  ctx.shadowColor = "rgba(77,155,255,0.95)";
  ctx.shadowBlur = 46;
  ctx.fillStyle = "rgba(77,155,255,0.9)";
  ctx.fillText(text, 800, 186);
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#9cc8ff";
  ctx.fillText(text, 800, 186);
  ctx.shadowBlur = 0;
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#f2f8ff";
  ctx.strokeText(text, 800, 186);
  return canvas;
}

/* The LED ticker above the window: blue letters made of dots, on black. */
export function tickerTexture(items: string[]) {
  const height = 96;
  const text = `${items.join("   ✦   ")}   ✦   `;
  const probe = makeCanvas(8, 8).ctx;
  probe.font = `700 56px ${MONO}`;
  const width = Math.min(8192, Math.ceil(probe.measureText(text).width) + 40);
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.fillStyle = "#050607";
  ctx.fillRect(0, 0, width, height);
  ctx.font = `700 56px ${MONO}`;
  ctx.textBaseline = "middle";
  let x = 20;
  for (const part of text.split(/(▲|▼)/)) {
    ctx.fillStyle = part === "▼" ? "#ff6b4a" : part === "▲" ? "#8fe3ff" : GLOW;
    ctx.fillText(part, x, height / 2 + 2);
    x += ctx.measureText(part).width;
  }
  // Break the letters into LED dots.
  ctx.globalCompositeOperation = "destination-in";
  const dots = makeCanvas(6, 6);
  dots.ctx.fillStyle = "#fff";
  dots.ctx.beginPath();
  dots.ctx.arc(3, 3, 2.3, 0, Math.PI * 2);
  dots.ctx.fill();
  const pattern = ctx.createPattern(dots.canvas, "repeat");
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "#050607";
  ctx.fillRect(0, 0, width, height);
  return { canvas, aspect: width / height };
}

/* A floating "z" for the sleeping dog. */
export function zTexture() {
  const { canvas, ctx } = makeCanvas(128, 128);
  ctx.font = `800 96px ${SANS}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(167,123,255,0.9)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = DREAM;
  ctx.fillText("z", 64, 70);
  return canvas;
}

/* A round badge of the Indian flag: saffron, white with the Ashoka Chakra, green. */
export function flagBadgeTexture() {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.save();
  ctx.beginPath();
  ctx.arc(128, 128, 124, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#ff9933";
  ctx.fillRect(0, 0, 256, 86);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 86, 256, 86);
  ctx.fillStyle = "#138808";
  ctx.fillRect(0, 172, 256, 84);
  ctx.restore();
  ctx.strokeStyle = "#000080";
  ctx.fillStyle = "#000080";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(128, 129, 36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(128, 129, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 24; i += 1) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(128, 129);
    ctx.lineTo(128 + Math.cos(a) * 35, 129 + Math.sin(a) * 35);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(128, 128, 124, 0, Math.PI * 2);
  ctx.stroke();
  return canvas;
}

/* ------------------------------------------------------------ ID cards */

const isLight = (hex: string) => {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
};

export function idCardTexture(
  card: {
    reserved: boolean;
    org: string;
    role: string;
    dates: string;
    color: string;
    initials: string;
    name: string;
  },
  photo?: HTMLImageElement,
) {
  const { canvas, ctx } = makeCanvas(512, 768);
  roundRect(ctx, 0, 0, 512, 768, 36);
  ctx.fillStyle = card.reserved ? "#1a2028" : "#f4f2ea";
  ctx.fill();
  if (card.reserved) {
    ctx.setLineDash([18, 14]);
    ctx.strokeStyle = "rgba(236,234,226,0.45)";
    ctx.lineWidth = 6;
    roundRect(ctx, 26, 26, 460, 716, 26);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = GLOW;
    ctx.font = `700 34px ${MONO}`;
    ctx.textAlign = "center";
    ctx.fillText("● PENDING", 256, 120);
    ctx.fillStyle = INK;
    condensed(ctx, "RESERVED", 256, 400, 150, 420, { align: "center" });
    ctx.fillStyle = "rgba(236,234,226,0.7)";
    ctx.font = `500 30px ${MONO}`;
    wrap(ctx, `for ${card.role}`.toUpperCase(), 400).forEach((line, i) => ctx.fillText(line, 256, 480 + i * 42));
    return canvas;
  }
  // Coloured band where the lanyard clips on.
  ctx.save();
  roundRect(ctx, 0, 0, 512, 768, 36);
  ctx.clip();
  ctx.fillStyle = card.color;
  ctx.fillRect(0, 0, 512, 190);
  ctx.restore();
  ctx.fillStyle = "#f4f2ea";
  roundRect(ctx, 196, 30, 120, 22, 11);
  ctx.fill();
  ctx.fillStyle = isLight(card.color) ? "#0a0c0d" : "#ffffff";
  condensed(ctx, card.org.toUpperCase(), 40, 150, 92, 432);
  // Photo square: the photo from content.js if there is one, otherwise the initials.
  ctx.fillStyle = SLATE;
  roundRect(ctx, 40, 230, 170, 200, 16);
  ctx.fill();
  if (photo) {
    ctx.save();
    roundRect(ctx, 40, 230, 170, 200, 16);
    ctx.clip();
    const scale = Math.max(170 / photo.naturalWidth, 200 / photo.naturalHeight);
    const w = photo.naturalWidth * scale;
    const h = photo.naturalHeight * scale;
    ctx.drawImage(photo, 40 + (170 - w) / 2, 230 + (200 - h) / 2, w, h);
    ctx.restore();
  } else {
    ctx.fillStyle = GLOW;
    condensed(ctx, card.initials, 125, 365, 110, 150, { align: "center" });
  }
  ctx.fillStyle = "#0a0c0d";
  ctx.font = `700 26px ${MONO}`;
  ctx.fillText("EMPLOYEE", 236, 262);
  ctx.font = `500 22px ${MONO}`;
  ctx.fillStyle = "#4b5357";
  wrap(ctx, card.name.toUpperCase(), 240).forEach((line, i) => ctx.fillText(line, 236, 300 + i * 30));
  ctx.fillStyle = "#0a0c0d";
  const roleLines = (() => {
    ctx.font = `900 64px ${SANS}`;
    return wrap(ctx, card.role.toUpperCase(), 600);
  })();
  roleLines.slice(0, 3).forEach((line, i) => condensed(ctx, line, 40, 520 + i * 62, 64, 432));
  ctx.font = `600 26px ${MONO}`;
  ctx.fillStyle = SCIENCE;
  ctx.fillText(card.dates.toUpperCase(), 40, 520 + Math.min(3, roleLines.length) * 62 + 6);
  // Barcode.
  ctx.fillStyle = "#0a0c0d";
  const random = seeded(card.org.length + 3);
  let bx = 40;
  while (bx < 470) {
    const bw = 2 + Math.floor(random() * 7);
    ctx.fillRect(bx, 690, bw, 46);
    bx += bw + 2 + Math.floor(random() * 6);
  }
  return canvas;
}

/* --------------------------------------------------------------- books */

/* The cover of the book being read: its title big and black on cream, the author below a blue rule. */
export function bookCoverTexture(title: string, author: string) {
  const { canvas, ctx } = makeCanvas(512, 768);
  ctx.fillStyle = "#efe9dc";
  ctx.fillRect(0, 0, 512, 768);
  noise(ctx, 512, 768, 10);
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.fillRect(0, 0, 18, 768);
  ctx.fillStyle = "#121416";
  ctx.font = `900 260px ${SANS}`;
  const lines = wrap(ctx, title.toUpperCase(), 600).slice(0, 3);
  const size = lines.length > 1 ? 170 : 260;
  lines.forEach((line, i) => condensed(ctx, line, 60, 300 + i * size * 0.9, size, 410));
  ctx.fillStyle = SCIENCE;
  ctx.fillRect(60, 560, 392, 10);
  ctx.fillStyle = "#121416";
  ctx.font = `600 34px ${MONO}`;
  wrap(ctx, author.toUpperCase(), 392)
    .slice(0, 2)
    .forEach((line, i) => ctx.fillText(line, 60, 626 + i * 42));
  return canvas;
}

export function spineTexture(title: string, color: string, light: boolean) {
  const { canvas, ctx } = makeCanvas(96, 640);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 96, 640);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 40, 96, 6);
  ctx.fillRect(0, 594, 96, 6);
  if (title) {
    ctx.save();
    ctx.translate(58, 590);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = light ? "#0a0c0d" : "#f4f2ea";
    ctx.font = `700 30px ${MONO}`;
    let size = 30;
    while (ctx.measureText(title.toUpperCase()).width > 520 && size > 14) {
      size -= 1;
      ctx.font = `700 ${size}px ${MONO}`;
    }
    ctx.fillText(title.toUpperCase(), 0, 0);
    ctx.restore();
  }
  return canvas;
}

/* ------------------------------------------------------- achievements */

export function certificateTexture(title: string, issuer: string) {
  const { canvas, ctx } = makeCanvas(768, 560);
  ctx.fillStyle = "#f3eedf";
  ctx.fillRect(0, 0, 768, 560);
  ctx.strokeStyle = "#b8995a";
  ctx.lineWidth = 6;
  ctx.strokeRect(24, 24, 720, 512);
  ctx.lineWidth = 2;
  ctx.strokeRect(38, 38, 692, 484);
  ctx.textAlign = "center";
  ctx.fillStyle = "#6b5730";
  ctx.font = `600 22px ${MONO}`;
  ctx.fillText("CERTIFICATE", 384, 110);
  ctx.fillStyle = "#1a1a1a";
  ctx.font = `italic 400 54px ${SERIF}`;
  wrap(ctx, title, 620).forEach((line, i) => ctx.fillText(line, 384, 196 + i * 58));
  ctx.font = `500 22px ${MONO}`;
  ctx.fillStyle = "#444";
  ctx.fillText(issuer.toUpperCase(), 384, 360);
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(120, 450);
  ctx.lineTo(320, 450);
  ctx.stroke();
  const seal = ctx.createRadialGradient(600, 440, 10, 600, 440, 60);
  seal.addColorStop(0, "#e9c96a");
  seal.addColorStop(1, "#a8823a");
  ctx.fillStyle = seal;
  ctx.beginPath();
  ctx.arc(600, 440, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6b5730";
  ctx.font = `700 34px ${SANS}`;
  ctx.fillText("✓", 600, 452);
  return canvas;
}

export function emptyFrameTexture(label: string) {
  const { canvas, ctx } = makeCanvas(768, 560);
  ctx.fillStyle = "#12171c";
  ctx.fillRect(0, 0, 768, 560);
  ctx.setLineDash([16, 12]);
  ctx.strokeStyle = "rgba(236,234,226,0.35)";
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, 688, 480);
  ctx.setLineDash([]);
  ctx.textAlign = "center";
  ctx.fillStyle = GLOW;
  ctx.font = `600 24px ${MONO}`;
  ctx.fillText("● PENDING", 384, 230);
  ctx.fillStyle = "rgba(236,234,226,0.7)";
  ctx.font = `500 26px ${MONO}`;
  wrap(ctx, `Reserved for ${label}`.toUpperCase(), 560).forEach((line, i) => ctx.fillText(line, 384, 290 + i * 38));
  return canvas;
}

/* A small engraved plate. */
export function plateTexture(top: string, bottom: string) {
  const { canvas, ctx } = makeCanvas(512, 256);
  ctx.fillStyle = "#111416";
  ctx.fillRect(0, 0, 512, 256);
  ctx.textAlign = "center";
  ctx.fillStyle = "#e9cf7a";
  condensed(ctx, top, 256, 150, 140, 470, { align: "center" });
  ctx.font = `600 30px ${MONO}`;
  ctx.fillText(bottom.toUpperCase(), 256, 218);
  return canvas;
}

export function medalTexture(label: string, colour: string) {
  const { canvas, ctx } = makeCanvas(256, 256);
  const g = ctx.createRadialGradient(100, 90, 10, 128, 128, 128);
  g.addColorStop(0, "#fff3c4");
  g.addColorStop(0.5, colour);
  g.addColorStop(1, "#6b5320");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(128, 128, 128, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(60,40,10,0.5)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(128, 128, 104, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#3d2c0c";
  ctx.textAlign = "center";
  condensed(ctx, label, 128, 150, 70, 170, { align: "center" });
  return canvas;
}

/* --------------------------------------------------------------- desk */

export function clockFaceTexture() {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.fillStyle = "#f2efe6";
  ctx.beginPath();
  ctx.arc(256, 256, 256, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0c0d";
  for (let i = 0; i < 60; i += 1) {
    const a = (i / 60) * Math.PI * 2;
    const long = i % 5 === 0;
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate(a);
    ctx.fillRect(-(long ? 5 : 2), -236, long ? 10 : 4, long ? 34 : 14);
    ctx.restore();
  }
  ctx.textAlign = "center";
  ctx.font = `700 26px ${MONO}`;
  ctx.fillText("BENGALURU", 256, 180);
  ctx.fillStyle = SCIENCE;
  ctx.font = `600 22px ${MONO}`;
  ctx.fillText("IST", 256, 352);
  return canvas;
}

export function phoneScreenTexture(name: string, email: string) {
  const { canvas, ctx } = makeCanvas(360, 720);
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, "#0d2246");
  g.addColorStop(1, "#070a12");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 360, 720);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(236,234,226,0.7)";
  ctx.font = `500 22px ${MONO}`;
  ctx.fillText("INCOMING", 180, 140);
  ctx.fillStyle = INK;
  condensed(ctx, "LET’S TALK", 180, 250, 96, 320, { align: "center" });
  ctx.font = `500 17px ${MONO}`;
  ctx.fillStyle = "rgba(236,234,226,0.8)";
  wrap(ctx, name.toUpperCase(), 300).forEach((line, i) => ctx.fillText(line, 180, 300 + i * 26));
  ctx.fillText(email.length > 26 ? `${email.slice(0, 24)}…` : email, 180, 372);
  ctx.fillStyle = SCIENCE;
  ctx.beginPath();
  ctx.arc(180, 590, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 52px ${SANS}`;
  ctx.fillText("✆", 180, 608);
  return canvas;
}

export function businessCardTexture(name: string, line: string, email: string) {
  const { canvas, ctx } = makeCanvas(512, 300);
  ctx.fillStyle = "#0e1218";
  ctx.fillRect(0, 0, 512, 300);
  ctx.fillStyle = SCIENCE;
  ctx.fillRect(0, 0, 14, 300);
  ctx.fillStyle = INK;
  const [first = "", ...rest] = name.split(/\s+/);
  condensed(ctx, first.toUpperCase(), 44, 100, 72, 420);
  condensed(ctx, rest.join(" ").toUpperCase(), 44, 160, 52, 420);
  ctx.font = `italic 400 30px ${SERIF}`;
  ctx.fillStyle = GLOW;
  ctx.fillText(line, 44, 210);
  ctx.font = `500 18px ${MONO}`;
  ctx.fillStyle = "rgba(236,234,226,0.75)";
  ctx.fillText(email, 44, 262);
  return canvas;
}

export function keyboardTexture() {
  const { canvas, ctx } = makeCanvas(512, 160);
  ctx.fillStyle = "#1d2226";
  ctx.fillRect(0, 0, 512, 160);
  for (let r = 0; r < 5; r += 1) {
    for (let c = 0; c < 15; c += 1) {
      ctx.fillStyle = (r === 0 && c === 0) || (r === 4 && c > 4 && c < 10) ? GLOW : "#2c3338";
      if (r === 4 && c > 4 && c < 10 && c !== 5) continue;
      const w = r === 4 && c === 5 ? 160 : 28;
      ctx.fillRect(10 + c * 33, 10 + r * 29, w, 24);
    }
  }
  return canvas;
}

export function notebookTexture() {
  const { canvas, ctx } = makeCanvas(256, 320);
  ctx.fillStyle = "#f1ede2";
  ctx.fillRect(0, 0, 256, 320);
  ctx.strokeStyle = "rgba(60,90,140,0.35)";
  ctx.lineWidth = 2;
  for (let y = 50; y < 320; y += 22) {
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(240, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(30, 230);
  [60, 120, 100, 170, 150, 210].forEach((x, i) => ctx.lineTo(x, 220 - i * 22 + (i % 2) * 18));
  ctx.stroke();
  ctx.font = `italic 400 30px ${SERIF}`;
  ctx.fillStyle = "#1a1a1a";
  ctx.fillText("Q → M → R", 30, 90);
  return canvas;
}

/* The speaker's grille: fine dots. */
export function grilleTexture() {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = "#14181d";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#06080a";
  for (let x = 6; x < 256; x += 10) {
    for (let y = 6; y < 256; y += 10) {
      ctx.beginPath();
      ctx.arc(x + ((y / 10) % 2) * 5, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return canvas;
}

export function glowTexture(colour: string) {
  const { canvas, ctx } = makeCanvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, colour);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return canvas;
}

/* -------------------------------------------------------- live screens */

/* The left monitor: a candlestick chart that keeps trading. */
export class ChartScreen {
  canvas: HTMLCanvasElement;
  map: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;
  private candles: { o: number; c: number; h: number; l: number }[] = [];
  private last = 0;
  private price = 96.14;

  constructor(private symbol: string) {
    const { canvas, ctx } = makeCanvas(640, 400);
    this.canvas = canvas;
    this.ctx = ctx;
    for (let i = 0; i < 40; i += 1) this.step();
    this.map = texture(canvas);
    this.draw();
  }

  private step() {
    const open = this.price;
    const close = Math.max(60, open + (Math.random() - 0.45) * 2.4);
    const high = Math.max(open, close) + Math.random() * 1.2;
    const low = Math.min(open, close) - Math.random() * 1.2;
    this.candles.push({ o: open, c: close, h: high, l: low });
    if (this.candles.length > 40) this.candles.shift();
    this.price = close;
  }

  update(time: number) {
    if (time - this.last < 900) return;
    this.last = time;
    this.step();
    this.draw();
    this.map.needsUpdate = true;
  }

  private draw() {
    const { ctx } = this;
    ctx.fillStyle = "#05080d";
    ctx.fillRect(0, 0, 640, 400);
    ctx.strokeStyle = "rgba(77,155,255,0.1)";
    ctx.lineWidth = 1;
    for (let y = 60; y < 380; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }
    const highs = this.candles.map((c) => c.h);
    const lows = this.candles.map((c) => c.l);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const y = (v: number) => 360 - ((v - min) / (max - min || 1)) * 270;
    this.candles.forEach((c, i) => {
      const x = 20 + i * 15;
      const up = c.c >= c.o;
      ctx.strokeStyle = ctx.fillStyle = up ? GLOW : "#ff6b4a";
      ctx.beginPath();
      ctx.moveTo(x + 5, y(c.h));
      ctx.lineTo(x + 5, y(c.l));
      ctx.stroke();
      ctx.fillRect(x, Math.min(y(c.o), y(c.c)), 10, Math.max(2, Math.abs(y(c.o) - y(c.c))));
    });
    ctx.fillStyle = INK;
    ctx.font = `700 26px ${MONO}`;
    ctx.fillText(this.symbol, 20, 40);
    const lastCandle = this.candles[this.candles.length - 1];
    const up = lastCandle.c >= lastCandle.o;
    ctx.fillStyle = up ? GLOW : "#ff6b4a";
    ctx.textAlign = "right";
    ctx.fillText(`${up ? "▲" : "▼"} ${this.price.toFixed(2)}`, 620, 40);
    ctx.textAlign = "left";
  }
}

/* The right monitor: a terminal printing who Kaustubh is. */
export class TerminalScreen {
  canvas: HTMLCanvasElement;
  map: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;
  private last = 0;
  private on = true;

  constructor(private lines: string[]) {
    const { canvas, ctx } = makeCanvas(640, 400);
    this.canvas = canvas;
    this.ctx = ctx;
    this.map = texture(canvas);
    this.draw();
  }

  update(time: number) {
    if (time - this.last < 530) return;
    this.last = time;
    this.on = !this.on;
    this.draw();
    this.map.needsUpdate = true;
  }

  private draw() {
    const { ctx } = this;
    ctx.fillStyle = "#05070b";
    ctx.fillRect(0, 0, 640, 400);
    ctx.font = `500 21px ${MONO}`;
    let y = 44;
    this.lines.forEach((line) => {
      ctx.fillStyle = line.startsWith(">") ? GLOW : "rgba(236,234,226,0.86)";
      wrap(ctx, line, 590).forEach((part) => {
        ctx.fillText(part, 24, y);
        y += 30;
      });
    });
    if (this.on) {
      ctx.fillStyle = GLOW;
      ctx.fillRect(24, y - 20, 13, 24);
    }
  }
}
