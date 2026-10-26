/*
 * Builds the room: an analyst's office in Bengaluru, with Kaustubh at the
 * desk and an Indie dog asleep on the couch. Everything is made from simple
 * shapes in code (no 3D model files). Every object that opens a section is
 * registered as a "hotspot" with a floating ▲ marker, a camera view and a
 * hover effect. Two hotspots have no marker: the football (a secret section)
 * and the speaker (music, when content.js lists songs).
 *
 * Units are metres. The back wall (with the window) is at z = -3, the left
 * wall (shelves, trophies) at x = -4, and the floor at y = 0.
 */
import * as THREE from "three";
import {
  achievements,
  certifications,
  contact,
  education,
  experience,
  focusAreas,
  music,
  profile,
  reading,
  ticker,
} from "@/content";
import { assetUrl } from "@/router";
import { approach, boxg, glow, mesh, rbox, std, v } from "./kit";
import { buildBook, buildCouch, buildDog, buildFootball, buildPerson, buildSpeaker } from "./props";
import {
  ChartScreen,
  GLOW,
  type Phase,
  SCIENCE,
  TerminalScreen,
  YINMN,
  businessCardTexture,
  certificateTexture,
  clockFaceTexture,
  emptyFrameTexture,
  flagBadgeTexture,
  floorTexture,
  glowTexture,
  idCardTexture,
  keyboardTexture,
  makeCanvas,
  medalTexture,
  neonTexture,
  notebookTexture,
  pegboardTexture,
  phoneScreenTexture,
  plateTexture,
  rugTexture,
  skyTexture,
  skylineTexture,
  spineTexture,
  texture,
  tickerTexture,
  trainTexture,
  wallTexture,
} from "./textures";

export type HotspotId = "about" | "education" | "experience" | "achievements" | "contact" | "easter" | "radio" | "reading";

/* Sections have a ▼ marker; the football is a secret; the speaker plays music; the book on the couch opens About. */
export type HotspotKind = "section" | "secret" | "radio" | "reading";

export type View = { position: THREE.Vector3; target: THREE.Vector3 };

export type Hotspot = {
  id: HotspotId;
  kind: HotspotKind;
  marker: THREE.Group | null;
  /* Where the HTML label sits. */
  anchor: THREE.Vector3;
  hits: THREE.Object3D[];
  view: View | null;
  hover: (on: boolean) => void;
};

export type Room = {
  group: THREE.Group;
  hotspots: Hotspot[];
  tick: (time: number, delta: number) => void;
  setDaylight: (phase: Phase, dogAwake: boolean) => void;
  setPlaying: (on: boolean) => void;
};

/* --------------------------------------------------------------- helpers */

function screen(width: number, height: number, map: THREE.Texture, brightness = 1.25) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map, color: new THREE.Color(1, 1, 1).multiplyScalar(brightness), toneMapped: false }),
  );
}

/* The floating ▼ that marks something you can open. */
function makeMarker() {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  // Pointing down at the object it marks.
  shape.moveTo(0, -0.075);
  shape.lineTo(0.068, 0.045);
  shape.lineTo(-0.068, 0.045);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelSize: 0.007,
    bevelThickness: 0.007,
    bevelSegments: 2,
  });
  geometry.center();
  const arrow = new THREE.Mesh(geometry, glow(GLOW, 3.4));
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture(glowTexture("rgba(77,155,255,0.6)")),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  halo.scale.setScalar(0.55);
  group.add(halo, arrow);
  group.userData.arrow = arrow;
  group.userData.halo = halo;
  return group;
}

const tagHits = (objects: THREE.Object3D[], id: HotspotId) =>
  objects.forEach((object) => object.traverse((child) => (child.userData.hotspot = id)));

/* How the room's own lights change through the day. */
const ROOM_LIGHT: Record<Phase, { lamp: number; bulb: number; train: number; glow: number }> = {
  night: { lamp: 2.6, bulb: 3, train: 0.9, glow: 1 },
  dawn: { lamp: 1.4, bulb: 2.4, train: 0.5, glow: 0.7 },
  day: { lamp: 0.35, bulb: 1.3, train: 0.2, glow: 0.4 },
  dusk: { lamp: 2, bulb: 2.8, train: 0.75, glow: 0.85 },
};

/* ------------------------------------------------------------------ room */

