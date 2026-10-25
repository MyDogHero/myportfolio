/*
 * The portfolio's words live in content.js (a plain file anyone can edit).
 *
 * The published website loads content.js next to index.html, so it can be
 * edited without rebuilding. A copy of content.js is also bundled into the
 * app at build time: if the external file is missing or has a mistake, the
 * site falls back to that copy and shows a notice naming the problem.
 */
import builtInSource from "../content.js?raw";

export const sections = [
  { id: "cover", label: "Cover" },
  { id: "about", label: "About" },
  { id: "education", label: "Education" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
] as const;

export type SectionId = (typeof sections)[number]["id"];

export type Profile = {
  name: string;
  firstLine: string;
  secondLine: string;
  initials: string;
  role: string;
  statement: string;
  stampRim: string;
  stampYear: string;
};

export type About = {
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

export type ExperienceEntry =
  | { open: true; reservedFor: string; lines: number }
  | {
      open?: false;
      title: string;
      org: string;
      dates?: string;
      points?: string[];
    };

export type ProjectEntry =
  | { open: true; reservedFor: string; lines: number }
  | {
      open?: false;
      title: string;
      context: string;
      dates?: string;
      result?: string;
      summary?: string;
      points?: string[];
      skills?: string;
      link?: { label: string; url: string };
    };

export type CaseStudy = {
  open: boolean;
  kicker: string;
  reservedFor: string;
  title: string;
  summary: string;
  steps: { label: string; text: string }[];
};

export type SkillGroup = { group: string; items: string[] };

export type Contact = {
  email: string;
  linkedinUrl: string;
  linkedinLabel: string;
  location: string;
};

type Content = {
  profile: Profile;
  about: About;
  education: EducationRow[];
  experienceIntro: string;
  experience: ExperienceEntry[];
  projectsIntro: string;
  projects: ProjectEntry[];
  caseStudy: CaseStudy;
  skills: SkillGroup[];
  contact: Contact;
};

type ContentError = { line?: number; message?: string };

declare global {
  interface Window {
    PORTFOLIO_CONTENT?: unknown;
    /* Set in the single-file copy of the site (see scripts/build.mjs). */
    __PORTFOLIO_STANDALONE?: boolean;
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

function pick<K extends keyof Content>(key: K): Content[K] {
  return (source[key] ?? builtIn[key]) as Content[K];
}

export const profile: Profile = { ...builtIn.profile, ...pick("profile") };

const aboutRaw = pick("about") ?? ({} as About);
export const about: About = {
  lede: aboutRaw.lede ?? "",
  paragraphs: list<string>(aboutRaw.paragraphs),
  facts: list(aboutRaw.facts),
};

export const education: EducationRow[] = list<EducationRow>(
  pick("education"),
).map((row) => ({
  ...row,
  courses: row.courses
    ? { label: row.courses.label ?? "", items: list<string>(row.courses.items) }
    : undefined,
}));

export const experienceIntro: string = pick("experienceIntro") ?? "";

export const experience: ExperienceEntry[] = list<ExperienceEntry>(
  pick("experience"),
).map((entry) =>
  entry.open
    ? { ...entry, lines: Math.max(1, Number(entry.lines) || 2) }
    : { ...entry, points: list<string>(entry.points) },
);

export const projectsIntro: string = pick("projectsIntro") ?? "";

export const projects: ProjectEntry[] = list<ProjectEntry>(pick("projects")).map(
  (entry) =>
    entry.open
      ? { ...entry, lines: Math.max(1, Number(entry.lines) || 2) }
      : {
          ...entry,
          points: list<string>(entry.points),
          link: entry.link && entry.link.url ? entry.link : undefined,
        },
);

const caseRaw = pick("caseStudy") ?? ({} as CaseStudy);
export const caseStudy: CaseStudy = {
  open: caseRaw.open !== false,
  kicker: caseRaw.kicker ?? "Selected case study",
  reservedFor: caseRaw.reservedFor ?? "a case study",
  title: caseRaw.title ?? "",
  summary: caseRaw.summary ?? "",
  steps: list(caseRaw.steps),
};

export const skills: SkillGroup[] = list<SkillGroup>(pick("skills")).map(
  (group) => ({ ...group, items: list<string>(group.items) }),
);

export const contact: Contact = { ...builtIn.contact, ...pick("contact") } as Contact;
