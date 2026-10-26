import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Hud } from "@/components/Hud";
import { NowPlaying } from "@/components/NowPlaying";
import { Panel } from "@/components/Panel";
import { TextMode } from "@/components/TextMode";
import { World, webglAvailable } from "@/components/World";
import { contentError, music } from "@/content";
import { ScrollTrigger, prefersReducedMotion, waitForFonts } from "@/motion";
import { type RouteId, RouterContext, currentRoute, hashMode, hrefFor, titleFor } from "@/router";
import type { PanelSide } from "@/scene/world";
import type { SectionId } from "@/sections";
import { play } from "@/sound";

const TEXT_KEY = "ksi-text-version";

/* Matches the 3D view's own test for an upright screen (see isNarrow in scene/world.ts). */
const NARROW = "(max-aspect-ratio: 11/10)";

function useMedia(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

const startInText = () => {
  if (!webglAvailable()) return true;
  try {
    return window.localStorage.getItem(TEXT_KEY) === "1";
  } catch {
    return false;
  }
};

export default function App() {
  const [route, setRoute] = useState<RouteId>(currentRoute);
  const [textMode, setTextMode] = useState(startInText);
  const [lastSection, setLastSection] = useState<SectionId | null>(() => {
    const start = currentRoute();
    return start === "home" ? null : start;
  });
  const [radioOn, setRadioOn] = useState(false);
  const [radioSmall, setRadioSmall] = useState(false);
  const [playing, setPlaying] = useState(false);
  const narrow = useMedia(NARROW);
  const routeRef = useRef(route);
  routeRef.current = route;

  const scrollToSection = useCallback((id: RouteId) => {
    const smooth = prefersReducedMotion() ? "auto" : "smooth";
    if (id === "home") window.scrollTo({ top: 0, behavior: smooth });
    else document.getElementById(id)?.scrollIntoView({ behavior: smooth, block: "start" });
  }, []);

  const show = useCallback(
    (id: RouteId, push: boolean) => {
      if (push && hrefFor(id) !== `${window.location.pathname}${hashMode ? window.location.hash : ""}`) {
        window.history.pushState(null, "", hrefFor(id));
      }
      document.title = titleFor(id);
      // Opening a section chimes up, going back to the room chimes down; the football gets a fanfare.
      if (!textMode && id !== routeRef.current) play(id === "easter" ? "secret" : id === "home" ? "close" : "open");
      setRoute(id);
      if (id !== "home") setLastSection(id);
      if (textMode) scrollToSection(id);
    },
    [textMode, scrollToSection],
  );

  const go = useCallback((id: RouteId) => show(id, true), [show]);

  useEffect(() => {
    document.title = titleFor(routeRef.current);
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    const onNavigate = () => show(currentRoute(), false);
    window.addEventListener("popstate", onNavigate);
    if (hashMode) window.addEventListener("hashchange", onNavigate);
    return () => {
      window.removeEventListener("popstate", onNavigate);
      window.removeEventListener("hashchange", onNavigate);
    };
  }, [show]);

  // Escape closes a panel and returns to the room.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && routeRef.current !== "home" && !textMode) go("home");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, textMode]);

  // The page only scrolls in the text version; the room fills the screen.
  useEffect(() => {
    document.documentElement.classList.toggle("is-room", !textMode);
    if (textMode) {
      // Measure once the fonts have arrived (they change the page's length), then go to the section.
      waitForFonts().then(() =>
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
          if (routeRef.current !== "home") scrollToSection(routeRef.current);
        }),
      );
    }
  }, [textMode, scrollToSection]);

  // Printing always uses the text version.
  useEffect(() => {
    let restore = false;
    const before = () => {
      restore = !textMode;
      if (restore) flushSync(() => setTextMode(true));
    };
    const after = () => {
      if (restore) setTextMode(false);
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, [textMode]);

  const toggleText = useCallback(() => {
    setTextMode((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(TEXT_KEY, next ? "1" : "0");
      } catch {
        /* Storage can be unavailable (private mode); the choice still applies. */
      }
      return next;
    });
  }, []);

  const fail = useCallback(() => setTextMode(true), []);

  // The speaker starts the music (and opens the card); clicking it again stops it.
  const toggleRadio = useCallback(() => {
    play("toggle");
    setRadioSmall(false);
    setRadioOn((on) => !on);
  }, []);
  const minimiseRadio = useCallback(() => setRadioSmall(true), []);
  const expandRadio = useCallback(() => setRadioSmall(false), []);

  const panelOpen = !textMode && route !== "home";
  const panelSide: PanelSide = panelOpen ? (narrow ? "bottom" : "right") : "none";
  const router = useMemo(() => ({ current: route, go }), [route, go]);

  useEffect(() => {
    document.documentElement.dataset.panel = panelSide;
  }, [panelSide]);

  return (
    <RouterContext.Provider value={router}>
      <a className="skip-link" href={textMode ? "#about" : "#sections-nav"}>
        Skip to content
      </a>

      {contentError ? (
        <p className="content-error" role="alert">
          <strong>content.js has a mistake</strong>
          {contentError.line ? ` on line ${contentError.line}` : ""}, so the site is showing the last
          version that worked. {contentError.line ? "Check that line" : "Check your latest change"} for
          curly quotes (“ ”), a missing comma, or a missing bracket.
        </p>
      ) : null}

      <main id="main" className={textMode ? "is-text" : "is-room"}>
        {webglAvailable() ? (
          <World
            focus={textMode ? "home" : route}
            panel={panelSide}
            active={!textMode}
            playing={playing}
            radioOn={radioOn}
            onSelect={go}
            onRadio={toggleRadio}
            onFail={fail}
          />
        ) : null}
        {textMode ? <TextMode current={route} /> : <Panel section={lastSection} open={panelOpen} />}
      </main>

      {radioOn && music.songs.length ? (
        <NowPlaying
          minimised={radioSmall || panelSide === "bottom"}
          onMinimise={minimiseRadio}
          onExpand={expandRadio}
          onPlayingChange={setPlaying}
        />
      ) : null}

      <Hud textMode={textMode} onToggleText={toggleText} />
      <div className="grain" aria-hidden="true" />
    </RouterContext.Provider>
  );
}
