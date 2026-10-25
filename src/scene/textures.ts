/*
 * Everything drawn onto objects in the room: ID cards, book spines, monitor
 * screens, the LED ticker, the skyline outside the window, the certificate,
 * the clock face and so on. All of it is drawn on canvases from the words in
 * content.js, so editing that file updates the room too.
 */
import * as THREE from "three";

export const MONO = '"JetBrains Mono", ui-monospace, monospace';
export const SANS = '"Archivo", "Helvetica Neue", Arial, sans-serif';
export const SERIF = '"Instrument Serif", Georgia, serif';

export const LIME = "#c8f53c";
export const SLATE = "#141a1e";
export const INK = "#eceae2";

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

/* ------------------------------------------------------------- surfaces */

/* Slate wall panels with fine seams. */
export function wallTexture() {
  const { canvas, ctx } = makeCanvas(1024, 1024);
  ctx.fillStyle = "#192025";
  ctx.fillRect(0, 0, 1024, 1024);
  const cols = 2;
  const rows = 3;
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      const x = (c * 1024) / cols;
      const y = (r * 1024) / rows;
      const g = ctx.createLinearGradient(x, y, x + 512, y + 341);
      g.addColorStop(0, "#1f272c");
      g.addColorStop(1, "#182024");
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
  ctx.fillStyle = "#20282d";
  ctx.fillRect(0, 0, 1024, 768);
  ctx.strokeStyle = "#3a4349";
  ctx.lineWidth = 18;
  ctx.strokeRect(40, 40, 944, 688);
  ctx.strokeStyle = LIME;
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
  ctx.fillStyle = "#11161a";
  ctx.fillRect(0, 0, 1024, 480);
  ctx.fillStyle = "#05080a";
  for (let x = 24; x < 1024; x += 28) {
    for (let y = 22; y < 480; y += 28) {
      ctx.beginPath();
      ctx.arc(x, y, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return canvas;
}

/* ----------------------------------------------------------- the window */

/* The night sky over Bengaluru, with stars, a moon and distant towers. */
export function skyTexture() {
  const { canvas, ctx } = makeCanvas(2048, 1024);
  const sky = ctx.createLinearGradient(0, 0, 0, 1024);
  sky.addColorStop(0, "#070b1a");
  sky.addColorStop(0.45, "#1a1840");
  sky.addColorStop(0.72, "#4a2a55");
  sky.addColorStop(0.9, "#a0524a");
  sky.addColorStop(1, "#d9824a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 2048, 1024);
  for (let i = 0; i < 260; i += 1) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.7})`;
    ctx.fillRect(Math.random() * 2048, Math.random() * 520, 2, 2);
  }
  const moon = ctx.createRadialGradient(1500, 190, 10, 1500, 190, 150);
  moon.addColorStop(0, "rgba(255,244,220,1)");
  moon.addColorStop(0.28, "rgba(255,236,200,0.95)");
  moon.addColorStop(0.32, "rgba(255,220,180,0.25)");
  moon.addColorStop(1, "rgba(255,200,160,0)");
  ctx.fillStyle = moon;
  ctx.fillRect(1300, 0, 400, 400);
  // Distant towers.
  let x = 0;
  while (x < 2048) {
    const w = 40 + Math.random() * 90;
    const h = 120 + Math.random() * 260;
    ctx.fillStyle = "#1c1730";
    ctx.fillRect(x, 1024 - h, w, h);
    for (let wy = 1024 - h + 12; wy < 1010; wy += 16) {
      for (let wx = x + 6; wx < x + w - 6; wx += 12) {
        if (Math.random() < 0.22) {
          ctx.fillStyle = Math.random() < 0.8 ? "rgba(255,190,110,0.55)" : "rgba(180,220,255,0.5)";
          ctx.fillRect(wx, wy, 5, 7);
        }
      }
    }
    x += w + Math.random() * 10;
  }
  return canvas;
}

/* Nearer buildings, on a transparent background, so they slide past the sky as the camera moves. */
export function skylineTexture() {
  const { canvas, ctx } = makeCanvas(2048, 1024);
  let x = -20;
  while (x < 2060) {
    const w = 110 + Math.random() * 180;
    const h = 260 + Math.random() * 520;
    const top = 1024 - h;
    ctx.fillStyle = "#0f0d1c";
    ctx.fillRect(x, top, w, h);
    ctx.fillStyle = "#171427";
    ctx.fillRect(x, top, w * 0.18, h);
    if (Math.random() < 0.4) {
      ctx.fillStyle = "#0f0d1c";
      ctx.fillRect(x + w * 0.45, top - 50, 6, 50);
      ctx.fillStyle = "#ff4d4d";
      ctx.beginPath();
      ctx.arc(x + w * 0.45 + 3, top - 52, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let wy = top + 18; wy < 1010; wy += 26) {
      for (let wx = x + 14; wx < x + w - 14; wx += 22) {
        const lit = Math.random();
        if (lit < 0.34) {
          ctx.fillStyle = lit < 0.28 ? "rgba(255,196,120,0.9)" : "rgba(200,240,255,0.85)";
          ctx.fillRect(wx, wy, 11, 14);
        }
      }
    }
    x += w + 8 + Math.random() * 40;
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

/* A neon sign: italic script in glowing lime tube, on a transparent background. */
export function neonTexture(text: string) {
  const { canvas, ctx } = makeCanvas(1400, 300);
  let size = 150;
  ctx.font = `italic 400 ${size}px ${SERIF}`;
  while (ctx.measureText(text).width > 1280 && size > 60) {
    size -= 4;
    ctx.font = `italic 400 ${size}px ${SERIF}`;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(200,245,60,0.9)";
  ctx.lineWidth = 7;
  ctx.shadowColor = "rgba(200,245,60,1)";
  ctx.shadowBlur = 34;
  ctx.strokeText(text, 700, 160);
  ctx.shadowBlur = 12;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(240,255,200,1)";
  ctx.strokeText(text, 700, 160);
  return canvas;
}

/* -------------------------------------------------------------- ticker */

/* The LED ticker above the window: lime letters made of dots, on black. */
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
    ctx.fillStyle = part === "▼" ? "#ff6b4a" : part === "▲" ? "#7dff6b" : LIME;
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

/* ------------------------------------------------------------ ID cards */

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
  ctx.fillStyle = card.reserved ? "#1a2024" : "#f4f2ea";
  ctx.fill();
  if (card.reserved) {
    ctx.setLineDash([18, 14]);
    ctx.strokeStyle = "rgba(236,234,226,0.45)";
    ctx.lineWidth = 6;
    roundRect(ctx, 26, 26, 460, 716, 26);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = LIME;
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
  ctx.fillStyle = "#0a0c0d";
  condensed(ctx, card.org.toUpperCase(), 40, 150, 92, 432);
  // Photo square: the photo from content.js if there is one, otherwise the initials.
  ctx.fillStyle = "#141a1e";
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
    ctx.fillStyle = LIME;
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
  ctx.fillStyle = "#3f6a00";
  ctx.fillText(card.dates.toUpperCase(), 40, 520 + Math.min(3, roleLines.length) * 62 + 6);
  // Barcode.
  ctx.fillStyle = "#0a0c0d";
  let bx = 40;
  while (bx < 470) {
    const bw = 2 + Math.floor(Math.random() * 7);
    ctx.fillRect(bx, 690, bw, 46);
    bx += bw + 2 + Math.floor(Math.random() * 6);
  }
  return canvas;
}

/* --------------------------------------------------------------- books */

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
  ctx.fillText("CERTIFICATE OF COMPLETION", 384, 110);
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
  ctx.fillStyle = "#12171a";
  ctx.fillRect(0, 0, 768, 560);
  ctx.setLineDash([16, 12]);
  ctx.strokeStyle = "rgba(236,234,226,0.35)";
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, 688, 480);
  ctx.setLineDash([]);
  ctx.textAlign = "center";
  ctx.fillStyle = LIME;
  ctx.font = `600 24px ${MONO}`;
  ctx.fillText("● PENDING", 384, 230);
  ctx.fillStyle = "rgba(236,234,226,0.7)";
  ctx.font = `500 26px ${MONO}`;
  wrap(ctx, `Reserved for ${label}`.toUpperCase(), 560).forEach((line, i) => ctx.fillText(line, 384, 290 + i * 38));
  return canvas;
}

/* A small engraved plate or disc label. */
export function plateTexture(top: string, bottom: string, dark = true) {
  const { canvas, ctx } = makeCanvas(512, 256);
  ctx.fillStyle = dark ? "#111416" : "#d8b45a";
  ctx.fillRect(0, 0, 512, 256);
  ctx.textAlign = "center";
  ctx.fillStyle = dark ? "#e9cf7a" : "#3d2c0c";
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
  ctx.fillStyle = "#3f6a00";
  ctx.font = `600 22px ${MONO}`;
  ctx.fillText("IST", 256, 352);
  return canvas;
}

export function phoneScreenTexture(name: string, email: string) {
  const { canvas, ctx } = makeCanvas(360, 720);
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, "#1b2a10");
  g.addColorStop(1, "#0a0c0d");
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
  ctx.fillStyle = LIME;
  ctx.beginPath();
  ctx.arc(180, 590, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0c0d";
  ctx.font = `700 52px ${SANS}`;
  ctx.fillText("✆", 180, 608);
  return canvas;
}

export function businessCardTexture(name: string, line: string, email: string) {
  const { canvas, ctx } = makeCanvas(512, 300);
  ctx.fillStyle = "#0e1214";
  ctx.fillRect(0, 0, 512, 300);
  ctx.fillStyle = LIME;
  ctx.fillRect(0, 0, 14, 300);
  ctx.fillStyle = INK;
  const [first = "", ...rest] = name.split(/\s+/);
  condensed(ctx, first.toUpperCase(), 44, 100, 72, 420);
  condensed(ctx, rest.join(" ").toUpperCase(), 44, 160, 52, 420);
  ctx.font = `italic 400 30px ${SERIF}`;
  ctx.fillStyle = LIME;
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
      ctx.fillStyle = (r === 0 && c === 0) || (r === 4 && c > 4 && c < 10) ? "#c8f53c" : "#2c3338";
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
    ctx.fillStyle = "#06090b";
    ctx.fillRect(0, 0, 640, 400);
    ctx.strokeStyle = "rgba(200,245,60,0.08)";
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
      ctx.strokeStyle = ctx.fillStyle = up ? LIME : "#ff6b4a";
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
    ctx.fillStyle = up ? LIME : "#ff6b4a";
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
    ctx.fillStyle = "#07090a";
    ctx.fillRect(0, 0, 640, 400);
    ctx.font = `500 21px ${MONO}`;
    let y = 44;
    this.lines.forEach((line) => {
      ctx.fillStyle = line.startsWith(">") ? LIME : "rgba(236,234,226,0.86)";
      wrap(ctx, line, 590).forEach((part) => {
        ctx.fillText(part, 24, y);
        y += 30;
      });
    });
    if (this.on) {
      ctx.fillStyle = LIME;
      ctx.fillRect(24, y - 20, 13, 24);
    }
  }
}
