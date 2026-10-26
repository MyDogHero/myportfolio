/*
 * The living parts of the room: Kaustubh at the desk, the couch with the
 * sleeping Indie dog, the speaker and the football. Each is built from
 * simple shapes and has a `tick` that animates it.
 */
import * as THREE from "three";
import {
  GLOW,
  bookBackTexture,
  bookCoverTexture,
  bookPageTexture,
  fabricTexture,
  grilleTexture,
  texture,
  zTexture,
} from "./textures";
import { approach, blob, boxg, cushionGeometry, glow, limb, mesh, poseLimb, rbox, smooth, solveElbow, std, v } from "./kit";

type Tick = (time: number, delta: number, still: boolean) => void;

/* ---------------------------------------------------------------- person */

/* A rounded-rectangle glasses frame (an outline with a hole). */
function frameGeometry(width: number, height: number, rim: number, radius: number) {
  const rounded = (w: number, h: number, r: number) => {
    const shape = new THREE.Path();
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return shape;
  };
  const outer = new THREE.Shape(rounded(width, height, radius).getPoints(6));
  outer.holes.push(rounded(width - rim * 2, height - rim * 2, Math.max(0.002, radius - rim)));
  const geometry = new THREE.ExtrudeGeometry(outer, { depth: 0.004, bevelEnabled: false });
  geometry.center();
  return geometry;
}

/* Where he holds a book to read it, in his own frame (he faces -z): in front of his chest, tipped towards his face. */
export const BOOK_HOLD = { position: v(0, 1.0, -0.31), tilt: -0.35 };

/*
 * Kaustubh, typing at the desk: dark brown skin, a mustache, black
 * rounded-rectangle glasses and side-parted, medium-long hair. Now and then
 * he glances round; pointing at him makes him look your way. `setReading`
 * (0 to 1) moves his hands from the keyboard to hold a book and tips his head
 * down to read. `keys` is the keyboard's position in his own frame.
 */
