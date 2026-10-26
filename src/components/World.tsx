import { useEffect, useRef, useState } from "react";
import { bootDone, bootProgress } from "@/boot";
import { music } from "@/content";
import { prefersReducedMotion, waitForFonts } from "@/motion";
import { type RouteId, routes } from "@/router";
import type { HotspotId } from "@/scene/room";
import type { Focus, PanelSide, World as WorldEngine } from "@/scene/world";
import { play } from "@/sound";

/* The objects with a label button: the five sections, the football, and the speaker when there are songs. */
const hotspotIds: HotspotId[] = [
  "about",
  "education",
  "experience",
  "achievements",
  "contact",
  "easter",
  ...(music.songs.length ? (["radio"] as const) : []),
];
const pad = (n: number) => String(n).padStart(2, "0");

export function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

/* What each label button says. */
function labelFor(id: HotspotId, radioOn: boolean) {
  if (id === "radio") return { num: "♪", label: radioOn ? "Now playing" : "Play music", object: "Speaker", kind: "radio" };
  if (id === "easter") return { num: "?", label: "Kick it", object: "Football", kind: "secret" };
  const index = routes.findIndex((item) => item.id === id);
  return { num: pad(index), label: routes[index].label, object: routes[index].object, kind: "section" };
}

/*
 * The 3D room. three.js and the room load after the page appears, while the
 * loading screen (in index.html) counts up. If the device can't show 3D,
 * `onFail` switches the site to its text version.
 */
export function World({
  focus,
  panel,
  active,
  playing,
  radioOn,
  onSelect,
  onRadio,
  onFail,
}: {
  focus: RouteId;
  panel: PanelSide;
  active: boolean;
  playing: boolean;
  radioOn: boolean;
  onSelect: (id: RouteId) => void;
  onRadio: () => void;
  onFail: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<WorldEngine | null>(null);
  const labelRefs = useRef(new Map<HotspotId, HTMLButtonElement>());
  const selectRef = useRef(onSelect);
  const radioRef = useRef(onRadio);
  const failRef = useRef(onFail);
  const focusRef = useRef({ focus, panel });
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<HotspotId | null>(null);
  selectRef.current = onSelect;
  radioRef.current = onRadio;
  failRef.current = onFail;
  focusRef.current = { focus, panel };

  const choose = (id: HotspotId) => {
    if (id === "radio") radioRef.current();
    else selectRef.current(id);
  };

  useEffect(() => {
    let cancelled = false;
    let engine: WorldEngine | null = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!webglAvailable()) {
      failRef.current();
      return;
    }
    (async () => {
      bootProgress(62);
      await waitForFonts();
      if (cancelled) return;
      bootProgress(70);
      const { World: Engine } = await import("@/scene/world");
      if (cancelled) return;
      bootProgress(86);
      // Give the counter a frame to paint before the room is built.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      engine = new Engine({
        canvas,
        still: prefersReducedMotion(),
        onSelect: (id) => choose(id),
        onHover: (id) => {
          setHovered(id);
          if (id) play("hover");
        },
      });
      engineRef.current = engine;
      labelRefs.current.forEach((element, id) => engine?.setLabel(id, element));
      const { focus: start, panel: side } = focusRef.current;
      engine.focusOn(start as Focus, side, true);
      if (start === "home") engine.intro();
      engine.renderOnce();
      engine.start();
      bootDone();
      window.setTimeout(() => !cancelled && setReady(true), 350);
    })().catch((error) => {
      console.error(error);
      if (!cancelled) failRef.current();
    });
    return () => {
      cancelled = true;
      engine?.dispose();
      engineRef.current = null;
    };
    // The room is built once; `choose` reads the latest handlers through refs.
  }, []);

  useEffect(() => {
    engineRef.current?.focusOn(focus as Focus, panel);
  }, [focus, panel]);

  useEffect(() => {
    engineRef.current?.setPlaying(playing);
  }, [playing, ready]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (active) engine.start();
    else engine.stop();
  }, [active, ready]);

  return (
    <div className="world" data-ready={ready} data-focus={focus}>
      <canvas
        ref={canvasRef}
        className="world-canvas"
        role="img"
        aria-label="A 3D office in Bengaluru. Each object opens a section; use the labelled markers or the menu at the bottom."
      />
      <div className="hotspots">
        {hotspotIds.map((id) => {
          const { num, label, object, kind } = labelFor(id, radioOn);
          return (
            <button
              type="button"
              key={id}
              ref={(element) => {
                if (element) labelRefs.current.set(id, element);
                else labelRefs.current.delete(id);
                engineRef.current?.setLabel(id, element);
              }}
              className="hotspot"
              data-kind={kind}
              data-visible="false"
              data-hovered={hovered === id}
              data-sound={kind === "section" ? undefined : "none"}
              aria-label={kind === "secret" ? "Football: a hidden section" : undefined}
              onClick={() => choose(id)}
              tabIndex={focus === "home" && ready ? 0 : -1}
            >
              <span className="hotspot-pill">
                <span className="hotspot-num">{num}</span>
                <span className="hotspot-label">{label}</span>
                <span className="hotspot-object">{object}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
