import {
  type FocusEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import { contentError, profile, sections } from "@/content";
import {
  IndexTabs,
  OverviewButton,
  Pager,
  ShortcutsDialog,
  ThemeSwitch,
  type Theme,
} from "@/portfolio/chrome";
import { Overview } from "@/portfolio/Overview";
import { pageComponents } from "@/portfolio/pages";
import { usePageTurner } from "@/portfolio/pageTurner";
import { LAST, prefersReducedMotion } from "@/portfolio/shared";

const THEME_KEY = "portfolio-theme";
const SWIPE_HINT_KEY = "portfolio-swipe-hint-seen";

const indexFromHash = (hash: string) =>
  sections.findIndex((section) => section.id === hash.replace(/^#/, ""));

const isDialogOpen = () => Boolean(document.querySelector("dialog[open]"));

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== "undefined" &&
    document.documentElement.dataset.theme === "dark"
      ? "dark"
      : "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Follow the system setting until the visitor picks a theme themselves.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(THEME_KEY);
      } catch {
        stored = null;
      }
      if (!stored) setTheme(event.matches ? "dark" : "light");
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const choose = useCallback((next: Theme) => {
    const apply = () => {
      document.documentElement.dataset.theme = next;
      flushSync(() => setTheme(next));
    };
    // Cross-fade the change where the browser supports view transitions.
    const doc = document as Document & {
      startViewTransition?: (update: () => void) => unknown;
    };
    if (doc.startViewTransition && !prefersReducedMotion()) {
      doc.startViewTransition(apply);
    } else {
      apply();
    }
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* Storage can be unavailable (private mode); the choice still applies. */
    }
  }, []);

  return [theme, choose] as const;
}