export function buildPerson(options: { keys: THREE.Vector3 }) {
  const group = new THREE.Group();

  const skin = std("#8a5a3a", { roughness: 0.62 });
  const hair = std("#140e0a", { roughness: 0.55 });
  const shirt = std("#6B8EAD", { roughness: 0.85 });
  const trousers = std("#1f2733", { roughness: 0.8 });
  const shoes = std("#0c0e11", { roughness: 0.45 });
  const frames = std("#08090a", { roughness: 0.3, metalness: 0.3 });

  // Legs, bent at the knee under the desk.
  group.add(mesh(rbox(0.34, 0.15, 0.3, 0.06), trousers, [0, 0.62, 0.03]));
  [-1, 1].forEach((side) => {
    const x = side * 0.097;
    group.add(limb(v(x, 0.61, 0.02), v(x, 0.6, -0.36), 0.068, trousers));
    group.add(limb(v(x, 0.6, -0.37), v(x, 0.1, -0.42), 0.056, trousers));
    group.add(mesh(rbox(0.105, 0.08, 0.22, 0.03), shoes, [x, 0.045, -0.47]));
  });

  // Torso, leaning slightly towards the screens.
  const torso = new THREE.Group();
  torso.position.set(0, 0.66, 0.04);
  torso.rotation.x = -0.1;
  torso.add(mesh(rbox(0.37, 0.44, 0.22, 0.085), shirt, [0, 0.24, 0]));
  torso.add(mesh(boxg(0.012, 0.36, 0.006), std("#86a2c8"), [0, 0.25, -0.111], { cast: false }));
  torso.add(mesh(new THREE.CylinderGeometry(0.046, 0.05, 0.1, 16), skin, [0, 0.5, -0.01]));
  group.add(torso);

  // Head.
  const head = new THREE.Group();
  head.position.set(0, 0.64, -0.02);
  torso.add(head);
  head.add(blob(0.105, [0.92, 1.1, 1.0], skin, [0, 0, 0], 32));
  head.add(blob(0.07, [1.05, 0.8, 1.0], skin, [0, -0.058, -0.025]));
  [-1, 1].forEach((side) => {
    head.add(blob(0.026, [0.45, 1, 0.75], skin, [side * 0.098, -0.005, 0.005], 12));
    head.add(blob(0.011, [1, 1, 1], std("#120c08", { roughness: 0.2 }), [side * 0.036, 0.017, -0.095], 10));
    const brow = mesh(rbox(0.036, 0.008, 0.012, 0.004), hair, [side * 0.037, 0.045, -0.098]);
    brow.rotation.z = side * -0.08;
    head.add(brow);
    // The mustache: two thick strokes, drooping a little at the ends.
    head.add(limb(v(side * 0.004, -0.041, -0.104), v(side * 0.043, -0.053, -0.093), 0.0105, hair));
    // Glasses: rounded-rectangle frames, the bridge and the arms.
    const lens = new THREE.Mesh(frameGeometry(0.047, 0.033, 0.0045, 0.011), frames);
    lens.position.set(side * 0.037, 0.016, -0.113);
    lens.rotation.y = side * -0.12;
    head.add(lens);
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.039, 0.025),
      new THREE.MeshBasicMaterial({ color: "#a8ccff", transparent: true, opacity: 0.12, depthWrite: false }),
    );
    glass.position.set(side * 0.037, 0.016, -0.112);
    glass.rotation.y = side * -0.12;
    head.add(glass);
    head.add(mesh(boxg(0.004, 0.004, 0.105), frames, [side * 0.07, 0.02, -0.062], { cast: false }));
    // Hair over the ears.
    head.add(blob(0.05, [0.42, 1.05, 1.15], hair, [side * 0.1, 0.012, 0.02]));
  });
  head.add(blob(0.02, [0.8, 1, 1.3], skin, [0, -0.012, -0.105], 12));
  head.add(mesh(rbox(0.024, 0.004, 0.004, 0.002), std("#3a1f15"), [0, -0.064, -0.099], { cast: false }));
  head.add(mesh(rbox(0.016, 0.005, 0.004, 0.002), frames, [0, 0.022, -0.116], { cast: false }));
  // Hair: a cap tipped back to show the forehead, a side-parted fringe, and length at the back.
  const cap = mesh(new THREE.SphereGeometry(0.112, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.56), hair, [0, 0.014, 0.008]);
  cap.scale.set(0.96, 1.1, 1.05);
  cap.rotation.x = 0.36;
  head.add(cap);
  const fringe = blob(0.07, [1.45, 0.42, 0.95], hair, [0.018, 0.08, -0.058]);
  fringe.rotation.set(0.22, 0, -0.24);
  head.add(fringe);
  const back = mesh(rbox(0.19, 0.12, 0.07, 0.03), hair, [0, -0.045, 0.074]);
  back.rotation.x = 0.15;
  head.add(back);

  // Arms: an upper arm and a forearm each, posed every frame so the hands can
  // move between the keyboard and a book. The elbow is worked out from where
  // the hand is (the arm lengths never change).
  const arms = [-1, 1].map((side) => {
    const shoulder = v(side * 0.2, 1.075, 0);
    const elbow = v(side * 0.235, 0.86, -0.13);
    const typing = options.keys.clone().add(v(side * 0.09, 0.025, 0.02));
    // Holding the book by its outer edges.
    const holding = v(side * 0.125, BOOK_HOLD.position.y - 0.02, BOOK_HOLD.position.z + 0.06);
    const toTyping = typing.clone().sub(shoulder).normalize();
    const typingPole = elbow.clone().sub(shoulder);
    typingPole.addScaledVector(toTyping, -typingPole.dot(toTyping)).normalize();
    const upper = limb(shoulder, elbow, 0.048, shirt);
    const fore = limb(elbow, typing, 0.041, shirt);
    const palm = blob(0.037, [1, 0.6, 1.25], skin, [typing.x, typing.y, typing.z], 14);
    group.add(upper, fore, palm);
    return {
      side,
      shoulder,
      typing,
      holding,
      typingPole,
      holdingPole: v(side * 0.7, -1, 0.15).normalize(),
      upperLength: shoulder.distanceTo(elbow),
      foreLength: elbow.distanceTo(typing),
      upper,
      fore,
      palm,
    };
  });
  const target = new THREE.Vector3();
  const pole = new THREE.Vector3();
  const elbowAt = new THREE.Vector3();
  const handAt = new THREE.Vector3();

  let watching = false;
  let reading = 0;
  let nextGlance = 4 + Math.random() * 6;
  let glanceUntil = 0;
  let turn = 0;
  const tick: Tick = (time, delta, still) => {
    const t = time / 1000;
    const hold = smooth(0.15, 0.85, reading);
    arms.forEach((arm, i) => {
      const tap = still ? 0 : Math.max(0, Math.sin(t * 13 + i * 2.1)) * 0.009 * (1 - hold);
      target.copy(arm.typing).setY(arm.typing.y + tap).lerp(arm.holding, hold);
      pole.copy(arm.typingPole).lerp(arm.holdingPole, hold).normalize();
      solveElbow(arm.shoulder, target, arm.upperLength, arm.foreLength, pole, elbowAt, handAt);
      poseLimb(arm.upper, arm.shoulder, elbowAt);
      poseLimb(arm.fore, elbowAt, handAt);
      arm.palm.position.copy(handAt);
    });
    if (!still) {
      torso.scale.y = 1 + Math.sin(t * 1.6) * 0.006;
      if (t > nextGlance) {
        glanceUntil = t + 1.8;
        nextGlance = t + 9 + Math.random() * 8;
      }
    }
    const looking = (watching || t < glanceUntil) && reading === 0;
    turn = approach(turn, looking && !still ? -1.05 : 0, 5, delta);
    head.rotation.y = turn;
    const idle = looking ? -0.05 : 0.09 + (still ? 0 : Math.sin(t * 0.8) * 0.02);
    // Reading: eyes down on the page.
    head.rotation.x = idle + (-0.3 - idle) * hold;
  };

  return {
    group,
    tick,
    setWatching: (on: boolean) => {
      watching = on;
    },
    setReading: (amount: number) => {
      reading = amount;
    },
  };
}

