/*
 * Runs the 3D room: renderer, camera, lights, glow, hover and click, the
 * camera flights between objects, and the positions of the HTML labels.
 *
 * This file (and three.js) loads only after the page itself has appeared,
 * so the rest of the site never waits for it.
 */
import gsap from "gsap";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { bengaluruHour, dogAwakeAt, phaseAt } from "./daylight";
import { type HotspotId, type Room, type View, buildRoom } from "./room";
import type { Phase } from "./textures";

export type Focus = "home" | Exclude<HotspotId, "radio">;

export type WorldOptions = {
  canvas: HTMLCanvasElement;
  still: boolean;
  onSelect: (id: HotspotId) => void;
  onHover: (id: HotspotId | null) => void;
};

/* How the panel covers the screen, so the camera can frame the object in the space that's left. */
export type PanelSide = "none" | "right" | "bottom";

const tmp = new THREE.Vector3();

/*
 * Light for each time of day. "sky" lights the room from above, "sun" is the
 * moon or sun shining in through the window (it casts the window's shape).
 */
const LIGHTING: Record<
  Phase,
  {
    sky: [string, string, number];
    sun: [string, number];
    from: [number, number, number];
    environment: number;
    exposure: number;
    background: string;
    /* Only things brighter than this glow; by day it is raised so sunlit surfaces don't. */
    bloom: number;
  }
> = {
  night: { sky: ["#55639e", "#1a120c", 0.55], sun: ["#a8bcff", 1.5], from: [-3.2, 5.5, -9], environment: 0.22, exposure: 1.05, background: "#07090b", bloom: 0.92 },
  dawn: { sky: ["#8c88b8", "#2a1c14", 0.85], sun: ["#ffb98f", 2.2], from: [-6, 3, -9], environment: 0.32, exposure: 1.08, background: "#0a0b12", bloom: 0.95 },
  day: { sky: ["#b8d0ff", "#3d3024", 1.25], sun: ["#fff1d6", 2.7], from: [-2.6, 7.5, -9], environment: 0.5, exposure: 1.0, background: "#0c1118", bloom: 1.05 },
  dusk: { sky: ["#9a84b0", "#2a1a14", 0.85], sun: ["#ffad6b", 2.6], from: [-6.5, 3.2, -8], environment: 0.32, exposure: 1.08, background: "#0c0a12", bloom: 0.95 },
};

export class World {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(40, 1, 0.05, 60);
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private room: Room;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(9, 9);
  private pointerMoved = false;
  private hovered: HotspotId | null = null;
  private focus: Focus = "home";
  private eye = new THREE.Vector3();
  private target = new THREE.Vector3();
  private yaw = 0;
  private yawGoal = 0;
  private parallax = new THREE.Vector2();
  private parallaxGoal = new THREE.Vector2();
  private shift = { x: 0, y: 0 };
  private drag: { x: number; y: number; moved: boolean; id: number } | null = null;
  private labels = new Map<HotspotId, HTMLElement>();
  private flight: gsap.core.Timeline | null = null;
  private running = false;
  private last = 0;
  private width = 1;
  private height = 1;
  private hits: THREE.Object3D[] = [];
  private disposers: (() => void)[] = [];
  private hemisphere = new THREE.HemisphereLight();
  private sun = new THREE.DirectionalLight();
  private daylightTimer = 0;

  constructor(private options: WorldOptions) {
    const { canvas } = options;
    this.width = canvas.clientWidth || window.innerWidth;
    this.height = canvas.clientHeight || window.innerHeight;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.scene.background = new THREE.Color("#07090b");
    this.scene.fog = new THREE.Fog("#07090b", 14, 30);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.22;
    pmrem.dispose();

    this.room = buildRoom({ still: options.still });
    this.scene.add(this.room.group);
    this.room.hotspots.forEach((spot) => spot.marker && this.scene.add(spot.marker));
    this.hits = this.room.hotspots.flatMap((spot) => spot.hits);
    this.addLights();

    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(this.renderer, target);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.48, 0.5, 0.92);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.updateDaylight();
    // Check the time once a minute, so the sky changes while the page is open.
    this.daylightTimer = window.setInterval(() => this.updateDaylight(), 60_000);

