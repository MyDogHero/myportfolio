import { useRef } from "react";
import { profile } from "@/content";
import { useReveal } from "@/motion";
import { Section, sectionIds } from "@/sections";
import { Rich } from "./ui";

/*
 * The plain version of the site: every section on one scrolling page. It is
 * used when 3D isn't available, when a visitor picks "Text version", and
 * for printing.
 */
export function TextMode() {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, "scroll");
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
      {sectionIds.map((id) => (
        <section className="tm-section" id={id} key={id} aria-labelledby={`tm-${id}-title`}>
          <Section id={id} mode="scroll" idPrefix="tm-" />
        </section>
      ))}
    </div>
  );
}
