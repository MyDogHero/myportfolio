/* Small building blocks shared by the room and its props. */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

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

/* Eases a value toward a goal each frame, at a rate that doesn't depend on the frame rate. */
export const approach = (value: number, goal: number, rate: number, delta: number) =>
  value + (goal - value) * (1 - Math.exp(-rate * delta));