function Portfolio() {
  const trackRef = useRef<HTMLElement>(null);
  const ambientRef = useRef<HTMLDivElement>(null);
  const shortcutsRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(() => {
    const fromHash = indexFromHash(window.location.hash);
    return fromHash >= 0 ? fromHash : 0;
  });
  const activeRef = useRef(active);
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set());
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [theme, setTheme] = useTheme();

  const showPage = useCallback((index: number) => {
    if (index === activeRef.current) return;
    activeRef.current = index;
    setActive(index);
  }, []);

  const { turnTo } = usePageTurner({
    trackRef,
    ambientRef,
    initial: active,
    onSettleTarget: showPage,
    onLiveIndex: showPage,
  });

  const goTo = useCallback(
    (index: number, instant = false) => turnTo(index, { instant }),
    [turnTo],
  );

  const openOverview = useCallback(() => setOverviewOpen(true), []);
  const closeOverview = useCallback(() => setOverviewOpen(false), []);
  const openShortcuts = useCallback(() => {
    const dialog = shortcutsRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // Remember which pages have been opened (the ruled underline draws once).
  useEffect(() => {
    setSeen((previous) =>
      previous.has(active) ? previous : new Set(previous).add(active),
    );
  }, [active]);

  // Mirror the current page in the URL so a page can be linked directly.
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    const wanted = active === 0 ? "" : `#${sections[active].id}`;
    if (hash !== wanted) {
      window.history.replaceState(null, "", `${pathname}${search}${wanted}`);
    }
  }, [active]);

  useEffect(() => {
    const onHashChange = () => {
      const index = indexFromHash(window.location.hash);
      if (index >= 0 && index !== activeRef.current) goTo(index);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [goTo]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isDialogOpen()
      ) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          "textarea, select, [contenteditable='true'], input:not([type='checkbox']):not([type='radio'])",
        )
      ) {
        return;
      }

      if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        openOverview();
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        openShortcuts();
        return;
      }

      const moves: Record<string, number> = {
        ArrowRight: activeRef.current + 1,
        PageDown: activeRef.current + 1,
        ArrowLeft: activeRef.current - 1,
        PageUp: activeRef.current - 1,
        Home: 0,
        End: LAST,
      };
      if (event.key in moves) {
        event.preventDefault();
        goTo(moves[event.key]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, openOverview, openShortcuts]);

  // A vertical wheel or trackpad gesture turns one page. A page that has more
  // to read scrolls first, and the turn waits for the next gesture.
  useEffect(() => {
    const gesture = { lastEvent: 0, used: false, sum: 0, lastTurn: 0 };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || isDialogOpen()) return;
      const now = performance.now();
      if (now - gesture.lastEvent > 220) {
        gesture.used = false;
        gesture.sum = 0;
      }
      gesture.lastEvent = now;

      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;

      const target = event.target instanceof Element ? event.target : null;
      const page = target?.closest<HTMLElement>(".track .panel-scroll");
      if (page) {
        const room =
          event.deltaY > 0
            ? page.scrollHeight - page.clientHeight - page.scrollTop
            : page.scrollTop;
        if (room > 1) {
          gesture.used = true;
          return;
        }
      }

      event.preventDefault();
      if (gesture.used) return;
      // Scrolling that carries on right after a turn (trackpad momentum) is
      // part of the same gesture, so it can't turn a second page.
      if (now - gesture.lastTurn < 450) {
        gesture.used = true;
        return;
      }
      gesture.sum += event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      if (Math.abs(gesture.sum) < 24) return;

      gesture.used = true;
      gesture.lastTurn = now;
      goTo(activeRef.current + (gesture.sum > 0 ? 1 : -1));
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [goTo]);

  // On a phone's first visit, the next page peeks in once to show that the
  // site turns sideways. Skipped if the visitor is already swiping.
  useEffect(() => {
    if (
      !window.matchMedia("(pointer: coarse)").matches ||
      prefersReducedMotion() ||
      activeRef.current !== 0
    ) {
      return;
    }
    try {
      if (window.localStorage.getItem(SWIPE_HINT_KEY)) return;
    } catch {
      /* Without storage the hint simply shows on each visit. */
    }
    const track = trackRef.current;
    const next = track?.children[1] as HTMLElement | undefined;
    if (!track || !next || typeof next.animate !== "function") return;

    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };
    track.addEventListener("pointerdown", cancel, { passive: true });
    const timer = window.setTimeout(() => {
      if (cancelled || activeRef.current !== 0) return;
      const w = track.clientWidth;
      const edge = next.querySelector<HTMLElement>(":scope > .panel-edge");
      if (edge) edge.style.opacity = "0.7";
      next
        .animate(
          [
            { transform: `translate3d(${w}px, 0, 0)` },
            { transform: `translate3d(${w * 0.78}px, 0, 0)`, offset: 0.42 },
            { transform: `translate3d(${w * 0.78}px, 0, 0)`, offset: 0.58 },
            { transform: `translate3d(${w}px, 0, 0)` },
          ],
          { duration: 1500, easing: "cubic-bezier(0.45, 0, 0.25, 1)" },
        )
        .finished.finally(() => {
          if (edge) edge.style.opacity = "";
        });
      try {
        window.localStorage.setItem(SWIPE_HINT_KEY, "1");
      } catch {
        /* ignore */
      }
    }, 1700);

    return () => {
      window.clearTimeout(timer);
      track.removeEventListener("pointerdown", cancel);
    };
  }, []);

  // Tabbing into a link on another page brings that page into view.
  const onFocusCapture = (event: FocusEvent<HTMLElement>) => {
    const page = (event.target as HTMLElement).closest<HTMLElement>(".panel");
    const index = Number(page?.dataset.index);
    if (page && !Number.isNaN(index) && index !== activeRef.current) {
      goTo(index);
    }
  };

  return (
    <div className={`portfolio-app${active === 0 ? " on-cover" : ""}`}>
      <a className="skip-link" href="#cover">
        Skip to portfolio content
      </a>

      {contentError ? (
        <p className="content-error" role="alert">
          <strong>content.js has a mistake</strong>
          {contentError.line ? ` on line ${contentError.line}` : ""}, so the
          site is showing the last version that worked.{" "}
          {contentError.line ? "Check that line" : "Check your latest change"} for
          curly quotes (“ ”), a missing comma, or a missing bracket.
        </p>
      ) : null}

      <header className="running-head">
        <a
          className={`running-name${active === 0 ? " is-hidden" : ""}`}
          href="#cover"
          tabIndex={active === 0 ? -1 : undefined}
          aria-hidden={active === 0 ? "true" : undefined}
          onClick={(event) => {
            event.preventDefault();
            goTo(0);
          }}
        >
          {profile.name}
        </a>
        <OverviewButton onClick={openOverview} />
        <ThemeSwitch theme={theme} onChange={setTheme} />
      </header>

      <main
        className="track"
        ref={trackRef}
        tabIndex={-1}
        onFocusCapture={onFocusCapture}
        aria-label="Portfolio pages"
        data-page={sections[active].id}
      >
        {pageComponents.map((Page, index) => (
          <Page
            key={sections[index].id}
            index={index}
            active={active}
            seen={seen.has(index)}
            goTo={goTo}
          />
        ))}
      </main>

      <div className="ambient" aria-hidden="true">
        <div className="ambient-light" ref={ambientRef} />
      </div>
      <div className="vignette" aria-hidden="true" />

      <IndexTabs active={active} goTo={goTo} />
      <Pager active={active} goTo={goTo} />

      <Overview
        open={overviewOpen}
        active={active}
        trackRef={trackRef}
        goTo={goTo}
        onClosed={closeOverview}
      />
      <ShortcutsDialog dialogRef={shortcutsRef} onClose={() => undefined} />
    </div>
  );
}

/*
 * The site is a single page. Any other address shows the "page doesn't exist"
 * screen: the build saves a copy of the page as 404.html, which Netlify serves
 * for unknown addresses.
 */
const isHomeAddress = () =>
  /(^|\/)(index(\.html)?)?$/.test(window.location.pathname);

function App() {
  // The single-file copy is opened straight from disk under its own file name,
  // so it always shows the portfolio.
  const showPortfolio =
    Boolean(window.__PORTFOLIO_STANDALONE) || isHomeAddress();

  return <ErrorBoundary>{showPortfolio ? <Portfolio /> : <NotFound />}</ErrorBoundary>;
}

export default App;