export function buildRoom(options: { still: boolean }): Room {
  const { still } = options;
  const group = new THREE.Group();
  const hotspots: Hotspot[] = [];
  const tickers: ((time: number, delta: number) => void)[] = [];
  const H = 5.6;

  const addSpot = (spot: Omit<Hotspot, "marker"> & { marker?: boolean }) => {
    const marker = spot.marker === false ? null : makeMarker();
    marker?.position.copy(spot.anchor);
    hotspots.push({ ...spot, marker });
  };

  /* ---------------------------------------------------- shell & floor */

  const floorMap = texture(floorTexture(), [3, 3]);
  const floor = mesh(new THREE.PlaneGeometry(9, 8), std("#ffffff", { map: floorMap, roughness: 0.55 }), [0.25, 0, 1], {
    cast: false,
  });
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const wallMap = texture(wallTexture(), [0.36, 0.3]);
  const wallMaterial = std("#ffffff", { map: wallMap, roughness: 0.9 });

  // Back wall, with the window cut out of it.
  const outline = new THREE.Shape();
  outline.moveTo(-4, 0);
  outline.lineTo(4.5, 0);
  outline.lineTo(4.5, H);
  outline.lineTo(-4, H);
  outline.closePath();
  const windowRect = { x0: -2.6, x1: 0.5, y0: 1.0, y1: 2.78 };
  const hole = new THREE.Path();
  hole.moveTo(windowRect.x0, windowRect.y0);
  hole.lineTo(windowRect.x1, windowRect.y0);
  hole.lineTo(windowRect.x1, windowRect.y1);
  hole.lineTo(windowRect.x0, windowRect.y1);
  hole.closePath();
  outline.holes.push(hole);
  const backWall = mesh(new THREE.ExtrudeGeometry(outline, { depth: 0.14, bevelEnabled: false }), wallMaterial, [0, 0, -3.14]);
  group.add(backWall);

  // The side walls cast shadows too, so moonlight and sunlight only come in through the window.
  const leftWall = mesh(new THREE.PlaneGeometry(8, H), wallMaterial, [-4, H / 2, 1]);
  leftWall.rotation.y = Math.PI / 2;
  group.add(leftWall);
  // The right wall closes the room off when you look round towards the plant. It is only
  // drawn from the inside, so it never blocks the view from the camera's usual spot.
  const rightWall = mesh(new THREE.PlaneGeometry(8, H), wallMaterial, [4.5, H / 2, 1]);
  rightWall.rotation.y = -Math.PI / 2;
  group.add(rightWall);
  // An unseen ceiling that only blocks light, so the sun can't shine in over the walls.
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(8.6, 8.2),
    new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0.25, H, 1);
  ceiling.castShadow = true;
  group.add(ceiling);

  const trim = std("#0c1012", { roughness: 0.5 });
  group.add(mesh(boxg(8.5, 0.1, 0.03), trim, [0.25, 0.05, -2.985], { cast: false }));
  const leftTrim = mesh(boxg(8, 0.1, 0.03), trim, [-3.985, 0.05, 1], { cast: false });
  leftTrim.rotation.y = Math.PI / 2;
  const rightTrim = mesh(boxg(8, 0.1, 0.03), trim, [4.485, 0.05, 1], { cast: false });
  rightTrim.rotation.y = Math.PI / 2;
  group.add(leftTrim, rightTrim);

  const rug = mesh(new THREE.PlaneGeometry(3.4, 2.5), std("#ffffff", { map: texture(rugTexture()), roughness: 1 }), [-0.7, 0.006, -1.15], {
    cast: false,
  });
  rug.rotation.x = -Math.PI / 2;
  group.add(rug);

  /* ------------------------------------------------- window & skyline */

  const frame = std("#0b0e10", { roughness: 0.45 });
  const wx = (windowRect.x0 + windowRect.x1) / 2;
  const ww = windowRect.x1 - windowRect.x0;
  const wh = windowRect.y1 - windowRect.y0;
  const wy = (windowRect.y0 + windowRect.y1) / 2;
  group.add(
    mesh(boxg(ww + 0.12, 0.06, 0.2), frame, [wx, windowRect.y1, -3.05]),
    mesh(boxg(ww + 0.2, 0.05, 0.32), frame, [wx, windowRect.y0 - 0.02, -2.97]),
    mesh(boxg(0.06, wh, 0.2), frame, [windowRect.x0, wy, -3.05]),
    mesh(boxg(0.06, wh, 0.2), frame, [windowRect.x1, wy, -3.05]),
    mesh(boxg(0.04, wh, 0.08), frame, [wx, wy, -3.07]),
  );
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(ww, wh),
    new THREE.MeshBasicMaterial({ color: "#a8c4ff", transparent: true, opacity: 0.05, depthWrite: false }),
  );
  glass.position.set(wx, wy, -3.06);
  group.add(glass);

  // The sky and skyline are redrawn for the time of day in Bengaluru (see setDaylight).
  const skyMaterial = new THREE.MeshBasicMaterial({ fog: false, toneMapped: false });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(34, 17), skyMaterial);
  sky.position.set(-1, 1.5, -18);
  const skylineMaterial = new THREE.MeshBasicMaterial({ transparent: true, fog: false, toneMapped: false });
  const skyline = new THREE.Mesh(new THREE.PlaneGeometry(24, 12), skylineMaterial);
  skyline.position.set(-1, -2.6, -10);
  group.add(sky, skyline);

  // Namma Metro's purple line, gliding past now and then.
  const trainMap = texture(trainTexture());
  const trainMaterial = new THREE.MeshStandardMaterial({ map: trainMap, emissive: "#ffffff", emissiveMap: trainMap, emissiveIntensity: 0.9 });
  const train = new THREE.Group();
  for (let i = 0; i < 4; i += 1) {
    const car = new THREE.Mesh(boxg(1.7, 0.42, 0.36), trainMaterial);
    car.position.x = i * 1.78;
    train.add(car);
  }
  train.position.set(-16, 0.32, -6.6);
  const track = mesh(boxg(40, 0.1, 0.5), std("#0d0b16"), [-1, 0.06, -6.6], { cast: false, receive: false });
  group.add(train, track);
  for (let px = -12; px <= 10; px += 5.5) {
    group.add(mesh(boxg(0.3, 6, 0.3), std("#0d0b16"), [px, -3, -6.6], { cast: false, receive: false }));
  }
  let trainClock = 2;
  tickers.push((_, delta) => {
    if (still) return;
    trainClock += delta;
    const cycle = 19;
    const t = trainClock % cycle;
    train.position.x = t < 8 ? -16 + (t / 8) * 30 : -30;
  });

  /* ----------------------------------------------------- LED ticker */

  const tick = tickerTexture(ticker.length ? ticker : [profile.name, profile.focusLine]);
  const tickerMap = texture(tick.canvas);
  tickerMap.wrapS = THREE.RepeatWrapping;
  const tickerWidth = 8.1;
  const tickerHeight = 0.17;
  tickerMap.repeat.x = tickerWidth / (tickerHeight * tick.aspect);
  const tickerBar = new THREE.Mesh(
    new THREE.PlaneGeometry(tickerWidth, tickerHeight),
    new THREE.MeshBasicMaterial({ map: tickerMap, color: new THREE.Color(2.4, 2.4, 2.4), toneMapped: false }),
  );
  tickerBar.position.set(0.25, 3.08, -2.955);
  group.add(mesh(boxg(tickerWidth + 0.12, 0.25, 0.06), std("#050607", { roughness: 0.4 }), [0.25, 3.08, -2.99]), tickerBar);
  tickers.push((_, delta) => {
    if (!still) tickerMap.offset.x = (tickerMap.offset.x + delta * 0.045) % 1;
  });

  // The neon sign above the window. It is drawn crisp and kept below the
  // glow threshold, so the letters stay readable instead of blurring out.
  if (profile.sign) {
    const neon = new THREE.Mesh(
      new THREE.PlaneGeometry(3.3, 3.3 * (360 / 1600)),
      new THREE.MeshBasicMaterial({
        map: texture(neonTexture(profile.sign)),
        transparent: true,
        depthWrite: false,
        color: new THREE.Color(0.95, 0.95, 0.95),
        toneMapped: false,
      }),
    );
    neon.position.set(wx, 3.72, -2.97);
    group.add(neon);
    const neonGlow = new THREE.PointLight(GLOW, 0.8, 3.2, 2);
    neonGlow.position.set(wx, 3.7, -2.5);
    group.add(neonGlow);
  }

  /* ------------------------------------------- desk: about & contact */

  const deskX = -0.85;
  const deskZ = -2.2;
  const walnut = std("#2b1e16", { roughness: 0.5 });
  const carcass = std("#13181b", { roughness: 0.6 });
  const lampMetal = std("#0d1012", { roughness: 0.35, metalness: 0.6 });
  group.add(mesh(rbox(2.7, 0.07, 1.15, 0.03), walnut, [deskX, 0.785, deskZ]));
  // Two drawer pedestals with knee space between them, and a back panel.
  [-1, 1].forEach((side) => {
    const x = deskX + side * 0.975;
    group.add(mesh(rbox(0.6, 0.75, 1.0, 0.04), carcass, [x, 0.375, deskZ]));
    [0.2, 0.55].forEach((y) => {
      group.add(mesh(rbox(0.54, 0.3, 0.02, 0.01), std("#171d21", { roughness: 0.5 }), [x, y, deskZ + 0.505]));
      group.add(mesh(boxg(0.16, 0.014, 0.02), lampMetal, [x, y + 0.09, deskZ + 0.52], { cast: false }));
    });
  });
  group.add(mesh(boxg(1.35, 0.5, 0.03), carcass, [deskX, 0.5, deskZ - 0.46]));
  // Blue glow strips under the desk top.
  const strip = glow(GLOW, 3);
  group.add(
    mesh(boxg(2.56, 0.014, 0.014), strip, [deskX, 0.742, deskZ + 0.505], { cast: false, receive: false }),
    mesh(boxg(0.014, 0.014, 1.0), strip, [deskX - 1.28, 0.742, deskZ], { cast: false, receive: false }),
    mesh(boxg(0.014, 0.014, 1.0), strip, [deskX + 1.28, 0.742, deskZ], { cast: false, receive: false }),
  );

  // Two monitors: a live chart and a terminal.
  const chart = new ChartScreen(`KSI · ${focusAreas[0]?.title.toUpperCase() ?? "FINANCE"}`);
  const terminal = new TerminalScreen([
    "> whoami",
    profile.name,
    "> role",
    profile.role,
    "> focus",
    profile.focusLine,
    "> status",
    experience.find((entry) => !entry.open && "title" in entry) ? "Working · open to conversations" : "Open to opportunities",
  ]);
  const monitors = new THREE.Group();
  const screens: THREE.MeshBasicMaterial[] = [];
  const bezel = std("#0a0d0f", { roughness: 0.35 });
  [
    { x: deskX - 0.46, rot: 0.22, map: chart.map },
    { x: deskX + 0.46, rot: -0.22, map: terminal.map },
  ].forEach(({ x, rot, map }) => {
    const monitor = new THREE.Group();
    monitor.add(mesh(rbox(0.88, 0.53, 0.035, 0.012), bezel, [0, 0, 0]));
    const display = screen(0.84, 0.49, map);
    display.position.z = 0.019;
    screens.push(display.material as THREE.MeshBasicMaterial);
    monitor.add(display);
    monitor.add(mesh(boxg(0.05, 0.3, 0.03), bezel, [0, -0.34, -0.04]));
    monitor.add(mesh(rbox(0.28, 0.016, 0.2, 0.006), bezel, [0, -0.49, -0.02]));
    monitor.position.set(x, 1.31, deskZ - 0.22);
    monitor.rotation.y = rot;
    monitors.add(monitor);
  });
  group.add(monitors);
  tickers.push((time) => {
    if (still) return;
    chart.update(time);
    terminal.update(time);
  });

  const keyboardSpot = v(deskX, 0.843, deskZ + 0.38);
  const keyboardTop = std("#ffffff", { map: texture(keyboardTexture()), roughness: 0.6 });
  const dark = std("#1a1f23", { roughness: 0.5 });
  group.add(
    mesh(boxg(0.48, 0.022, 0.16), [dark, dark, keyboardTop, dark, dark, dark], [deskX, 0.832, deskZ + 0.38]),
    mesh(rbox(0.065, 0.03, 0.105, 0.014), dark, [deskX + 0.4, 0.836, deskZ + 0.4]),
  );

  // Coffee mug, with a little steam.
  const mug = new THREE.Group();
  const mugGlaze = std(SCIENCE, { roughness: 0.35 });
  mug.add(mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 24), mugGlaze, [0, 0, 0]));
  const handle = mesh(new THREE.TorusGeometry(0.028, 0.008, 8, 16), mugGlaze, [0.05, 0, 0]);
  handle.rotation.y = Math.PI / 2;
  mug.add(handle);
  mug.position.set(deskX - 0.82, 0.87, deskZ + 0.32);
  group.add(mug);
  const steamMap = texture(glowTexture("rgba(255,255,255,0.5)"));
  const steam = Array.from({ length: 3 }, (_, i) => {
    const puff = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamMap, transparent: true, depthWrite: false, opacity: 0 }));
    puff.userData.phase = i / 3;
    puff.scale.setScalar(0.08);
    group.add(puff);
    return puff;
  });
  tickers.push((time) => {
    steam.forEach((puff) => {
      if (still) {
        puff.visible = false;
        return;
      }
      const t = (time / 2600 + puff.userData.phase) % 1;
      puff.position.set(mug.position.x + Math.sin(t * 6 + puff.userData.phase * 9) * 0.02, 0.93 + t * 0.28, mug.position.z);
      (puff.material as THREE.SpriteMaterial).opacity = Math.sin(t * Math.PI) * 0.35;
      puff.scale.setScalar(0.06 + t * 0.1);
    });
  });

  const notebook = mesh(
    boxg(0.21, 0.012, 0.28),
    [dark, dark, std("#ffffff", { map: texture(notebookTexture()) }), dark, dark, dark],
    [deskX - 1.1, 0.826, deskZ + 0.15],
  );
  notebook.rotation.y = 0.25;
  group.add(notebook);

  // Desk lamp with a warm light.
  const lamp = new THREE.Group();
  lamp.add(mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.03, 24), lampMetal, [0, 0.015, 0]));
  const arm1 = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.46, 8), lampMetal, [0.05, 0.23, 0]);
  arm1.rotation.z = -0.25;
  const arm2 = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 8), lampMetal, [0.22, 0.47, 0]);
  arm2.rotation.z = 1.05;
  const shade = mesh(new THREE.ConeGeometry(0.1, 0.15, 24, 1, true), std("#101416", { side: THREE.DoubleSide, roughness: 0.4 }), [0.36, 0.48, 0]);
  shade.rotation.z = 0.5;
  const bulbMaterial = glow("#ffcf8a", 3);
  const bulb = mesh(new THREE.SphereGeometry(0.035, 16, 16), bulbMaterial, [0.38, 0.44, 0], { cast: false });
  lamp.add(arm1, arm2, shade, bulb);
  lamp.position.set(deskX - 1.1, 0.82, deskZ - 0.3);
  group.add(lamp);
  const lampLight = new THREE.PointLight("#ffb46a", 2.6, 4, 2);
  lampLight.position.set(deskX - 0.72, 1.18, deskZ - 0.3);
  group.add(lampLight);

  // Phone and business card: the contact hotspot.
  const phone = new THREE.Group();
  phone.add(mesh(rbox(0.09, 0.012, 0.18, 0.006), std("#07090a", { roughness: 0.3 }), [0, 0, 0]));
  const phoneScreen = screen(0.08, 0.16, texture(phoneScreenTexture(profile.name, contact.email)), 1.4);
  phoneScreen.rotation.x = -Math.PI / 2;
  phoneScreen.position.y = 0.007;
  phone.add(phoneScreen);
  phone.position.set(deskX + 0.82, 0.828, deskZ + 0.33);
  phone.rotation.y = -0.4;
  const cardStand = new THREE.Group();
  cardStand.add(mesh(boxg(0.13, 0.025, 0.05), std("#0d1012"), [0, 0, 0]));
  const businessCard = screen(0.12, 0.07, texture(businessCardTexture(profile.name, profile.focusLine, contact.email)), 1);
  businessCard.position.set(0, 0.045, 0.005);
  businessCard.rotation.x = -0.35;
  cardStand.add(businessCard);
  cardStand.position.set(deskX + 1.08, 0.83, deskZ + 0.12);
  cardStand.rotation.y = -0.5;
  group.add(phone, cardStand);

  // The chair, and Kaustubh on it.
  const seatSpot = v(deskX + 0.05, 0, deskZ + 0.8);
  const facing = 0.1;
  const chair = new THREE.Group();
  const chairFabric = std("#1c2430", { roughness: 0.9 });
  chair.add(mesh(rbox(0.52, 0.09, 0.5, 0.04), chairFabric, [0, 0.5, 0]));
  chair.add(mesh(rbox(0.5, 0.62, 0.07, 0.04), chairFabric, [0, 0.9, 0.24]));
  chair.add(mesh(boxg(0.4, 0.02, 0.012), glow(GLOW, 3), [0, 1.0, 0.278], { cast: false }));
  chair.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 12), lampMetal, [0, 0.27, 0]));
  for (let i = 0; i < 5; i += 1) {
    const leg = mesh(boxg(0.3, 0.03, 0.04), lampMetal, [0, 0.06, 0]);
    leg.rotation.y = (i / 5) * Math.PI * 2;
    leg.translateX(0.15);
    chair.add(leg);
  }
  chair.position.copy(seatSpot);
  chair.rotation.y = facing;
  group.add(chair);
  const person = buildPerson({ position: seatSpot, rotationY: facing, keyboard: keyboardSpot });
  group.add(person.group);
  tickers.push((time, delta) => person.tick(time, delta, still));

  const deskGlow = new THREE.PointLight(GLOW, 1.1, 2.4, 2);
  deskGlow.position.set(deskX, 0.3, deskZ + 0.75);
  group.add(deskGlow);

  addSpot({
    id: "about",
    kind: "section",
    anchor: v(deskX, 1.78, deskZ - 0.2),
    hits: [monitors, person.group],
    // Over Kaustubh's shoulder, looking at the screens.
    view: { position: v(deskX + 1.9, 1.75, 0.3), target: v(deskX - 0.15, 1.2, deskZ - 0.15) },
    hover: (on) => {
      screens.forEach((material) => material.color.setScalar(on ? 1.9 : 1.25));
      person.setWatching(on);
    },
  });

  let ringing = 0;
  addSpot({
    id: "contact",
    kind: "section",
    anchor: v(deskX + 0.9, 1.08, deskZ + 0.28),
    hits: [phone, cardStand],
    view: { position: v(deskX + 1.25, 1.28, -1.15), target: v(deskX + 0.92, 0.86, deskZ + 0.24) },
    hover: (on) => {
      ringing = on ? 1 : 0;
      (phoneScreen.material as THREE.MeshBasicMaterial).color.setScalar(on ? 2.2 : 1.4);
    },
  });
  tickers.push((time) => {
    phone.position.x = deskX + 0.82 + (ringing && !still ? Math.sin(time / 22) * 0.004 : 0);
  });

  /* ------------------------------------------- pegboard: experience */

  const board = new THREE.Group();
  const boardW = 2.4;
  const boardH = 1.15;
  const boardCenter = v(2.55, 1.95, -2.95);
  board.add(mesh(boxg(boardW, boardH, 0.04), std("#ffffff", { map: texture(pegboardTexture()), roughness: 0.7 }), [0, 0, 0]));
  // Backlight halo.
  const halo = makeCanvas(512, 256);
  halo.ctx.shadowColor = "rgba(77,155,255,0.95)";
  halo.ctx.shadowBlur = 34;
  halo.ctx.strokeStyle = "rgba(140,190,255,0.8)";
  halo.ctx.lineWidth = 5;
  halo.ctx.strokeRect(46, 40, 420, 176);
  const haloMaterial = new THREE.MeshBasicMaterial({
    map: texture(halo.canvas),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: new THREE.Color(1, 1, 1),
    toneMapped: false,
  });
  const haloPlane = new THREE.Mesh(new THREE.PlaneGeometry(boardW * 1.14, boardH * 1.3), haloMaterial);
  haloPlane.position.z = -0.03;
  board.add(haloPlane);
  board.position.copy(boardCenter);
  group.add(board);

  const lanyardColours = [SCIENCE, "#7b61ff", "#ff7a59", "#3fb6a8", "#e6e1d3"];
  const cards: THREE.Group[] = [];
  const entries = experience.length ? experience : [{ open: true as const, reservedFor: "a first role" }];
  const spacing = Math.min(0.42, (boardW - 0.7) / Math.max(1, entries.length - 1));
  const firstX = -((entries.length - 1) * spacing) / 2 - 0.25;
  entries.forEach((entry, index) => {
    const colour = lanyardColours[index % lanyardColours.length];
    const pivot = new THREE.Group();
    // Each card sits a hair in front of the last, so they can never flicker through each other.
    pivot.position.set(boardCenter.x + firstX + index * spacing, boardCenter.y + 0.42, boardCenter.z + 0.04 + index * 0.003);
    pivot.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 8), lampMetal, [0, 0, 0.02]).rotateX(Math.PI / 2));
    const reserved = Boolean(entry.open);
    const strap = std(reserved ? "#3a4146" : colour, { roughness: 0.8 });
    const left = mesh(boxg(0.022, 0.36, 0.004), strap, [-0.045, -0.17, 0.01]);
    left.rotation.z = -0.13;
    const right = mesh(boxg(0.022, 0.36, 0.004), strap, [0.045, -0.17, 0.01]);
    right.rotation.z = 0.13;
    pivot.add(left, right);
    pivot.add(mesh(boxg(0.05, 0.03, 0.012), lampMetal, [0, -0.36, 0.012]));
    const details = entry.open
      ? { reserved: true, org: "", role: entry.reservedFor, dates: "", color: colour, initials: profile.initials, name: profile.name }
      : {
          reserved: false,
          org: entry.org.split(",")[0],
          role: entry.title,
          dates: entry.dates ?? "",
          color: colour,
          initials: profile.initials,
          name: profile.name,
        };
    const cardMaterial = new THREE.MeshStandardMaterial({
      map: texture(idCardTexture(details)),
      roughness: 0.45,
      transparent: true,
      alphaTest: 0.5,
    });
    // Once the photo from content.js has loaded, print it on the card.
    if (profile.photo && !entry.open) {
      const photo = new Image();
      photo.onload = () => {
        cardMaterial.map?.dispose();
        cardMaterial.map = texture(idCardTexture(details, photo));
        cardMaterial.needsUpdate = true;
      };
      photo.src = assetUrl(profile.photo);
    }
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.39), cardMaterial);
    front.position.set(0, -0.57, 0.016);
    front.castShadow = true;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.255, 0.385), std("#d9d5ca"));
    back.position.set(0, -0.57, 0.013);
    back.rotation.y = Math.PI;
    pivot.add(front, back);
    group.add(pivot);
    cards.push(pivot);
  });

  // Pins on the board: ₹, %, ▲, ∑.
  ["₹", "%", "▲", "∑"].forEach((symbol, i) => {
    const pin = makeCanvas(128, 128);
    pin.ctx.fillStyle = ["#7b61ff", "#ff7a59", GLOW, "#e6e1d3"][i];
    pin.ctx.beginPath();
    pin.ctx.arc(64, 64, 62, 0, Math.PI * 2);
    pin.ctx.fill();
    pin.ctx.fillStyle = "#0a0c0d";
    pin.ctx.font = '800 70px "Archivo", sans-serif';
    pin.ctx.textAlign = "center";
    pin.ctx.textBaseline = "middle";
    pin.ctx.fillText(symbol, 64, 70);
    const badge = new THREE.Group();
    badge.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 24), std("#222"), [0, 0, 0]).rotateX(Math.PI / 2));
    const pinFace = new THREE.Mesh(new THREE.CircleGeometry(0.044, 24), std("#ffffff", { map: texture(pin.canvas) }));
    pinFace.position.z = 0.0065;
    badge.add(pinFace);
    badge.position.set(boardCenter.x + 0.78 + (i % 2) * 0.16, boardCenter.y + 0.25 - Math.floor(i / 2) * 0.2, boardCenter.z + 0.03);
    group.add(badge);
  });

  // A round Indian flag badge below the pins.
  const flagBadge = new THREE.Group();
  flagBadge.add(mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.012, 40), std("#d8d4c8", { metalness: 0.5, roughness: 0.35 }), [0, 0, 0]).rotateX(Math.PI / 2));
  const flagFace = new THREE.Mesh(new THREE.CircleGeometry(0.058, 40), std("#ffffff", { map: texture(flagBadgeTexture()), roughness: 0.5 }));
  flagFace.position.z = 0.0065;
  flagBadge.add(flagFace);
  flagBadge.position.set(boardCenter.x + 0.86, boardCenter.y - 0.2, boardCenter.z + 0.035);
  flagBadge.rotation.z = -0.08;
  group.add(flagBadge);

  const boardLight = new THREE.PointLight(GLOW, 0.45, 2.2, 2);
  boardLight.position.set(boardCenter.x, boardCenter.y, boardCenter.z + 0.6);
  group.add(boardLight);

  // Pointing at the board sets the cards swaying together, gently, like a breeze;
  // they move as one, so they never knock into each other.
  let sway = 0;
  let swayGoal = 0;
  addSpot({
    id: "experience",
    kind: "section",
    anchor: v(boardCenter.x, boardCenter.y + 0.8, boardCenter.z + 0.2),
    hits: [board, ...cards],
    view: { position: v(boardCenter.x + 0.07, 1.85, -0.05), target: v(boardCenter.x + 0.07, 1.82, boardCenter.z) },
    hover: (on) => {
      haloMaterial.color.setScalar(on ? 1.6 : 1);
      swayGoal = on ? 1 : 0;
    },
  });
  tickers.push((time, delta) => {
    if (still) {
      cards.forEach((pivot) => (pivot.rotation.z = 0));
      return;
    }
    sway = approach(sway, swayGoal, 2.5, delta);
    const t = time / 1000;
    cards.forEach((pivot, i) => {
      pivot.rotation.z = Math.sin(t * 0.8 + i * 0.4) * (0.012 + sway * 0.03);
    });
  });

  /* ---------------------------------------------- shelves: education */

  const shelves = new THREE.Group();
  const shelfX = -3.84;
  const shelfZ = -1.45;
  const shelfWood = std("#2b1e16", { roughness: 0.55 });
  const shelfYs = [1.45, 1.9, 2.35];
  shelfYs.forEach((y) => {
    shelves.add(mesh(boxg(0.32, 0.04, 1.9), shelfWood, [shelfX, y, shelfZ]));
    shelves.add(mesh(boxg(0.012, 0.01, 1.84), glow("#ffd9a0", 1.1), [shelfX + 0.15, y - 0.026, shelfZ], { cast: false }));
  });
  const courses = education.find((row) => row.courses?.items.length)?.courses?.items ?? [];
  const bookColours = [SCIENCE, "#7b61ff", "#ff7a59", "#3fb6a8", "#e6e1d3", "#f2c14e", YINMN];
  const lightCovers = new Set(["#e6e1d3", "#f2c14e", "#3fb6a8"]);
  const pageMaterial = std("#efe9da");
  const courseBooks: THREE.Mesh[] = [];
  const placeBooks = (y: number, titles: string[], startZ: number, labelled: boolean) => {
    let z = startZ;
    titles.forEach((title, i) => {
      const colour = bookColours[(i + (labelled ? 0 : 3)) % bookColours.length];
      const thickness = 0.05 + ((i * 37) % 3) * 0.01;
      const height = 0.27 + ((i * 53) % 4) * 0.018;
      const cover = std(colour, { roughness: 0.6 });
      const spine = std("#ffffff", { map: texture(spineTexture(title, colour, lightCovers.has(colour))), roughness: 0.6 });
      const book = mesh(boxg(0.2, height, thickness), [spine, cover, pageMaterial, pageMaterial, cover, cover], [shelfX + 0.02, y + 0.02 + height / 2, z]);
      if (!labelled && i % 4 === 3) book.rotation.x = 0.12;
      shelves.add(book);
      if (labelled) courseBooks.push(book);
      z += thickness + 0.006;
    });
  };
  placeBooks(shelfYs[0], courses.length ? courses : ["Coursework"], shelfZ - 0.88, true);
  placeBooks(shelfYs[1], ["", "", "", "", ""], shelfZ - 0.86, false);
  // A graduation cap and a small plant on the middle shelf.
  const cap = new THREE.Group();
  const capMaterial = std("#0b0d0e", { roughness: 0.6 });
  cap.add(mesh(boxg(0.24, 0.012, 0.24), capMaterial, [0, 0.07, 0]).rotateY(Math.PI / 4));
  cap.add(mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.06, 20), capMaterial, [0, 0.035, 0]));
  cap.add(mesh(boxg(0.008, 0.11, 0.008), glow(GLOW, 3), [0.08, 0.02, 0.08], { cast: false }));
  cap.position.set(shelfX + 0.02, shelfYs[1] + 0.02, shelfZ + 0.35);
  shelves.add(cap);
  const leaves = std("#2f5d3a", { roughness: 0.8 });
  const sprig = new THREE.Group();
  sprig.add(mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 16), std("#e6e1d3"), [0, 0.05, 0]));
  for (let i = 0; i < 6; i += 1) {
    const leaf = mesh(new THREE.SphereGeometry(0.05, 10, 8), leaves, [Math.cos(i) * 0.04, 0.14 + (i % 3) * 0.03, Math.sin(i) * 0.04]);
    leaf.scale.set(0.5, 1.4, 0.5);
    leaf.rotation.z = Math.cos(i * 2) * 0.6;
    sprig.add(leaf);
  }
  sprig.position.set(shelfX + 0.02, shelfYs[1] + 0.02, shelfZ + 0.72);
  shelves.add(sprig);
  // Books lying flat on the top shelf.
  for (let i = 0; i < 4; i += 1) {
    shelves.add(
      mesh(boxg(0.22, 0.045, 0.3 - i * 0.02), std(bookColours[(i + 2) % bookColours.length]), [shelfX + 0.02, shelfYs[2] + 0.045 + i * 0.046, shelfZ - 0.5]).rotateY(i * 0.08),
    );
  }
  group.add(shelves);
  const shelfLight = new THREE.PointLight("#ffd9a0", 0.6, 2.2, 2);
  shelfLight.position.set(shelfX + 0.5, 1.9, shelfZ);
  group.add(shelfLight);

  let pulled = 0;
  addSpot({
    id: "education",
    kind: "section",
    anchor: v(shelfX + 0.15, 2.72, shelfZ),
    hits: [shelves],
    view: { position: v(-0.65, 1.95, shelfZ), target: v(shelfX, 1.88, shelfZ) },
    hover: (on) => {
      pulled = on ? 1 : 0;
    },
  });
  tickers.push((time) => {
    courseBooks.forEach((book, i) => {
      const target = shelfX + 0.02 + (pulled && !still ? Math.max(0, Math.sin(time / 260 - i * 0.5)) * 0.05 : 0);
      book.position.x += (target - book.position.x) * 0.15;
    });
  });

  /* ----------------------------------- trophy shelf: achievements */

  const trophies = new THREE.Group();
  const cabinetZ = 0.95;
  trophies.add(mesh(rbox(0.5, 0.7, 1.9, 0.03), std("#11161a", { roughness: 0.55 }), [-3.75, 0.35, cabinetZ]));
  trophies.add(mesh(boxg(0.012, 0.012, 1.7), glow(GLOW, 2.6), [-3.495, 0.55, cabinetZ], { cast: false }));
  const gold = new THREE.MeshStandardMaterial({ color: "#e2b85a", metalness: 1, roughness: 0.28 });
  const silver = new THREE.MeshStandardMaterial({ color: "#d0d4d8", metalness: 1, roughness: 0.3 });

  const featured = achievements.find(
    (entry): entry is Exclude<typeof entry, { open: true }> => !entry.open && Boolean(entry.figure),
  );
  const cupProfile = [
    [0.0, 0.0],
    [0.07, 0.0],
    [0.07, 0.02],
    [0.025, 0.04],
    [0.02, 0.12],
    [0.05, 0.15],
    [0.1, 0.22],
    [0.11, 0.33],
    [0.1, 0.33],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const cup = new THREE.Group();
  cup.add(mesh(boxg(0.17, 0.08, 0.17), std("#0b0d0e"), [0, 0.04, 0]));
  const plateMap = texture(plateTexture(featured?.figure ?? "★", featured?.note ?? "top result"));
  cup.add(mesh(new THREE.PlaneGeometry(0.15, 0.07), std("#ffffff", { map: plateMap }), [0.0861, 0.04, 0]).rotateY(Math.PI / 2));
  const bowl = mesh(new THREE.LatheGeometry(cupProfile, 32), gold, [0, 0.08, 0]);
  cup.add(bowl);
  [-1, 1].forEach((side) => {
    const handleRing = mesh(new THREE.TorusGeometry(0.045, 0.01, 8, 20, Math.PI), gold, [0, 0.33, side * 0.105]);
    handleRing.rotation.set(0, Math.PI / 2, side > 0 ? -Math.PI / 2 : Math.PI / 2);
    cup.add(handleRing);
  });
  cup.position.set(-3.72, 0.7, cabinetZ - 0.55);
  trophies.add(cup);

  // Medals on little stands, one for each other achievement; empty stand for reserved ones.
  const others = achievements.filter((entry) => entry !== featured);
  others.slice(0, 3).forEach((entry, i) => {
    const stand = new THREE.Group();
    stand.add(mesh(boxg(0.1, 0.02, 0.12), std("#0b0d0e"), [0, 0.01, 0]));
    stand.add(mesh(boxg(0.012, 0.28, 0.012), std("#0b0d0e"), [-0.02, 0.15, 0]).rotateZ(-0.15));
    if (!entry.open) {
      const label = (entry.context ?? entry.title).replace(/Indian Institute of Management\s*/i, "IIM ").replace(/^IIM\s+(\w)\w*/i, "IIM-$1");
      // The disc's face is drawn mirrored, so flip the label back.
      const medalMap = texture(medalTexture(label, i % 2 ? "#c9ced4" : "#d9b45a"));
      medalMap.wrapS = THREE.RepeatWrapping;
      medalMap.repeat.x = -1;
      const disc = mesh(
        new THREE.CylinderGeometry(0.065, 0.065, 0.012, 32),
        [i % 2 ? silver : gold, std("#ffffff", { map: medalMap, metalness: 0.6, roughness: 0.35 }), gold],
        [0.01, 0.12, 0],
      );
      disc.rotation.z = -Math.PI / 2;
      stand.add(disc);
      const ribbon = std(i % 2 ? "#7b61ff" : SCIENCE);
      stand.add(mesh(boxg(0.006, 0.16, 0.03), ribbon, [0.0, 0.25, -0.025]).rotateX(0.25));
      stand.add(mesh(boxg(0.006, 0.16, 0.03), ribbon, [0.0, 0.25, 0.025]).rotateX(-0.25));
    } else {
      const placeholder = mesh(new THREE.TorusGeometry(0.06, 0.006, 8, 32), std("#4a5258"), [0.01, 0.12, 0]);
      placeholder.rotation.y = Math.PI / 2;
      stand.add(placeholder);
    }
    stand.position.set(-3.72, 0.7, cabinetZ + 0.05 + i * 0.32);
    trophies.add(stand);
  });

  // Framed certificates on the wall above (up to three).
  const frames = new THREE.Group();
  const frameMaterial = std("#0b0d0e", { roughness: 0.4 });
  const frameItems = certifications.slice(0, 3);
  frameItems.forEach((entry, i) => {
    const map = texture(
      entry.open ? emptyFrameTexture(entry.reservedFor) : certificateTexture(entry.title, entry.issuer ?? ""),
    );
    const framed = new THREE.Group();
    framed.add(mesh(boxg(0.035, 0.5, 0.66), frameMaterial, [0, 0, 0]));
    const art = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.44), std("#ffffff", { map, roughness: 0.6 }));
    art.position.x = 0.019;
    art.rotation.y = Math.PI / 2;
    framed.add(art);
    // Seen from the room the wall runs right to left, so the first certificate goes on the left.
    framed.position.set(-3.98, 1.62, cabinetZ - (i - (frameItems.length - 1) / 2) * 0.76);
    frames.add(framed);
  });
  group.add(trophies, frames);

  const pictureLight = new THREE.PointLight("#ffe2b0", 0.5, 2, 2);
  pictureLight.position.set(-3.4, 2.1, cabinetZ);
  group.add(pictureLight);

  let spin = 0;
  addSpot({
    id: "achievements",
    kind: "section",
    anchor: v(-3.65, 2.15, cabinetZ),
    hits: [trophies, frames],
    view: { position: v(-0.45, 1.45, cabinetZ), target: v(-3.9, 1.3, cabinetZ) },
    hover: (on) => {
      spin = on ? 1 : 0;
    },
  });
  tickers.push((_, delta) => {
    if (spin && !still) bowl.rotation.y += delta * 2.4;
  });

  /* ------------------------------------------------------- the clock */

  const clock = new THREE.Group();
  clock.add(mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.04, 48), std("#0b0d0e"), [0, 0, 0]).rotateX(Math.PI / 2));
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.19, 48), std("#ffffff", { map: texture(clockFaceTexture()) }));
  face.position.z = 0.021;
  clock.add(face);
  const hand = (length: number, width: number, material: THREE.Material, z: number) => {
    const pivot = new THREE.Group();
    const bar = mesh(boxg(width, length, 0.004), material, [0, length / 2 - 0.02, 0], { cast: false });
    pivot.add(bar);
    pivot.position.z = z;
    clock.add(pivot);
    return pivot;
  };
  const hourHand = hand(0.1, 0.012, std("#0a0c0d"), 0.025);
  const minuteHand = hand(0.15, 0.008, std("#0a0c0d"), 0.028);
  const secondHand = hand(0.16, 0.003, std(SCIENCE), 0.031);
  clock.position.set(-3.97, 2.55, cabinetZ);
  clock.rotation.y = Math.PI / 2;
  group.add(clock);
  const istParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  let lastSecond = -1;
  tickers.push(() => {
    const now = new Date();
    if (now.getSeconds() === lastSecond) return;
    lastSecond = now.getSeconds();
    const [h, m, s] = istParts.format(now).split(":").map(Number);
    secondHand.rotation.z = -(s / 60) * Math.PI * 2;
    minuteHand.rotation.z = -((m + s / 60) / 60) * Math.PI * 2;
    hourHand.rotation.z = -(((h % 12) + m / 60) / 12) * Math.PI * 2;
  });

  /* ------------------------------------------------------ furnishing */

  // A tall plant in the far corner.
  const plant = new THREE.Group();
  plant.add(mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.46, 24), std("#20272b", { roughness: 0.6 }), [0, 0.23, 0]));
  for (let i = 0; i < 14; i += 1) {
    const leaf = mesh(new THREE.SphereGeometry(0.16, 12, 10), leaves, [0, 0, 0]);
    leaf.scale.set(0.35, 1.5, 0.12);
    const angle = (i / 14) * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * 0.18, 0.75 + (i % 4) * 0.13, Math.sin(angle) * 0.18);
    leaf.rotation.set(Math.sin(angle) * 0.6, -angle, Math.cos(angle) * 0.6);
    plant.add(leaf);
  }
  plant.position.set(4.05, 0, -2.55);
  group.add(plant);

  // The couch, with the dog on it.
  const couch = buildCouch();
  couch.group.position.set(2.75, 0, -0.45);
  couch.group.rotation.y = 0.25;
  group.add(couch.group);
  const dog = buildDog();
  dog.group.position.copy(couch.seat);
  couch.group.add(dog.group);
  tickers.push((time, delta) => dog.tick(time, delta, still));

  // The book being read, on the couch beside the dog.
  if (reading.title) {
    const book = buildBook(reading.title, reading.author);
    book.group.position.set(0.3, 0.432, 0.2);
    book.group.rotation.y = 0.45;
    couch.group.add(book.group);
    tickers.push((time, delta) => book.tick(time, delta, still));
    couch.group.updateMatrixWorld(true);
    addSpot({
      id: "reading",
      kind: "reading",
      marker: false,
      anchor: book.group.localToWorld(v(0, 0.05, 0)),
      hits: [book.group],
      view: null,
      hover: book.setHover,
    });
  }

  // The speaker beside the couch.
  const speaker = buildSpeaker();
  speaker.group.position.set(1.3, 0, -1.3);
  speaker.group.rotation.y = 0.6;
  group.add(speaker.group);
  tickers.push((time, delta) => speaker.tick(time, delta, still));
  if (music.songs.length) {
    addSpot({
      id: "radio",
      kind: "radio",
      marker: false,
      anchor: v(1.3, 1.0, -1.3),
      hits: [speaker.group],
      view: null,
      hover: speaker.setHover,
    });
  }

  // The football on the floor in front of the couch: the secret section.
  const football = buildFootball();
  football.group.position.set(1.5, 0, -0.3);
  group.add(football.group);
  tickers.push((time, delta) => football.tick(time, delta, still));
  addSpot({
    id: "easter",
    kind: "secret",
    marker: false,
    anchor: v(1.5, 0.12, -0.3),
    hits: [football.group],
    view: { position: v(0.55, 1.25, 1.75), target: v(2.2, 0.42, -0.55) },
    hover: football.setHover,
  });

  /* ------------------------------------------------- time of day */

  let shownPhase: Phase | null = null;
  const setDaylight = (phase: Phase, dogAwake: boolean) => {
    dog.setAwake(dogAwake);
    if (phase === shownPhase) return;
    shownPhase = phase;
    skyMaterial.map?.dispose();
    skyMaterial.map = texture(skyTexture(phase));
    skyMaterial.needsUpdate = true;
    skylineMaterial.map?.dispose();
    skylineMaterial.map = texture(skylineTexture(phase));
    skylineMaterial.needsUpdate = true;
    const light = ROOM_LIGHT[phase];
    lampLight.intensity = light.lamp;
    bulbMaterial.color.set("#ffcf8a").multiplyScalar(light.bulb);
    trainMaterial.emissiveIntensity = light.train;
    deskGlow.intensity = 1.1 * light.glow;
    boardLight.intensity = 0.45 * light.glow;
  };

  /* ---------------------------------------------------------- tick */

  hotspots.forEach((spot) => tagHits(spot.hits, spot.id));

  return {
    group,
    hotspots,
    tick: (time, delta) => tickers.forEach((fn) => fn(time, delta)),
    setDaylight,
    setPlaying: speaker.setPlaying,
  };
}
