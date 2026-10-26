import { useEffect, useRef } from "react";
import { useReveal } from "@/motion";
import { routes, useRouter } from "@/router";
import { Section, type SectionId } from "@/sections";

/*
 * The panel that slides in when an object is opened: from the right on wide
 * screens, up from the bottom on phones. It keeps showing the last section
 * while it slides away.
 */
export function Panel({ section, open }: { section: SectionId | null; open: boolean }) {
  const { go } = useRouter();
  const ref = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  useReveal(bodyRef, "open", section);

  // Each new section starts at its top, and keyboard focus moves to its title.
  useEffect(() => {
    if (!open || !section) return;
    bodyRef.current?.scrollTo({ top: 0 });
    const timer = window.setTimeout(() => {
      document.getElementById(`panel-${section}-title`)?.focus({ preventScroll: true });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [open, section]);

  const label = routes.find((item) => item.id === section)?.label ?? "";

  return (
    <aside
      ref={ref}
      className="panel"
      data-open={open}
      aria-hidden={!open}
      aria-label={label}
      inert={!open}
    >
      <div className="panel-bar">
        <span className="panel-grip" aria-hidden="true" />
        <button type="button" className="panel-close" onClick={() => go("home")}>
          <span aria-hidden="true">←</span> Back to the room
        </button>
      </div>
      <div className="panel-body" ref={bodyRef}>
        {section ? <Section key={section} id={section} mode="open" idPrefix="panel-" /> : null}
      </div>
    </aside>
  );
}
