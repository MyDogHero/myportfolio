import { useEffect, useRef, useState } from "react";
import { profile } from "@/content";
import { prefersReducedMotion, waitForFonts } from "@/motion";
import { type RouteId, routes } from "@/router";
import type { Focus, PanelSide, World as WorldEngine } from "@/scene/world";
import type { HotspotId } from "@/scene/room";

const hotspotIds: HotspotId[] = ["about", "education", "experience", "achievements", "contact"];
const pad = (n: number) => String(n).padStart(2, "0");

export function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

/*
 * The 3D room. three.js and the room load after the page appears; until
 * then a loading screen counts up. If the device can't show 3D, `onFail`
 * switches the site to its text version.
 */
export function World({
  focus,
  panel,
  active,
  onSelect,
  onFail,
}: {
  focus: RouteId;
  panel: PanelSide;
  active: boolean;
  onSelect: (id: RouteId) => void;
  onFail: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<WorldEngine | null>(null);
  const labelRefs = useRef(new Map<HotspotId, HTMLButtonElement>());
  const selectRef = useRef(onSelect);
  const failRef = useRef(onFail);
  const focusRef = useRef({ focus, panel });
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<HotspotId | null>(null);
  selectRef.current = onSelect;
  failRef.current = onFail;
  focusRef.current = { focus, panel };

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
      setProgress(12);
      await waitForFonts();
      if (cancelled) return;
      setProgress(38);
      const { World: Engine } = await import("@/scene/world");
      if (cancelled) return;
      setProgress(72);
      // Give the counter a frame to paint before the room is built.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      engine = new Engine({
        canvas,
        still: prefersReducedMotion(),
        onSelect: (id) => selectRef.current(id),
        onHover: setHovered,
      });
      engineRef.current = engine;
      labelRefs.current.forEach((element, id) => engine?.setLabel(id, element));
      const { focus: start, panel: side } = focusRef.current;
      engine.focusOn(start as Focus, side, true);
      if (start === "home") engine.intro();
      engine.renderOnce();
      setProgress(100);
      engine.start();
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
  }, []);

  useEffect(() => {
    engineRef.current?.focusOn(focus as Focus, panel);
  }, [focus, panel]);

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
        aria-label="A 3D office at night. Each object opens a section; use the labelled markers or the menu at the bottom."
      />
      <div className="hotspots">
        {hotspotIds.map((id) => {
          const index = routes.findIndex((item) => item.id === id);
          const route = routes[index];
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
              data-visible="false"
              data-hovered={hovered === id}
              onClick={() => onSelect(id)}
              tabIndex={focus === "home" && ready ? 0 : -1}
            >
              <span className="hotspot-pill">
                <span className="hotspot-num">{pad(index)}</span>
                <span className="hotspot-label">{route.label}</span>
                <span className="hotspot-object">{route.object}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="loader" aria-hidden={ready} data-done={ready}>
        <div className="loader-inner">
          <p className="loader-top">
            <span>{profile.name}</span>
            <span>Portfolio</span>
          </p>
          <p className="loader-line">Switching on the desk lamp…</p>
          <p className="loader-count" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            {String(progress).padStart(3, "0")}
          </p>
          <span className="loader-bar">
            <span style={{ transform: `scaleX(${progress / 100})` }} />
          </span>
        </div>
      </div>
    </div>
  );
}
