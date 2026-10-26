import { useEffect, useRef } from "react";
import { bootDone } from "@/boot";
import { profile, reading } from "@/content";
import { useReveal } from "@/motion";
import type { RouteId } from "@/router";
import { Section, type SectionId, sectionIds } from "@/sections";
import { Rich } from "./ui";

/*
 * The plain version of the site: every section on one scrolling page. It is
 * used when 3D isn't available, when a visitor picks "Text version", and
 * for printing. The hidden football section only appears here if its own
 * address was opened.
 */
export function TextMode({ current }: { current: RouteId }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, "scroll");
  useEffect(() => bootDone(), []);
  // "Currently reading" follows About; the hidden football section only if its own address was opened.
  const ids: SectionId[] = sectionIds.flatMap((id): SectionId[] => (id === "about" && reading.title ? ["about", "reading"] : [id]));
  if (current === "easter") ids.push("easter");
  return (
    <div className="textmode" ref={ref}>
      <header className="tm-hero">
        <p className="mono" data-reveal>
          {profile.role}
        </p>
        <h1 className="tm-name" data-reveal>
          {profile.name}
        </h1>
        {profile.tagline ? (
          <p className="tm-tagline" data-reveal>
            <Rich text={profile.tagline} />
          </p>
        ) : null}
      </header>
      {ids.map((id) => (
        <section className="tm-section" id={id} key={id} aria-labelledby={`tm-${id}-title`}>
          <Section id={id} mode="scroll" idPrefix="tm-" />
        </section>
      ))}
    </div>
  );
}
