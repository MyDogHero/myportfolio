/* Small building blocks shared by the room and its props. */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export const std = (color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0, ...extra });

/* A glowing material: colours above 1 make the bloom pass light it up. */
export const glow = (color: THREE.ColorRepresentation, strength = 2.4) =>
  new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), toneMapped: false });

export function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material | THREE.Material[],
  position: [number, number, number],
  { cast = true, receive = true } = {},
) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

export const rbox = (w: number, h: number, d: number, r = 0.02) => new RoundedBoxGeometry(w, h, d, 3, r);
export const boxg = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

/* A rounded rod from one point to another: arms, legs, a mustache. */
export function limb(from: THREE.Vector3, to: THREE.Vector3, radius: number, material: THREE.Material) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = Math.max(0.001, direction.length() - radius * 2);
  const rod = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, 14), material);
  rod.position.copy(from).add(to).multiplyScalar(0.5);
  rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  rod.castShadow = true;
  return rod;
}

/* Moves a rod made by `limb` so it runs between two new points (its length stays the same). */
const UP = new THREE.Vector3(0, 1, 0);
const along = new THREE.Vector3();
export function poseLimb(rod: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3) {
  rod.position.copy(from).add(to).multiplyScalar(0.5);
  along.subVectors(to, from).normalize();
  rod.quaternion.setFromUnitVectors(UP, along);
}

/*
 * Where the elbow goes when the shoulder and hand are at these points and the
 * upper arm and forearm have these lengths. `pole` is the way the elbow
 * points. Writes the elbow into `elbow` and returns the reachable hand point.
 */
const reach = new THREE.Vector3();
const bend = new THREE.Vector3();
export function solveElbow(
  shoulder: THREE.Vector3,
  hand: THREE.Vector3,
  upper: number,
  fore: number,
  pole: THREE.Vector3,
  elbow: THREE.Vector3,
  reached: THREE.Vector3,
) {
  reach.subVectors(hand, shoulder);
  const distance = Math.min(Math.max(reach.length(), Math.abs(upper - fore) + 1e-4), upper + fore - 1e-4);
  reach.normalize();
  const x = (upper * upper - fore * fore + distance * distance) / (2 * distance);
  const h = Math.sqrt(Math.max(0, upper * upper - x * x));
  bend.copy(pole).addScaledVector(reach, -pole.dot(reach)).normalize();
  elbow.copy(shoulder).addScaledVector(reach, x).addScaledVector(bend, h);
  return reached.copy(shoulder).addScaledVector(reach, distance);
}

export const smooth = (edge0: number, edge1: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/* A squashed sphere: heads, bodies, cushions of hair. */
export function blob(
  radius: number,
  scale: [number, number, number],
  material: THREE.Material,
  position: [number, number, number],
  segments = 24,
) {
  const m = mesh(new THREE.SphereGeometry(radius, segments, Math.round(segments * 0.75)), material, position);
  m.scale.set(...scale);
  return m;
}

/*
 * A soft cushion: plump in the middle, thinning to a seam at the edges, with
 * the sides drawn in a little so the corners poke out like a real pillow.
 * Width and height are its face; depth is how plump it is at the centre.
 */
export function cushionGeometry(width: number, height: number, depth: number) {
  const box = new THREE.BoxGeometry(1, 1, 1, 24, 24, 6);
  box.deleteAttribute("normal");
  box.deleteAttribute("uv");
  const geometry = mergeVertices(box);
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i += 1) {
    const u = position.getX(i) * 2;
    const v = position.getY(i) * 2;
    const z = position.getZ(i) * 2;
    const puff = Math.pow(Math.cos((u * Math.PI) / 2), 0.55) * Math.pow(Math.cos((v * Math.PI) / 2), 0.55);
    position.setXYZ(
      i,
      ((u * width) / 2) * (1 - 0.09 * (1 - v * v)),
      ((v * height) / 2) * (1 - 0.09 * (1 - u * u)),
      ((z * depth) / 2) * (0.08 + 0.92 * puff),
    );
  }
  geometry.computeVertexNormals();
  return geometry;
}

/* Eases a value toward a goal each frame, at a rate that doesn't depend on the frame rate. */
export const approach = (value: number, goal: number, rate: number, delta: number) =>
  value + (goal - value) * (1 - Math.exp(-rate * delta));