/* ------------------------------------------------------------ couch, dog */

/* A deep blue couch, facing into the room. */
export function buildCouch() {
  const group = new THREE.Group();
  const fabric = std("#ffffff", { map: texture(fabricTexture("#2b3e66"), [2, 2]), roughness: 0.95 });
  const wood = std("#1b130e", { roughness: 0.5 });
  group.add(mesh(rbox(1.95, 0.24, 0.9, 0.05), fabric, [0, 0.17, 0]));
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => group.add(mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.08, 10), wood, [sx * 0.88, 0.04, sz * 0.38]))),
  );
  group.add(mesh(rbox(1.95, 0.5, 0.16, 0.05), fabric, [0, 0.5, -0.38]));
  [-1, 1].forEach((side) => {
    group.add(mesh(rbox(0.86, 0.15, 0.66, 0.06), fabric, [side * 0.44, 0.355, 0.08]));
    const cushion = mesh(rbox(0.86, 0.42, 0.18, 0.07), fabric, [side * 0.44, 0.62, -0.28]);
    cushion.rotation.x = -0.12;
    group.add(cushion);
    group.add(mesh(rbox(0.18, 0.42, 0.9, 0.06), fabric, [side * 0.9, 0.4, 0]));
  });
  // Two soft cushions leaning against the back: an off-white one and a blue one.
  const pillow = mesh(cushionGeometry(0.4, 0.38, 0.16), std("#cfc6b2", { roughness: 0.95 }), [0.6, 0.6, -0.15]);
  pillow.rotation.set(-0.32, 0, 0.16);
  group.add(pillow);
  const bolster = mesh(cushionGeometry(0.34, 0.32, 0.14), std("#5672a8", { roughness: 0.95 }), [-0.78, 0.57, -0.16]);
  bolster.rotation.set(-0.3, 0, -0.12);
  group.add(bolster);
  return { group, seat: v(-0.44, 0.43, 0.1) };
}

