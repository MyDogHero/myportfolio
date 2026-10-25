import { type Ref } from "react";
import { sections } from "@/content";
import { LAST } from "./shared";

export type Theme = "light" | "dark";

export function ThemeSwitch({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (theme: Theme) => void;
}) {
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <label className="ui-switch" title={label}>
      <input
        type="checkbox"
        checked={isDark}
        aria-label="Dark mode"
        onChange={(event) => onChange(event.target.checked ? "dark" : "light")}
      />
      <span className="slider" aria-hidden="true">
        <span className="circle" />
      </span>
    </label>
  );
}

export function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      className="arrow-icon"
      viewBox="0 0 28 12"
      aria-hidden="true"
      focusable="false"
      style={direction === "left" ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M0 6h26M21 1l5 5-5 5" fill="none" stroke="currentColor" />
    </svg>
  );
}

export function OverviewButton({
  onClick,
  buttonRef,
}: {
  onClick: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      ref={buttonRef}
      className="overview-button"
      onClick={onClick}
      aria-label="All pages"
      aria-haspopup="dialog"
      title="All pages (O)"
      data-testid="button-overview"
    >
      <svg viewBox="0 0 18 14" aria-hidden="true" focusable="false">
        {[0, 1, 2].map((col) =>
          [0, 1].map((row) => (
            <rect
              key={`${col}-${row}`}
              x={0.5 + col * 6}
              y={0.5 + row * 7}
              width="5"
              height="6"
              rx="0.6"
              fill="none"
              stroke="currentColor"
            />
          )),
        )}
      </svg>
      <span className="overview-button-label">All pages</span>
    </button>
  );
}

export function IndexTabs({
  active,
  goTo,
}: {
  active: number;
  goTo: (index: number) => void;
}) {
  return (
    <nav className="index-tabs" aria-label="Portfolio sections">
      <ol>
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={index === active ? "true" : undefined}
              data-testid={`tab-${section.id}`}
              data-cover={index === 0 ? "true" : undefined}
              onClick={(event) => {
                event.preventDefault();
                goTo(index);
              }}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Pager({
  active,
  goTo,
}: {
  active: number;
  goTo: (index: number) => void;
}) {
  const previous = active > 0 ? sections[active - 1] : null;
  const next = active < LAST ? sections[active + 1] : null;

  return (
    <nav className="pager" aria-label="Turn the page">
      <button
        type="button"
        className="pager-button pager-prev"
        disabled={!previous}
        aria-label={previous ? `Previous page: ${previous.label}` : "Previous page"}
        data-testid="button-previous-panel"
        onClick={() => goTo(active - 1)}
      >
        <Arrow direction="left" />
        <span className="pager-label">{previous?.label}</span>
      </button>

      <p className="folio">
        <span aria-hidden="true">
          {active + 1}
          <span className="folio-sep">/</span>
          {sections.length}
        </span>
        <span className="visually-hidden" aria-live="polite">
          {sections[active].label}, page {active + 1} of {sections.length}
        </span>
      </p>

      <button
        type="button"
        className="pager-button pager-next"
        disabled={!next}
        aria-label={next ? `Next page: ${next.label}` : "Next page"}
        data-testid="button-next-panel"
        onClick={() => goTo(active + 1)}
      >
        <span className="pager-label">{next?.label}</span>
        <Arrow direction="right" />
      </button>
    </nav>
  );
}

const shortcuts: { keys: string[]; action: string }[] = [
  { keys: ["→", "Page Down"], action: "Next page" },
  { keys: ["←", "Page Up"], action: "Previous page" },
  { keys: ["Home"], action: "Cover" },
  { keys: ["End"], action: "Contact" },
  { keys: ["O"], action: "All pages" },
  { keys: ["?"], action: "Show these shortcuts" },
  { keys: ["Esc"], action: "Close" },
];

export function ShortcutsDialog({
  dialogRef,
  onClose,
}: {
  dialogRef: Ref<HTMLDialogElement>;
  onClose: () => void;
}) {
  return (
    <dialog
      ref={dialogRef}
      className="shortcuts"
      aria-labelledby="shortcuts-title"
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop (outside the card) closes it.
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="shortcuts-card">
        <h2 id="shortcuts-title">Keyboard shortcuts</h2>
        <dl className="shortcuts-list">
          {shortcuts.map((item) => (
            <div key={item.action}>
              <dt>
                {item.keys.map((key) => (
                  <kbd key={key}>{key}</kbd>
                ))}
              </dt>
              <dd>{item.action}</dd>
            </div>
          ))}
        </dl>
        <form method="dialog">
          <button type="submit" className="text-button">
            Close
          </button>
        </form>
      </div>
    </dialog>
  );
}
