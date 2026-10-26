/*
 * What each object in the room opens: the About, Education, Experience,
 * Achievements and Contact sections (the same sections make up the plain
 * text version of the site), plus the hidden section behind the football.
 */
import { type ReactNode, useRef } from "react";
import { Clock } from "@/components/effects";
import { ArrowUpRight, Download, LinkedIn, Mail, Pin } from "@/components/icons";
import { CopyButton, MagneticButton, Odometer, Reserved, Rich } from "@/components/ui";
import {
  about,
  achievements,
  achievementsHeadline,
  caseStudy,
  certifications,
  contact,
  easterEgg,
  education,
  experience,
  experienceHeadline,
  experienceIntro,
  focusAreas,
  headings,
  highlights,
  profile,
  projects,
  projectsIntro,
  reading,
  skills,
} from "@/content";
import { parseFigure } from "@/motion";
import { type RouteId, assetUrl, routes } from "@/router";

export type SectionId = Exclude<RouteId, "home">;
export type SectionMode = "open" | "scroll";

const pad = (n: number) => String(n).padStart(2, "0");
const metaLine = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" · ");

/* The heading at the top of every section: number, name, the object it lives on, and a big title. */
function Head({ id, title, idPrefix }: { id: SectionId; title: string; idPrefix: string }) {
  const index = routes.findIndex((item) => item.id === id);
  const route = routes[index];
  return (
    <header className="sec-head" data-reveal>
      <p className="sec-kicker">
        <span className="sec-num">{pad(index)}</span> {route.label}
        <span className="sec-object"> · {route.object}</span>
      </p>
      <h2 className="sec-title" id={`${idPrefix}${id}-title`} tabIndex={-1}>
        <Rich text={title} />
      </h2>
    </header>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return (
    <h3 className="sec-sub" data-reveal>
      {children}
    </h3>
  );
}

/* ------------------------------------------------------------------ about */

function AboutSection({ mode, idPrefix }: { mode: SectionMode; idPrefix: string }) {
  return (
    <>
      <Head id="about" title={about.headline} idPrefix={idPrefix} />
      <div className="sec-intro" data-reveal>
        <figure className={`avatar${profile.photo ? "" : " is-placeholder"}`}>
          {profile.photo ? (
            <img src={assetUrl(profile.photo)} alt={profile.photoAlt} loading="lazy" decoding="async" />
          ) : (
            <span aria-hidden="true">{profile.initials}</span>
          )}
        </figure>
        <p className="sec-lede">{about.lede}</p>
      </div>
      {profile.statement ? (
        <blockquote className="sec-quote" data-reveal>
          <Rich text={profile.statement} />
        </blockquote>
      ) : null}
      {about.paragraphs.map((paragraph) => (
        <p className="sec-text" data-reveal key={paragraph}>
          {paragraph}
        </p>
      ))}
      {about.facts.length ? (
        <dl className="facts" data-reveal>
          {about.facts.map((fact) => (
            <div className="fact" key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {reading.title ? (
        <div className="reading" data-reveal>
          <span className="reading-cover" aria-hidden="true">
            <span className="reading-cover-title">{reading.title}</span>
            {reading.author ? <span className="reading-cover-author">{reading.author}</span> : null}
          </span>
          <div className="reading-body">
            <p className="mono">
              <span className="live-dot" aria-hidden="true" /> Currently reading
            </p>
            <p className="reading-title">{reading.title}</p>
            {reading.author ? <p className="reading-author">by {reading.author}</p> : null}
          </div>
        </div>
      ) : null}

      {highlights.length ? (
        <>
          <Sub>{headings.highlights}</Sub>
          <ul className="figures">
            {highlights.map((item) => (
              <li className="figure-tile" data-reveal key={item.label}>
                <p className="figure-top">
                  <span className="figure-code">{item.code || item.label}</span>
                  {item.change ? <span className="figure-chg">{item.change}</span> : null}
                </p>
                <p className="figure-value">
                  <Odometer value={item.value} prefix={item.prefix} suffix={item.suffix} mode={mode} />
                </p>
                <p className="figure-label">{item.label}</p>
                {item.detail ? <p className="figure-detail">{item.detail}</p> : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {focusAreas.length ? (
        <>
          <Sub>{headings.focus}</Sub>
          <ol className="focus-list">
            {focusAreas.map((area, index) => (
              <li className="focus-row" data-reveal key={area.title}>
                <span className="focus-num">{pad(index + 1)}</span>
                <div>
                  <h4 className="focus-title">{area.title}</h4>
                  {area.text ? <p className="focus-text">{area.text}</p> : null}
                  {area.tags.length ? (
                    <ul className="tag-list">
                      {area.tags.map((tag) => (
                        <li className="tag" key={tag}>
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : null}

      {skills.length ? (
        <>
          <Sub>{headings.skills}</Sub>
          <div className="skill-groups">
            {skills.map((group) => (
              <section className="skill-group" data-reveal key={group.group} aria-label={group.group}>
                <h4 className="skill-title">{group.group}</h4>
                <ul className="skill-list">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------- education */

function EducationSection({ mode, idPrefix }: { mode: SectionMode; idPrefix: string }) {
  return (
    <>
      <Head id="education" title={headings.education} idPrefix={idPrefix} />
      <ol className="ledger">
        {education.map((row) => (
          <li className={`ledger-row${row.subRow ? " is-sub" : ""}`} data-reveal key={`${row.years}-${row.institution}`}>
            <div className="ledger-top">
              <p className="ledger-years">{row.years}</p>
              {row.result?.figure || row.result?.note ? (
                <div className="ledger-result">
                  {row.result.figure ? (
                    <p className={`ledger-figure${row.highlight ? " is-highlight" : ""}`}>
                      <Odometer value={row.result.figure} suffix={row.result.unit} mode={mode} />
                    </p>
                  ) : null}
                  {row.result.note ? <p className="ledger-note">{row.result.note}</p> : null}
                </div>
              ) : null}
            </div>
            <h3 className="ledger-title">{row.institution}</h3>
            <p className="ledger-qual">{row.qualification}</p>
            {row.courses?.items.length ? (
              <div className="courses">
                {row.courses.label ? <p className="courses-label">{row.courses.label}</p> : null}
                <ul className="tag-list">
                  {row.courses.items.map((course) => (
                    <li className="tag" key={course}>
                      {course}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </>
  );
}

/* ------------------------------------------------------------- experience */

function ExperienceSection({ idPrefix }: { idPrefix: string }) {
  return (
    <>
      <Head id="experience" title={experienceHeadline} idPrefix={idPrefix} />
      <Sub>{headings.roles}</Sub>
      {experienceIntro ? (
        <p className="sec-note" data-reveal>
          {experienceIntro}
        </p>
      ) : null}
      <ol className="stack">
        {experience.map((entry, index) =>
          entry.open ? (
            <Reserved key={`open-${index}`} label={entry.reservedFor} />
          ) : (
            <li className="role" data-reveal key={`${entry.title}-${index}`}>
              <div className="role-top">
                {entry.dates ? <p className="mono">{entry.dates}</p> : null}
                {/present/i.test(entry.dates ?? "") ? (
                  <p className="status">
                    <span className="live-dot" aria-hidden="true" /> Current
                  </p>
                ) : null}
              </div>
              <h3 className="role-title">{entry.title}</h3>
              <p className="role-org">{entry.org}</p>
              {entry.points.length ? (
                <ul className="point-list">
                  {entry.points.map((point, pointIndex) => (
                    <li key={`${point}-${pointIndex}`}>{point}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ),
        )}
      </ol>

      <Sub>{headings.projects}</Sub>
      {projectsIntro ? (
        <p className="sec-note" data-reveal>
          {projectsIntro}
        </p>
      ) : null}
      <ol className="stack">
        {projects.map((entry, index) =>
          entry.open ? (
            <Reserved key={`open-${index}`} label={entry.reservedFor} />
          ) : (
            <li className="role" data-reveal key={`${entry.title}-${index}`}>
              <div className="role-top">
                {entry.dates ? <p className="mono">{entry.dates}</p> : null}
                {entry.result ? <p className="role-result">{entry.result}</p> : null}
              </div>
              <h3 className="role-title">{entry.title}</h3>
              <p className="role-org">{entry.context}</p>
              {entry.summary ? <p className="sec-text">{entry.summary}</p> : null}
              {entry.points.length ? (
                <ul className="point-list">
                  {entry.points.map((point, pointIndex) => (
                    <li key={`${point}-${pointIndex}`}>{point}</li>
                  ))}
                </ul>
              ) : null}
              {entry.skills || entry.link ? (
                <div className="card-foot">
                  {entry.skills ? (
                    <p className="card-skills">
                      <span>Skills used</span> {entry.skills}
                    </p>
                  ) : null}
                  {entry.link ? (
                    <a className="link-arrow" href={entry.link.url} target="_blank" rel="noopener noreferrer">
                      {entry.link.label} <ArrowUpRight />
                    </a>
                  ) : null}
                </div>
              ) : null}
            </li>
          ),
        )}
      </ol>

      <aside className={`case-study${caseStudy.open ? " is-open" : ""}`} data-reveal aria-label={caseStudy.kicker}>
        <p className="mono">{caseStudy.kicker}</p>
        <h3 className="case-title">{caseStudy.open ? `Reserved for ${caseStudy.reservedFor}` : caseStudy.title}</h3>
        {!caseStudy.open && caseStudy.summary ? <p className="sec-text">{caseStudy.summary}</p> : null}
        {caseStudy.steps.length ? (
          <ol className="case-steps">
            {caseStudy.steps.map((step, index) => (
              <li key={step.label}>
                <span className="case-step-num">{pad(index + 1)}</span>
                <span className="case-step-label">{step.label}</span>
                {caseStudy.open ? <span className="case-step-blank" aria-hidden="true" /> : <p className="sec-text">{step.text}</p>}
              </li>
            ))}
          </ol>
        ) : null}
      </aside>
    </>
  );
}

/* ----------------------------------------------------------- achievements */

function AchievementsSection({ mode, idPrefix }: { mode: SectionMode; idPrefix: string }) {
  const featured = achievements.find((entry) => !entry.open && entry.figure && parseFigure(entry.figure).animatable);
  const rest = achievements.filter((entry) => entry !== featured);
  return (
    <>
      <Head id="achievements" title={achievementsHeadline} idPrefix={idPrefix} />
      {featured && !featured.open ? (
        <div className="featured" data-reveal>
          <p className="featured-figure">
            <Odometer value={featured.figure ?? ""} mode={mode} />
          </p>
          <div className="featured-body">
            {featured.note ? <p className="featured-note">{featured.note}</p> : null}
            <p className="featured-title">{featured.title}</p>
            <p className="mono">{metaLine(featured.context, featured.date)}</p>
            {featured.text ? <p className="sec-text">{featured.text}</p> : null}
          </div>
        </div>
      ) : null}

      {rest.length ? (
        <>
          <Sub>{headings.achievements}</Sub>
          <ul className="stack">
            {rest.map((entry, index) =>
              entry.open ? (
                <Reserved key={`open-${index}`} label={entry.reservedFor} />
              ) : (
                <li className="role" data-reveal key={`${entry.title}-${index}`}>
                  <p className="mono">{metaLine(entry.context, entry.date) || "Achievement"}</p>
                  {entry.figure ? (
                    <p className="role-result">
                      {entry.figure}
                      {entry.note ? <span> {entry.note}</span> : null}
                    </p>
                  ) : null}
                  <h3 className="role-title">{entry.title}</h3>
                  {entry.text ? <p className="sec-text">{entry.text}</p> : null}
                </li>
              ),
            )}
          </ul>
        </>
      ) : null}

      {certifications.length ? (
        <>
          <Sub>{headings.certifications}</Sub>
          <ul className="stack">
            {certifications.map((entry, index) =>
              entry.open ? (
                <Reserved key={`open-${index}`} label={entry.reservedFor} />
              ) : (
                <li className="role role-cert" data-reveal key={`${entry.title}-${index}`}>
                  <span className="cert-seal" aria-hidden="true">
                    ✓
                  </span>
                  <p className="mono">{metaLine(entry.issuer, entry.date) || "Certificate"}</p>
                  <h3 className="role-title">{entry.title}</h3>
                  {entry.summary ? <p className="sec-text">{entry.summary}</p> : null}
                  {entry.skills || entry.link ? (
                    <div className="card-foot">
                      {entry.skills ? (
                        <p className="card-skills">
                          <span>Skills</span> {entry.skills}
                        </p>
                      ) : null}
                      {entry.link ? (
                        <a className="link-arrow" href={entry.link.url} target="_blank" rel="noopener noreferrer">
                          {entry.link.label} <ArrowUpRight />
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ),
            )}
          </ul>
        </>
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------- contact */

function ContactSection({ idPrefix }: { idPrefix: string }) {
  return (
    <>
      <Head id="contact" title={contact.headline} idPrefix={idPrefix} />
      {contact.text ? (
        <p className="sec-lede" data-reveal>
          {contact.text}
        </p>
      ) : null}
      <div className="contact-email" data-reveal>
        <p className="mono">
          <Mail /> Email
        </p>
        <a className="contact-email-link" href={`mailto:${contact.email}`}>
          {contact.email}
        </a>
        <CopyButton text={contact.email} label="Copy address" />
      </div>
      <div className="contact-actions" data-reveal>
        {contact.cvFile ? (
          <MagneticButton href={assetUrl(contact.cvFile)} download>
            Download CV <Download />
          </MagneticButton>
        ) : null}
        {contact.linkedinUrl ? (
          <MagneticButton href={contact.linkedinUrl} look="secondary" target="_blank" rel="noopener noreferrer">
            LinkedIn <ArrowUpRight />
          </MagneticButton>
        ) : null}
      </div>
      <dl className="facts" data-reveal>
        {contact.linkedinUrl ? (
          <div className="fact">
            <dt>
              <LinkedIn /> LinkedIn
            </dt>
            <dd>
              <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">
                {contact.linkedinLabel}
              </a>
            </dd>
          </div>
        ) : null}
        {contact.location ? (
          <div className="fact">
            <dt>
              <Pin /> Based in
            </dt>
            <dd>{contact.location}</dd>
          </div>
        ) : null}
        <div className="fact">
          <dt>Local time</dt>
          <dd>
            <Clock prefix="" />
          </dd>
        </div>
      </dl>
    </>
  );
}

/* ------------------------------------------------------------- easter egg */

function EasterSection({ idPrefix }: { idPrefix: string }) {
  return (
    <>
      <header className="sec-head" data-reveal>
        <p className="sec-kicker">
          <span className="sec-num">★</span> {easterEgg.kicker}
        </p>
        <h2 className="sec-title" id={`${idPrefix}easter-title`} tabIndex={-1}>
          <Rich text={easterEgg.headline} />
        </h2>
      </header>
      {easterEgg.intro ? (
        <p className="sec-lede" data-reveal>
          {easterEgg.intro}
        </p>
      ) : null}
      <ul className="egg-list">
        {easterEgg.items.map((item, index) => (
          <li className={`egg egg-theme-${item.theme ?? "plain"}`} data-reveal key={`${item.title}-${index}`}>
            {item.theme === "arsenal" ? <span className="egg-stripes" aria-hidden="true" /> : null}
            {item.theme === "record" ? (
              <span className="egg-seal" aria-hidden="true">
                <span>World</span>
                <strong>№1</strong>
                <span>Record</span>
              </span>
            ) : null}
            {item.tag ? <p className="egg-tag">{item.tag}</p> : null}
            <h3 className="egg-title">{item.title}</h3>
            {item.record ? <p className="egg-quote">“{item.record}”</p> : null}
            {item.issuer || item.date ? <p className="egg-meta">{metaLine(item.issuer, item.date)}</p> : null}
            {item.text ? <p className="egg-text">{item.text}</p> : null}
            {item.link ? (
              <a className="link-arrow" href={item.link.url} target="_blank" rel="noopener noreferrer">
                {item.link.label} <ArrowUpRight />
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}

/* ------------------------------------------------------------------ index */

export const sectionIds: SectionId[] = ["about", "education", "experience", "achievements", "contact"];

export function Section({ id, mode, idPrefix = "" }: { id: SectionId; mode: SectionMode; idPrefix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const body = {
    about: <AboutSection mode={mode} idPrefix={idPrefix} />,
    education: <EducationSection mode={mode} idPrefix={idPrefix} />,
    experience: <ExperienceSection idPrefix={idPrefix} />,
    achievements: <AchievementsSection mode={mode} idPrefix={idPrefix} />,
    contact: <ContactSection idPrefix={idPrefix} />,
    easter: <EasterSection idPrefix={idPrefix} />,
  }[id];
  return (
    <div className="sec" ref={ref} data-section={id}>
      {body}
    </div>
  );
}