/*
 * A cream Indian pariah dog. Asleep at night, curled up with purple zZ
 * floating from his nose; awake by day, head up, ears pricked, tail wagging.
 */
export function buildDog() {
  const group = new THREE.Group();
  const coat = std("#dfc79c", { roughness: 0.92 });
  const shade = std("#c8aa78", { roughness: 0.92 });
  const dark = std("#22170f", { roughness: 0.3 });

  group.add(blob(0.17, [1.35, 0.62, 0.85], coat, [0, 0.1, 0]));
  group.add(blob(0.1, [1, 0.8, 0.9], shade, [-0.13, 0.085, 0.078]));
  group.add(limb(v(-0.07, 0.03, 0.125), v(0.05, 0.025, 0.13), 0.028, coat));
  group.add(blob(0.095, [1, 0.9, 0.95], coat, [0.17, 0.11, 0]));
  [-1, 1].forEach((side) => {
    group.add(limb(v(0.12, 0.04, side * 0.05), v(0.31, 0.03, side * 0.045), 0.03, coat));
    group.add(blob(0.034, [1.3, 0.7, 1], coat, [0.33, 0.025, side * 0.045], 12));
  });

  // The head pivots so it can rest on the paws or lift up.
  const head = new THREE.Group();
  group.add(head);
  head.add(blob(0.075, [1.1, 0.85, 0.85], coat, [0, 0, 0]));
  head.add(limb(v(0.04, -0.012, 0), v(0.12, -0.026, 0), 0.032, coat));
  head.add(blob(0.017, [1, 0.85, 1.1], dark, [0.152, -0.022, 0], 12));
  const ears = [-1, 1].map((side) => {
    const ear = mesh(new THREE.ConeGeometry(0.03, 0.08, 4), shade, [-0.015, 0.065, side * 0.042]);
    ear.rotation.y = Math.PI / 4;
    head.add(ear);
    return ear;
  });
  const closedEyes = [-1, 1].map((side) => {
    const lid = mesh(boxg(0.02, 0.003, 0.004), dark, [0.058, 0.014, side * 0.046], { cast: false });
    lid.rotation.y = side * 0.5;
    head.add(lid);
    return lid;
  });
  const openEyes = [-1, 1].map((side) => {
    const eye = blob(0.01, [1, 1, 1], dark, [0.058, 0.016, side * 0.047], 10);
    head.add(eye);
    return eye;
  });

  // The tail curls round the body when asleep, and up over the back when awake.
  const tail = new THREE.Group();
  tail.position.set(-0.24, 0.1, 0);
  group.add(tail);
  const curl = mesh(new THREE.TorusGeometry(0.065, 0.019, 8, 20, Math.PI * 1.3), coat, [0, 0, 0]);
  tail.add(curl);

  // zZ floating from the nose.
  const zMap = texture(zTexture());
  const zees = [0, 0.5].map((phase) => {
    const z = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: zMap, transparent: true, depthWrite: false, color: new THREE.Color(1.5, 1.5, 1.5), toneMapped: false }),
    );
    z.userData.phase = phase;
    group.add(z);
    return z;
  });

  let awake = false;
  let lift = 0;
  const tick: Tick = (time, delta, still) => {
    const t = time / 1000;
    lift = approach(lift, awake ? 1 : 0, 3, delta);
    head.position.set(0.29 + lift * 0.02, 0.085 + lift * 0.13, 0);
    head.rotation.z = -0.18 + lift * 0.32;
    head.rotation.y = awake && !still ? Math.sin(t * 0.5) * 0.35 : 0;
    ears.forEach((ear, i) => {
      ear.rotation.z = (1 - lift) * 1.15;
      ear.rotation.x = (i ? 1 : -1) * (0.12 + (1 - lift) * 0.1);
    });
    closedEyes.forEach((lid) => (lid.visible = lift < 0.5));
    openEyes.forEach((eye) => (eye.visible = lift >= 0.5));
    // Tail: flat and tucked in sleep; up and wagging when awake.
    tail.rotation.x = (1 - lift) * (Math.PI / 2);
    tail.position.set(-0.24, 0.1 + lift * 0.1, (1 - lift) * 0.08);
    tail.rotation.z = awake && !still ? Math.sin(t * 9) * 0.35 : 0;
    // Breathing: slow when asleep.
    group.scale.y = 1 + (still ? 0 : Math.sin(t * (awake ? 3.2 : 1.3)) * (awake ? 0.012 : 0.02));
    zees.forEach((z) => {
      const show = !awake && !still;
      z.visible = show || (!awake && still && z.userData.phase === 0);
      const p = still ? 0.4 : (t / 2.6 + z.userData.phase) % 1;
      z.position.set(0.47 + p * 0.1, 0.12 + p * 0.22, 0.02 + Math.sin(p * 6) * 0.02);
      const size = 0.06 + p * 0.05;
      z.scale.set(size, size, size);
      (z.material as THREE.SpriteMaterial).opacity = still ? 0.9 : Math.sin(p * Math.PI);
    });
  };

  return {
    group,
    tick,
    setAwake: (on: boolean) => {
      awake = on;
    },
  };
}

