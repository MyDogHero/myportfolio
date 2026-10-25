import { type ReactNode, useEffect, useState } from "react";
import {
  about,
  caseStudy,
  contact,
  education,
  experience,
  experienceIntro,
  profile,
  projects,
  projectsIntro,
  sections,
  skills,
} from "@/content";
import { Stamp } from "./Stamp";
import { useIsThumb, useOwnId } from "./shared";

export type PageProps = {
  index: number;
  active: number;
  seen: boolean;
  goTo: (index: number) => void;
};

/*
 * One page of the ledger. The outer section is the sheet of paper (it slides
 * over the page before it); the inner element scrolls when a page is long.
 */
function Panel({
  index,
  active,
  seen,
  kind,
  labelledBy,
  children,
}: {
  index: number;
  active: number;
  seen: boolean;
  kind: "cover" | "sheet";
  labelledBy: string;
  children: ReactNode;
}) {
  const isThumb = useIsThumb();
  const section = sections[index];
  return (
    <section
      className={`panel ${kind}${index === active ? " is-active" : ""}${
        seen ? " is-seen" : ""
      }`}
      id={isThumb ? undefined : section.id}
      data-index={isThumb ? undefined : index}
      aria-labelledby={isThumb ? undefined : labelledBy}
      style={{ zIndex: index + 1 }}
    >
      <div className="panel-scroll">{children}</div>
      <div className="panel-shade" aria-hidden="true" />
      <div className="panel-edge" aria-hidden="true" />
    </section>
  );
}

function Sheet({
  index,
  active,
  seen,
  wide = false,
  children,
}: Omit<PageProps, "goTo"> & { wide?: boolean; children: ReactNode }) {
  const section = sections[index];
  const titleId = `${section.id}-title`;
  return (
    <Panel
      index={index}
      active={active}
      seen={seen}
      kind="sheet"
      labelledBy={titleId}
    >
      <div className="panel-inner sheet-grid">
        <h2 className="hanging-head" id={useOwnId(titleId)}>
          {section.label}
        </h2>
        <div className={`sheet-main${wide ? " is-wide" : ""}`}>{children}</div>
      </div>
    </Panel>
  );
}

export function CoverPage({ index, active, seen }: PageProps) {
  const isThumb = useIsThumb();
  return (
    <Panel
      index={index}
      active={active}
      seen={seen}
      kind="cover"
      labelledBy="cover-name"
    >
      <div className="panel-inner cover-inner">
        <div className="cover-label">
          <div className="cover-title">
            <h1
              className="cover-name"
              id={useOwnId("cover-name")}
              data-testid={isThumb ? undefined : "text-portfolio-name"}
            >
              <span>{profile.firstLine}</span>{" "}
              <span>{profile.secondLine}</span>
            </h1>
            <Stamp className="cover-stamp" interactive intro />
          </div>
          <p className="cover-role">{profile.role}</p>
          <p className="cover-statement">{profile.statement}</p>
        </div>
        <p className="cover-hint">
          <span className="hint-pointer">
            Scroll, use the arrow keys, or pick a tab to turn the page. Press ?
            for shortcuts.
          </span>
          <span className="hint-touch">
            Swipe sideways or tap a tab to turn the page.
          </span>
        </p>
      </div>
    </Panel>
  );
}