    this.resize();
    const overview = this.overview();
    this.eye.copy(overview.position);
    this.target.copy(overview.target);
    this.bindEvents();
  }

  /* ------------------------------------------------------------ setup */

  private isNarrow() {
    return this.width / this.height < 1.1;
  }

  private addLights() {
    this.scene.add(this.hemisphere);
    // Moonlight (or sunlight) through the window; it casts the window's shape onto the floor.
    const moon = this.sun;
    moon.target.position.set(0.2, 0, -0.4);
    moon.castShadow = true;
    const size = this.isNarrow() ? 1024 : 2048;
    moon.shadow.mapSize.set(size, size);
    moon.shadow.camera.left = -6;
    moon.shadow.camera.right = 6;
    moon.shadow.camera.top = 6;
    moon.shadow.camera.bottom = -6;
    moon.shadow.camera.near = 1;
    moon.shadow.camera.far = 22;
    moon.shadow.bias = -0.0004;
    moon.shadow.normalBias = 0.02;
    moon.shadow.radius = 3;
    this.scene.add(moon, moon.target);
    const fill = new THREE.DirectionalLight("#ffd1a8", 0.25);
    fill.position.set(5, 4, 6);
    this.scene.add(fill);
  }

  /* Matches the sky, the light and the dog to the time of day in Bengaluru. */
  private updateDaylight() {
    const hour = bengaluruHour();
    const phase = phaseAt(hour);
    const light = LIGHTING[phase];
    this.hemisphere.color.set(light.sky[0]);
    this.hemisphere.groundColor.set(light.sky[1]);
    this.hemisphere.intensity = light.sky[2];
    this.sun.color.set(light.sun[0]);
    this.sun.intensity = light.sun[1];
    this.sun.position.set(...light.from);
    this.scene.environmentIntensity = light.environment;
    this.renderer.toneMappingExposure = light.exposure;
    this.bloom.threshold = light.bloom;
    (this.scene.background as THREE.Color).set(light.background);
    this.scene.fog?.color.set(light.background);
    this.room.setDaylight(phase, dogAwakeAt(hour));
  }

  /* The whole-room view; a phone held upright stands further back. */
  private overview(): View & { fov: number } {
    if (this.isNarrow()) {
      return { position: new THREE.Vector3(5.3, 4.3, 7.2), target: new THREE.Vector3(0.1, 0.72, -1.1), fov: 54 };
    }
    return { position: new THREE.Vector3(4.5, 3.05, 5.0), target: new THREE.Vector3(-0.45, 1.3, -1.05), fov: 40 };
  }

  private viewFor(focus: Focus): View & { fov: number } {
    const overview = this.overview();
    if (focus === "home") return overview;
    const spot = this.room.hotspots.find((item) => item.id === focus);
    if (!spot?.view) return overview;
    const position = spot.view.position.clone();
    // Upright phones show the object in the top part of the screen, so step back a little.
    if (this.isNarrow()) position.sub(spot.view.target).multiplyScalar(1.55).add(spot.view.target);
    return { position, target: spot.view.target.clone(), fov: this.isNarrow() ? 50 : 40 };
  }

  /* ----------------------------------------------------------- public */

  setLabel(id: HotspotId, element: HTMLElement | null) {
    if (element) this.labels.set(id, element);
    else this.labels.delete(id);
  }

  /* Tells the speaker whether music is playing, so its cone can pulse. */
  setPlaying(on: boolean) {
    this.room.setPlaying(on);
  }

  /* Flies the camera to an object (or back to the whole room) and makes room for the panel. */
  focusOn(focus: Focus, panel: PanelSide, instant = false) {
    this.focus = focus;
    this.yawGoal = 0;
    const view = this.viewFor(focus);
    const shiftGoal = panel === "right" ? { x: 0.2, y: 0 } : panel === "bottom" ? { x: 0, y: 0.3 } : { x: 0, y: 0 };
    this.flight?.kill();
    if (instant || this.options.still) {
      this.eye.copy(view.position);
      this.target.copy(view.target);
      this.camera.fov = view.fov;
      this.camera.updateProjectionMatrix();
      Object.assign(this.shift, shiftGoal);
      return;
    }
    const duration = 1.5;
    this.flight = gsap
      .timeline()
      .to(this.eye, { x: view.position.x, y: view.position.y, z: view.position.z, duration, ease: "power3.inOut" }, 0)
      .to(this.target, { x: view.target.x, y: view.target.y, z: view.target.z, duration, ease: "power3.inOut" }, 0)
      .to(this.camera, { fov: view.fov, duration, ease: "power3.inOut", onUpdate: () => this.camera.updateProjectionMatrix() }, 0)
      .to(this.shift, { ...shiftGoal, duration: 1.1, ease: "power3.inOut" }, 0.2);
  }

  /* The opening shot: the camera drifts in from outside the window's glow to the whole-room view. */
  intro() {
    if (this.options.still) return;
    const view = this.overview();
    this.eye.set(view.position.x + 2.4, view.position.y + 2.2, view.position.z + 3.5);
    this.target.set(-1, 1.8, -3);
    gsap.to(this.eye, { x: view.position.x, y: view.position.y, z: view.position.z, duration: 2.8, ease: "expo.out" });
    gsap.to(this.target, { x: view.target.x, y: view.target.y, z: view.target.z, duration: 2.8, ease: "expo.out" });
  }

  start() {
    this.resize();
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.renderer.setAnimationLoop((time) => this.frame(time));
  }

  stop() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  /* Renders a single frame now (used before the loading screen lifts). */
  renderOnce() {
    this.frame(performance.now());
  }

  dispose() {
    this.stop();
    window.clearInterval(this.daylightTimer);
    this.flight?.kill();
    this.disposers.forEach((fn) => fn());
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      materials.forEach((material) => {
        Object.values(material).forEach((value) => {
          if (value instanceof THREE.Texture) value.dispose();
        });
        material.dispose();
      });
    });
    this.composer.dispose();
    this.renderer.dispose();
  }

  /* ----------------------------------------------------------- events */

  private bindEvents() {
    const canvas = this.options.canvas;
    const toNdc = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      this.pointer.set(((event.clientX - box.left) / box.width) * 2 - 1, -((event.clientY - box.top) / box.height) * 2 + 1);
      this.pointerMoved = true;
    };
    const down = (event: PointerEvent) => {
      this.drag = { x: event.clientX, y: event.clientY, moved: false, id: event.pointerId };
      toNdc(event);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "mouse") {
        const box = canvas.getBoundingClientRect();
        this.parallaxGoal.set((event.clientX - box.left) / box.width - 0.5, (event.clientY - box.top) / box.height - 0.5);
        toNdc(event);
      }
      if (!this.drag || this.drag.id !== event.pointerId) return;
      const dx = event.clientX - this.drag.x;
      if (!this.drag.moved && Math.hypot(dx, event.clientY - this.drag.y) > 7) {
        this.drag.moved = true;
        canvas.setPointerCapture(event.pointerId);
      }
      if (this.drag.moved && this.focus === "home") {
        const limit = this.isNarrow() ? 0.62 : 0.32;
        this.yawGoal = THREE.MathUtils.clamp(this.yawGoal - dx * 0.0042, -limit, limit);
        this.drag.x = event.clientX;
        this.drag.y = event.clientY;
      }
    };
    const up = (event: PointerEvent) => {
      const wasDrag = this.drag?.moved;
      this.drag = null;
      if (wasDrag) return;
      toNdc(event);
      const id = this.pick();
      if (id) this.options.onSelect(id);
    };
    const leave = () => {
      this.pointer.set(9, 9);
      this.pointerMoved = true;
      this.parallaxGoal.set(0, 0);
    };
    const resize = () => this.resize();
    const visibility = () => (document.hidden ? this.stop() : this.start());

    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointerleave", leave);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", visibility);
    this.disposers.push(() => {
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointerleave", leave);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
    });
  }

  /* Which object is under the pointer, if any. */
  private pick(): HotspotId | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.hits, true)[0];
    return (hit?.object.userData.hotspot as HotspotId | undefined) ?? null;
  }

  resize() {
    const canvas = this.options.canvas;
    this.width = canvas.clientWidth || window.innerWidth;
    this.height = canvas.clientHeight || window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, this.isNarrow() ? 1.5 : 1.75);
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(this.width, this.height, false);
    this.composer?.setPixelRatio(ratio);
    this.composer?.setSize(this.width, this.height);
    this.bloom?.resolution.set(this.width / 2, this.height / 2);
    this.camera.aspect = this.width / this.height;
    const view = this.viewFor(this.focus);
    this.camera.fov = view.fov;
    this.camera.updateProjectionMatrix();
    if (!this.flight?.isActive()) {
      this.eye.copy(view.position);
      this.target.copy(view.target);
    }
  }

  /* ------------------------------------------------------------ frame */

  private frame(time: number) {
    const delta = Math.min(0.05, (time - this.last) / 1000);
    this.last = time;
    const still = this.options.still;

    // Gentle parallax with the mouse, and drag-to-look in the room view.
    this.parallax.lerp(this.parallaxGoal, still ? 1 : 0.05);
    this.yaw += (this.yawGoal - this.yaw) * 0.08;
    const sway = this.focus === "home" ? 1 : 0.35;
    tmp.copy(this.eye).sub(this.target);
    tmp.applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.yaw - this.parallax.x * 0.07 * sway);
    this.camera.position.copy(this.target).add(tmp);
    this.camera.position.y += this.parallax.y * 0.18 * sway;
    this.camera.lookAt(this.target);

    if (this.shift.x || this.shift.y) {
      this.camera.setViewOffset(this.width, this.height, this.shift.x * this.width, this.shift.y * this.height, this.width, this.height);
    } else if (this.camera.view?.enabled) {
      this.camera.clearViewOffset();
    }

    // Hover.
    if (this.pointerMoved) {
      this.pointerMoved = false;
      const id = this.pick();
      if (id !== this.hovered) {
        if (this.hovered) this.room.hotspots.find((spot) => spot.id === this.hovered)?.hover(false);
        this.hovered = id;
        if (id) this.room.hotspots.find((spot) => spot.id === id)?.hover(true);
        this.options.canvas.style.cursor = id ? "pointer" : this.focus === "home" ? "grab" : "default";
        this.options.onHover(id);
      }
    }

    // Markers bob and spin; labels follow them on screen.
    const showMarkers = this.focus === "home";
    this.room.hotspots.forEach((spot, index) => {
      const marker = spot.marker;
      if (marker) {
        const arrow = marker.userData.arrow as THREE.Mesh;
        const goal = showMarkers ? (this.hovered === spot.id ? 1.3 : 1) : 0.001;
        const scale = THREE.MathUtils.lerp(marker.scale.x, goal, still ? 1 : 0.12);
        marker.scale.setScalar(scale);
        if (!still) {
          arrow.rotation.y += delta * 1.6;
          arrow.position.y = Math.sin(time / 600 + index) * 0.035;
        }
      }
      const label = this.labels.get(spot.id);
      if (label) {
        tmp.copy(spot.anchor).project(this.camera);
        const x = (tmp.x * 0.5 + 0.5) * this.width;
        const y = (-tmp.y * 0.5 + 0.5) * this.height;
        const visible = showMarkers && tmp.z < 1;
        label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        label.dataset.visible = visible ? "true" : "false";
        // Near the right edge, the label opens to the left of its marker.
        label.dataset.side = x > this.width - 280 ? "left" : "right";
      }
    });

    this.room.tick(time, delta);
    this.composer.render(delta);
  }
}