/* ------------------------------------------------------------------ book */

/*
 * The book being read, as a hinged pair of halves. In its own frame the spine
 * runs up the y-axis, the pages face +z and the covers face -z; the front
 * cover is the -x half. `setFold` sets how far each half is folded from flat
 * (0 = fully open). Lying face-down on the desk it makes a little tent with
 * the covers up; held up to read, the covers face whoever is looking at him.
 */
export function buildBook(title: string, author: string) {
  const group = new THREE.Group();
  const width = 0.14;
  const height = 0.21;
  const edge = std("#e6dfcf", { roughness: 0.7 });
  const pages = std("#f3eee1", { roughness: 0.9 });
  const pageFace = std("#ffffff", { map: texture(bookPageTexture()), roughness: 0.9 });
  const covers = [
    std("#ffffff", { map: texture(bookCoverTexture(title, author)), roughness: 0.65 }),
    std("#ffffff", { map: texture(bookBackTexture(title, author)), roughness: 0.65 }),
  ];
  // Box faces: +x, -x, +y, -y, +z (inside), -z (outside).
  const halves = [-1, 1].map((side, i) => {
    const half = new THREE.Group();
    half.add(mesh(boxg(width, height, 0.004), [edge, edge, edge, edge, edge, covers[i]], [(side * width) / 2, 0, -0.002]));
    half.add(mesh(boxg(width - 0.006, height - 0.008, 0.012), [pages, pages, pages, pages, pageFace, pages], [side * (width / 2 - 0.002), 0, 0.006]));
    group.add(half);
    return half;
  });
  group.add(mesh(boxg(0.012, height, 0.008), edge, [0, 0, -0.004]));
  const setFold = (fold: number) => {
    halves[0].rotation.y = fold;
    halves[1].rotation.y = -fold;
  };
  setFold(0.5);
  return { group, setFold, width };
}

/* --------------------------------------------------------------- speaker */

