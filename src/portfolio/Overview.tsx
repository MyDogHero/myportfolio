import {
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { sections } from "@/content";
import { pageComponents } from "./pages";
import { ThumbContext, prefersReducedMotion } from "./shared";

const ZOOM_EASE = "cubic-bezier(0.2, 0.75, 0.2, 1)";
const noop = () => {};

/*
 * "All pages": every sheet laid out on the desk as a miniature. Opening zooms
 * the current page down into its place; picking a page zooms it back up.
 */
export function Overview({
  open,
  active,
  trackRef,
  goTo,
  onClosed,
}: {
  open: boolean;
  active: number;
  trackRef: RefObject<HTMLElement | null>;
  goTo: (index: number, instant?: boolean) => void;
  onClosed: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const busyRef = useRef(false);

  const pageRect = () =>
    trackRef.current?.getBoundingClientRect() ??
    new DOMRect(0, 0, window.innerWidth, window.innerHeight);

  // Size the miniatures so each one is an exact scaled copy of a real page.
  const layout = useCallback(() => {
    const dialog = dialogRef.current;
    const list = listRef.current;
    if (!dialog || !list) return;
    const page = pageRect();
    dialog.style.setProperty("--page-w", `${page.width}px`);
    dialog.style.setProperty("--page-h", `${page.height}px`);
    dialog.style.setProperty("--page-ratio", `${page.width} / ${page.height}`);
    const sheet = list.querySelector<HTMLElement>(".overview-sheet");
    if (sheet) {
      dialog.style.setProperty("--s", String(sheet.clientWidth / page.width));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoomTransform = (sheet: HTMLElement) => {
    const page = pageRect();
    const box = sheet.getBoundingClientRect();
    return `translate(${page.left - box.left}px, ${page.top - box.top}px) scale(${
      page.width / box.width
    })`;
  };

  // Open: show the dialog, then zoom the current page down into the grid.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const list = listRef.current;
    if (!open || !dialog || !list) return;
    if (!dialog.open) dialog.showModal();
    layout();

    const items = list.querySelectorAll<HTMLElement>(".overview-item");
    const current = items[active];
    current
      ?.querySelector<HTMLButtonElement>(".overview-pick")
      ?.focus({ preventScroll: true });
    current?.scrollIntoView({ block: "nearest" });

    if (prefersReducedMotion()) return;
    const sheet = current?.querySelector<HTMLElement>(".overview-sheet");
    if (sheet && current) {
      current.classList.add("is-zooming");
      sheet
        .animate(
          [
            { transform: zoomTransform(sheet), boxShadow: "none" },
            { transform: "none" },
          ],
          { duration: 480, easing: ZOOM_EASE },
        )
        .finished.then(
          () => current.classList.remove("is-zooming"),
          () => current.classList.remove("is-zooming"),
        );
    }
    dialog.querySelectorAll<HTMLElement>(".overview-fade").forEach((el) => {
      el.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 320,
        delay: el.classList.contains("overview-backdrop") ? 0 : 140,
        easing: "ease-out",
        fill: "backwards",
      });
    });
    // Only when the overview opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", layout);
    return () => window.removeEventListener("resize", layout);
  }, [open, layout]);

  // Pick a page: jump to it underneath, then zoom its miniature back up.
  const pick = useCallback(
    (index: number) => {
      const dialog = dialogRef.current;
      if (!dialog || busyRef.current) return;
      busyRef.current = true;
      goTo(index, true);

      const finish = () => {
        if (dialog.open) dialog.close();
        busyRef.current = false;
        onClosed();
      };

      const item =
        listRef.current?.querySelectorAll<HTMLElement>(".overview-item")[index];
      const sheet = item?.querySelector<HTMLElement>(".overview-sheet");
      if (prefersReducedMotion() || !item || !sheet) {
        finish();
        return;
      }

      item.classList.add("is-zooming");
      dialog.querySelectorAll<HTMLElement>(".overview-fade").forEach((el) => {
        if (el === sheet) return;
        el.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 280,
          easing: "ease-in",
          fill: "forwards",
        });
      });
      sheet
        .animate(
          [
            { transform: "none" },
            { transform: zoomTransform(sheet), boxShadow: "none" },
          ],
          { duration: 440, easing: ZOOM_EASE, fill: "forwards" },
        )
        .finished.then(finish, finish);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goTo, onClosed],
  );

  // Arrow keys move between miniatures; O or Esc closes.
  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    const list = listRef.current;
    if (!list) return;
    if (event.key === "o" || event.key === "O") {
      event.preventDefault();
      pick(active);
      return;
    }
    const buttons = Array.from(
      list.querySelectorAll<HTMLButtonElement>(".overview-pick"),
    );
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;
    const columns = getComputedStyle(list)
      .gridTemplateColumns.split(" ")
      .filter(Boolean).length;
    const steps: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: columns,
      ArrowUp: -columns,
    };
    if (!(event.key in steps)) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(buttons.length - 1, current + steps[event.key]));
    buttons[next].focus();
  };

  return (
    <dialog
      ref={dialogRef}
      className="overview"
      aria-labelledby="overview-title"
      onCancel={(event) => {
        event.preventDefault();
        pick(active);
      }}
      onKeyDown={onKeyDown}
    >
      {open ? (
        <>
          <div className="overview-backdrop overview-fade" aria-hidden="true" />
          <div className="overview-body">
            <header className="overview-head overview-fade">
              <h2 id="overview-title">All pages</h2>
              <button
                type="button"
                className="text-button"
                onClick={() => pick(active)}
              >
                Close
              </button>
            </header>
            <ol className="overview-grid" ref={listRef}>
              {pageComponents.map((Page, index) => (
                <li
                  key={sections[index].id}
                  className={`overview-item${index === active ? " is-current" : ""}`}
                >
                  <div
                    className={`overview-sheet${
                      index === active ? "" : " overview-fade"
                    }`}
                    aria-hidden="true"
                    inert
                  >
                    <div className="overview-frame">
                      <ThumbContext.Provider value>
                        <Page index={index} active={index} seen goTo={noop} />
                      </ThumbContext.Provider>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="overview-pick"
                    onClick={() => pick(index)}
                    aria-current={index === active ? "page" : undefined}
                    data-testid={`overview-${sections[index].id}`}
                  >
                    <span className="overview-label overview-fade">
                      <span className="overview-num">{index + 1}</span>
                      {sections[index].label}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </>
      ) : null}
    </dialog>
  );
}
