/*
 * The portfolio's words live in content.js (a plain file anyone can edit).
 *
 * The published website loads content.js next to index.html, so it can be
 * edited without rebuilding. A copy of content.js is also bundled into the
 * app at build time: if the external file is missing or has a mistake, the
 * site falls back to that copy and shows a notice naming the problem.
 */
import builtInSource from "../content.js?raw";

export type Profile = {
  name: string;
  initials: string;
  role: string;
  tagline: string;
  focusLine: string;
  statement: string;
  photo: string;
  photoAlt: string;
};

export type Highlight = {
  code?: string;
  change?: string;
  value: string;
  prefix?: string;
  suffix?: string;
  label: string;
  detail?: string;
};

export type FocusArea = { title: string; text: string; tags: string[] };

export type About = {
  headline: string;
  lede: string;
  paragraphs: string[];
  facts: { label: string; value: string }[];
};

export type EducationRow = {
  years: string;
  institution: string;
  qualification: string;
  result?: { figure: string; unit?: string; note?: string };
  highlight?: boolean;
  subRow?: boolean;
  courses?: { label: string; items: string[] };
};

export type SkillGroup = { group: string; items: string[] };

/* A "Reserved for…" line, kept on purpose for what comes next. */
export type OpenEntry = { open: true; reservedFor: string };

export type Link = { label: string; url: string };

export type ExperienceEntry =
  | OpenEntry
  | {
      open?: false;
      title: string;
      org: string;
      dates?: string;
      points: string[];
    };

export type ProjectEntry =
  | OpenEntry
  | {
      open?: false;
      title: string;
      context: string;
      dates?: string;
      result?: string;
      summary?: string;
      points: string[];
      skills?: string;
      link?: Link;
    };

export type CaseStudy = {
  open: boolean;
  kicker: string;
  reservedFor: string;
  title: string;
  summary: string;
  steps: { label: string; text: string }[];
};

export type Achievement =
  | OpenEntry
  | {
      open?: false;
      title: string;
      context?: string;
      date?: string;
      figure?: string;
      note?: string;
      text?: string;
    };

export type Certification =
  | OpenEntry
  | {
      open?: false;
      title: string;
      issuer?: string;
      date?: string;
      summary?: string;
      skills?: string;
      link?: Link;
    };

export type Contact = {
  headline: string;
  text: string;
  email: string;
  linkedinUrl: string;
  linkedinLabel: string;
  location: string;
  cvFile: string;
};

export type Headings = {
  highlights: string;
  focus: string;
  education: string;
  skills: string;
  roles: string;
  projects: string;
  achievements: string;
  certifications: string;
};

type Content = {
  profile: Profile;
  ticker: string[];
  highlights: Highlight[];
  focusAreas: FocusArea[];
  about: About;
  education: EducationRow[];
  skills: SkillGroup[];
  experienceHeadline: string;
  experienceIntro: string;
  experience: ExperienceEntry[];
  projectsIntro: string;
  projects: ProjectEntry[];
  caseStudy: CaseStudy;
  achievementsHeadline: string;
  achievements: Achievement[];
  certifications: Certification[];
  contact: Contact;
  headings: Headings;
};

type ContentError = { line?: number; message?: string };

declare global {
  interface Window {
    PORTFOLIO_CONTENT?: unknown;
    /* Set in the single-file copy of the site (see scripts/build.mjs). */
    __PORTFOLIO_STANDALONE?: boolean;
    /* The live site's address, used by the single-file copy for the CV and photo. */
    __PORTFOLIO_SITE_URL?: string;
    __PORTFOLIO_CONTENT_ERROR?: ContentError;
  }
}

function readBuiltIn(): Partial<Content> {
  try {
    const sandbox: { PORTFOLIO_CONTENT?: Partial<Content> } = {};
    new Function("window", builtInSource)(sandbox);
    return sandbox.PORTFOLIO_CONTENT ?? {};
  } catch {
    return {};
  }
}

const builtIn = readBuiltIn();
const external =
  typeof window !== "undefined" &&
  window.PORTFOLIO_CONTENT &&
  typeof window.PORTFOLIO_CONTENT === "object"
    ? (window.PORTFOLIO_CONTENT as Partial<Content>)
    : undefined;
const source: Partial<Content> = external ?? builtIn;

/* Set when content.js failed to load because of a mistake in it. */
export const contentError: ContentError | null =
  typeof window !== "undefined" ? (window.__PORTFOLIO_CONTENT_ERROR ?? null) : null;

const list = <T,>(value: unknown, fallback: T[] = []): T[] =>
  Array.isArray(value) ? (value as T[]) : fallback;

const text = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