/* A speaker on a stand, with a blue ring that pulses when music is playing. */
export function buildSpeaker() {
  const group = new THREE.Group();
  const wood = std("#2b1e16", { roughness: 0.5 });
  const metal = std("#101316", { roughness: 0.35, metalness: 0.6 });
  [-1, 1].forEach((side) => {
    const leg = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8), metal, [side * 0.1, 0.16, 0]);
    leg.rotation.z = side * -0.1;
    group.add(leg);
  });
  group.add(mesh(rbox(0.28, 0.02, 0.22, 0.008), metal, [0, 0.32, 0]));
  const cabinet = new THREE.Group();
  cabinet.position.y = 0.6;
  group.add(cabinet);
  cabinet.add(mesh(rbox(0.32, 0.54, 0.28, 0.025), wood, [0, 0, 0]));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.5), std("#ffffff", { map: texture(grilleTexture()), roughness: 0.9 }));
  face.position.z = 0.141;
  cabinet.add(face);
  const cone = new THREE.Group();
  cone.position.set(0, -0.07, 0.15);
  cabinet.add(cone);
  cone.add(mesh(new THREE.CircleGeometry(0.09, 32), std("#0a0c0e", { roughness: 0.6 }), [0, 0, 0], { cast: false }));
  cone.add(blob(0.03, [1, 1, 0.5], std("#1a1f25", { roughness: 0.3 }), [0, 0, 0.004], 16));
  const ringMaterial = glow(GLOW, 1.6);
  const ring = mesh(new THREE.TorusGeometry(0.098, 0.006, 8, 48), ringMaterial, [0, -0.07, 0.152], { cast: false });
  cabinet.add(ring);
  cabinet.add(mesh(new THREE.CircleGeometry(0.03, 24), std("#0a0c0e"), [0, 0.15, 0.143], { cast: false }));
  cabinet.add(mesh(new THREE.TorusGeometry(0.034, 0.004, 6, 32), metal, [0, 0.15, 0.144], { cast: false }));

  let playing = false;
  let hover = false;
  const tick: Tick = (time, _delta, still) => {
    const t = time / 1000;
    const beat = playing && !still ? Math.pow(Math.max(0, Math.sin(t * 7.6)), 6) : 0;
    cone.scale.setScalar(1 + beat * 0.08);
    cone.position.z = 0.15 + beat * 0.006;
    ringMaterial.color.set(GLOW).multiplyScalar(playing ? 2.4 + beat * 2 : hover ? 2.2 : 1.1);
  };

  return {
    group,
    tick,
    setPlaying: (on: boolean) => {
      playing = on;
    },
    setHover: (on: boolean) => {
      hover = on;
    },
  };
}

/* -------------------------------------------------------------- football */

/* A low-poly football in classic black and white. It hops when pointed at. */
export function buildFootball() {
  const geometry = new THREE.IcosahedronGeometry(0.11, 1).toNonIndexed();
  const corners = new THREE.IcosahedronGeometry(1, 0);
  const cornerPositions = corners.getAttribute("position");
  const unique: THREE.Vector3[] = [];
  for (let i = 0; i < cornerPositions.count; i += 1) {
    const p = new THREE.Vector3().fromBufferAttribute(cornerPositions, i).normalize();
    if (!unique.some((q) => q.distanceTo(p) < 0.01)) unique.push(p);
  }
  const position = geometry.getAttribute("position");
  const colors: number[] = [];
  const red = new THREE.Color("#1a1a1a");
  const white = new THREE.Color("#f3f1ec");
  for (let i = 0; i < position.count; i += 3) {
    const centre = new THREE.Vector3()
      .fromBufferAttribute(position, i)
      .add(new THREE.Vector3().fromBufferAttribute(position, i + 1))
      .add(new THREE.Vector3().fromBufferAttribute(position, i + 2))
      .normalize();
    const nearCorner = unique.some((corner) => corner.dot(centre) > 0.93);
    const colour = nearCorner ? red : white;
    for (let k = 0; k < 3; k += 1) colors.push(colour.r, colour.g, colour.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const ball = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.45 }));
  ball.castShadow = true;
  const group = new THREE.Group();
  ball.position.y = 0.11;
  group.add(ball);

  let hover = false;
  let hop = 0;
  const tick: Tick = (time, delta, still) => {
    hop = approach(hop, hover && !still ? 1 : 0, 6, delta);
    const t = time / 1000;
    ball.position.y = 0.11 + hop * Math.abs(Math.sin(t * 6)) * 0.08;
    if (!still) ball.rotation.y += delta * (0.2 + hop * 3);
  };
  return {
    group,
    tick,
    setHover: (on: boolean) => {
      hover = on;
    },
  };
}