export function AboutPage(props: PageProps) {
  return (
    <Sheet {...props}>
      <p className="lede">{about.lede}</p>
      {about.paragraphs.map((paragraph) => (
        <p className="body-copy" key={paragraph}>
          {paragraph}
        </p>
      ))}
      <dl className="facts">
        {about.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}

export function EducationPage(props: PageProps) {
  return (
    <Sheet {...props} wide>
      <table className="ledger">
        <caption className="visually-hidden">Education and results</caption>
        <thead>
          <tr>
            <th scope="col">Years</th>
            <th scope="col">Details</th>
            <th scope="col" className="num">
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {education.map((row) => (
            <tr
              key={`${row.years}-${row.institution}`}
              className={row.subRow ? "is-sub" : undefined}
            >
              <td className="ledger-years">{row.years}</td>
              <td className="ledger-details">
                <span className="ledger-title">{row.institution}</span>
                <span className="ledger-qual">{row.qualification}</span>
                {row.courses ? (
                  <span className="ledger-courses">
                    <span className="ledger-courses-label">
                      {row.courses.label}
                    </span>
                    <span className="course-list">
                      {row.courses.items.map((course) => (
                        <span className="course" key={course}>
                          {course}
                        </span>
                      ))}
                    </span>
                  </span>
                ) : null}
              </td>
              <td className="num">
                {row.result?.figure ? (
                  <span className={`figure${row.highlight ? " is-total" : ""}`}>
                    {row.result.figure}
                    {row.result.unit ? (
                      <span className="figure-unit">{row.result.unit}</span>
                    ) : null}
                  </span>
                ) : null}
                {row.result?.note ? (
                  <span className="figure-note">{row.result.note}</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Sheet>
  );
}

function OpenEntry({ reservedFor, lines }: { reservedFor: string; lines: number }) {
  return (
    <li className="entry is-open">
      <div className="entry-head">
        <h3 className="entry-title">Reserved for {reservedFor}</h3>
      </div>
      <span className="open-lines" aria-hidden="true">
        {Array.from({ length: lines }, (_, line) => (
          <span className="open-line" key={line} />
        ))}
      </span>
    </li>
  );
}

export function ExperiencePage(props: PageProps) {
  return (
    <Sheet {...props}>
      {experienceIntro ? (
        <p className="experience-intro">{experienceIntro}</p>
      ) : null}
      <ol className="entries">
        {experience.map((entry, index) =>
          entry.open ? (
            <OpenEntry
              key={`open-${index}`}
              reservedFor={entry.reservedFor}
              lines={entry.lines}
            />
          ) : (
            <li className="entry" key={`${entry.title}-${index}`}>
              <div className="entry-head">
                <h3 className="entry-title">{entry.title}</h3>
                {entry.dates ? (
                  <span className="entry-dates">{entry.dates}</span>
                ) : null}
              </div>
              <p className="entry-org">{entry.org}</p>
              {entry.points?.length ? (
                <ul className="entry-points">
                  {entry.points.map((point, pointIndex) => (
                    <li key={`${point}-${pointIndex}`}>{point}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ),
        )}
      </ol>
    </Sheet>
  );
}

function CaseStudyBox() {
  const caseTitleId = useOwnId("case-study-title");
  return (
    <aside
      className={`case-study${caseStudy.open ? " is-open" : ""}`}
      aria-labelledby={caseTitleId}
    >
      <p className="case-study-kicker">{caseStudy.kicker}</p>
      <h3 id={caseTitleId}>
        {caseStudy.open ? `Reserved for ${caseStudy.reservedFor}` : caseStudy.title}
      </h3>
      {!caseStudy.open && caseStudy.summary ? (
        <p className="case-study-summary">{caseStudy.summary}</p>
      ) : null}
      <ol className="case-study-steps">
        {caseStudy.steps.map((step) => (
          <li key={step.label}>
            <span className="case-study-step">{step.label}</span>
            {caseStudy.open ? (
              <span className="open-line" aria-hidden="true" />
            ) : (
              <span>{step.text}</span>
            )}
          </li>
        ))}
      </ol>
    </aside>
  );
}

export function ProjectsPage(props: PageProps) {
  const isThumb = useIsThumb();
  return (
    <Sheet {...props} wide>
      <div className="experience has-aside">
        <div>
          {projectsIntro ? (
            <p className="experience-intro">{projectsIntro}</p>
          ) : null}
          <ol className="entries">
            {projects.map((entry, index) =>
              entry.open ? (
                <OpenEntry
                  key={`open-${index}`}
                  reservedFor={entry.reservedFor}
                  lines={entry.lines}
                />
              ) : (
                <li
                  className={`entry project${entry.result ? " has-result" : ""}`}
                  key={`${entry.title}-${index}`}
                >
                  <div className="project-body">
                    <div className="entry-head">
                      <h3 className="entry-title">{entry.title}</h3>
                      {entry.dates ? (
                        <span className="entry-dates">{entry.dates}</span>
                      ) : null}
                    </div>
                    <p className="entry-org">{entry.context}</p>
                    {entry.summary ? (
                      <p className="project-summary">{entry.summary}</p>
                    ) : null}
                    {entry.points?.length ? (
                      <ul className="entry-points">
                        {entry.points.map((point, pointIndex) => (
                          <li key={`${point}-${pointIndex}`}>{point}</li>
                        ))}
                      </ul>
                    ) : null}
                    {entry.skills || entry.link ? (
                      <p className="project-meta">
                        {entry.skills ? (
                          <span>
                            <span className="project-meta-label">Skills used</span>{" "}
                            {entry.skills}
                          </span>
                        ) : null}
                        {entry.link ? (
                          <a
                            className="project-link"
                            href={entry.link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            tabIndex={isThumb ? -1 : undefined}
                          >
                            {entry.link.label}
                          </a>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                  {entry.result ? (
                    <p className="project-result">{entry.result}</p>
                  ) : null}
                </li>
              ),
            )}
          </ol>
        </div>
        <CaseStudyBox />
      </div>
    </Sheet>
  );
}

function SkillGroup({ group, items }: { group: string; items: string[] }) {
  const headingId = useOwnId(`skills-${group}`);
  return (
    <section className="schedule-row" aria-labelledby={headingId}>
      <h3 className="schedule-group" id={headingId}>
        {group}
      </h3>
      <ul className="schedule-items">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function SkillsPage(props: PageProps) {
  return (
    <Sheet {...props} wide>
      <div className="schedule">
        {skills.map((group) => (
          <SkillGroup key={group.group} group={group.group} items={group.items} />
        ))}
      </div>
    </Sheet>
  );
}

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand("copy");
      field.remove();
      setState(ok ? "copied" : "failed");
    }
  };

  return (
    <button
      type="button"
      className={`copy-button${state === "copied" ? " is-done" : ""}`}
      onClick={copy}
      data-testid="button-copy-email"
    >
      <span aria-live="polite">
        {state === "copied"
          ? "Copied"
          : state === "failed"
            ? "Copy failed"
            : "Copy address"}
      </span>
    </button>
  );
}

export function ContactPage(props: PageProps) {
  const isThumb = useIsThumb();
  const { goTo } = props;
  const year = new Date().getFullYear();
  return (
    <Sheet {...props}>
      <dl className="contact-list">
        <div className="contact-row">
          <dt>Email</dt>
          <dd>
            <a
              className="contact-link"
              href={`mailto:${contact.email}`}
              data-testid={isThumb ? undefined : "link-email"}
            >
              {contact.email}
            </a>
            {isThumb ? null : <CopyButton text={contact.email} />}
          </dd>
        </div>
        <div className="contact-row">
          <dt>LinkedIn</dt>
          <dd>
            <a
              className="contact-link"
              href={contact.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={isThumb ? undefined : "link-linkedin"}
            >
              {contact.linkedinLabel}
            </a>
          </dd>
        </div>
        <div className="contact-row">
          <dt>Based in</dt>
          <dd className="contact-text">{contact.location}</dd>
        </div>
      </dl>

      <footer className="sign-off">
        <Stamp className="sign-off-stamp" baseAngle={7} interactive />
        <div className="sign-off-text">
          <p className="sign-off-name">{profile.name}</p>
          <p className="sign-off-meta">&copy; {year}</p>
          <p className="sign-off-actions">
            <button
              type="button"
              className="text-button"
              data-testid={isThumb ? undefined : "link-back-to-start"}
              onClick={() => goTo(0)}
            >
              Back to the cover
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => window.print()}
            >
              Print or save as PDF
            </button>
          </p>
        </div>
      </footer>
    </Sheet>
  );
}

/* In the same order as `sections` in content.ts. */
export const pageComponents = [
  CoverPage,
  AboutPage,
  EducationPage,
  ExperiencePage,
  ProjectsPage,
  SkillsPage,
  ContactPage,
];