/* A field from the visitor's copy of content.js, or the built-in copy if it is missing. */
function pick<K extends keyof Content>(key: K): Content[K] {
  return (source[key] ?? builtIn[key]) as Content[K];
}

const link = (value: Link | undefined): Link | undefined =>
  value && text(value.url) ? { label: text(value.label, "Open link"), url: value.url } : undefined;

const profileRaw = { ...builtIn.profile, ...pick("profile") } as Partial<Profile>;
export const profile: Profile = {
  name: text(profileRaw.name),
  initials: text(profileRaw.initials),
  role: text(profileRaw.role),
  tagline: text(profileRaw.tagline),
  focusLine: text(profileRaw.focusLine),
  statement: text(profileRaw.statement),
  photo: text(profileRaw.photo),
  photoAlt: text(profileRaw.photoAlt, `Portrait of ${text(profileRaw.name)}`),
};

export const ticker: string[] = list<string>(pick("ticker")).filter(
  (item) => typeof item === "string" && item.trim(),
);

export const highlights: Highlight[] = list<Highlight>(pick("highlights")).filter(
  (item) => item && text(item.value) && text(item.label),
);

export const focusAreas: FocusArea[] = list<FocusArea>(pick("focusAreas"))
  .filter((area) => area && text(area.title))
  .map((area) => ({ title: area.title, text: text(area.text), tags: list<string>(area.tags) }));

const aboutRaw = pick("about") ?? ({} as About);
export const about: About = {
  headline: text(aboutRaw.headline, "About"),
  lede: text(aboutRaw.lede),
  paragraphs: list<string>(aboutRaw.paragraphs),
  facts: list(aboutRaw.facts),
};

export const education: EducationRow[] = list<EducationRow>(pick("education")).map(
  (row) => ({
    ...row,
    courses: row.courses
      ? { label: text(row.courses.label), items: list<string>(row.courses.items) }
      : undefined,
  }),
);

export const skills: SkillGroup[] = list<SkillGroup>(pick("skills")).map((group) => ({
  ...group,
  items: list<string>(group.items),
}));

export const experienceHeadline: string = text(pick("experienceHeadline"), "Experience.");
export const experienceIntro: string = text(pick("experienceIntro"));

export const experience: ExperienceEntry[] = list<ExperienceEntry>(pick("experience")).map(
  (entry) =>
    entry.open
      ? { open: true, reservedFor: text(entry.reservedFor, "what comes next") }
      : { ...entry, points: list<string>(entry.points) },
);

export const projectsIntro: string = text(pick("projectsIntro"));

export const projects: ProjectEntry[] = list<ProjectEntry>(pick("projects")).map((entry) =>
  entry.open
    ? { open: true, reservedFor: text(entry.reservedFor, "what comes next") }
    : { ...entry, points: list<string>(entry.points), link: link(entry.link) },
);

const caseRaw = pick("caseStudy") ?? ({} as CaseStudy);
export const caseStudy: CaseStudy = {
  open: caseRaw.open !== false,
  kicker: text(caseRaw.kicker, "Selected case study"),
  reservedFor: text(caseRaw.reservedFor, "a case study"),
  title: text(caseRaw.title),
  summary: text(caseRaw.summary),
  steps: list(caseRaw.steps),
};

export const achievementsHeadline: string = text(pick("achievementsHeadline"), "Achievements.");

export const achievements: Achievement[] = list<Achievement>(pick("achievements")).map(
  (entry) =>
    entry.open ? { open: true, reservedFor: text(entry.reservedFor, "what comes next") } : entry,
);

export const certifications: Certification[] = list<Certification>(pick("certifications")).map(
  (entry) =>
    entry.open
      ? { open: true, reservedFor: text(entry.reservedFor, "what comes next") }
      : { ...entry, link: link(entry.link) },
);

const contactRaw = { ...builtIn.contact, ...pick("contact") } as Partial<Contact>;
export const contact: Contact = {
  headline: text(contactRaw.headline, "Get in touch."),
  text: text(contactRaw.text),
  email: text(contactRaw.email),
  linkedinUrl: text(contactRaw.linkedinUrl),
  linkedinLabel: text(contactRaw.linkedinLabel, "LinkedIn"),
  location: text(contactRaw.location),
  cvFile: text(contactRaw.cvFile),
};

const headingDefaults: Headings = {
  highlights: "Key figures",
  focus: "Focus areas",
  education: "Education",
  skills: "Skills",
  roles: "Roles",
  projects: "Projects",
  achievements: "Achievements",
  certifications: "Certifications",
};
const headingsRaw = (pick("headings") ?? {}) as Partial<Headings>;
export const headings: Headings = Object.fromEntries(
  Object.entries(headingDefaults).map(([key, fallback]) => [
    key,
    text(headingsRaw[key as keyof Headings], fallback),
  ]),
) as Headings;
