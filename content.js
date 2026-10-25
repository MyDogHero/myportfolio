/*
 * ============================================================================
 *  EVERY WORD ON THE PORTFOLIO LIVES IN THIS FILE.
 * ============================================================================
 *
 *  How to update the site:
 *    On GitHub: open this file, click the pencil icon (Edit), change the text
 *    between the "double quotes", then click "Commit changes". If the Netlify
 *    site is linked to the repository, the live site updates by itself within
 *    a minute or two. (Or ask Claude Code to make the change for you.)
 *
 *    In a published website folder: this file also sits next to index.html
 *    there, and can be edited in TextEdit and the folder dragged onto
 *    Netlify's Deploys page. Copy the same change into the GitHub copy too,
 *    so the two don't drift apart.
 *
 *  Rules that keep the site working:
 *    - Text goes inside straight double quotes:  "like this"
 *      (Curly quotes “like this” break the file. In TextEdit, turn them off via
 *       Edit > Substitutions > Smart Quotes.)
 *    - Keep the commas at the end of lines, and every { [ ] } bracket.
 *    - To use a double quote inside text, write \" instead.
 *    - Lines starting with // are notes for you; the site ignores them.
 *
 *  If something is wrong, the site still opens and shows a red notice naming
 *  the line to fix.
 * ============================================================================
 */

window.PORTFOLIO_CONTENT = {

  // ---------------------------------------------------------------- COVER --
  profile: {
    name: "Kaustubh Santosh Iyer",
    // The name on the cover is split over two lines:
    firstLine: "Kaustubh",
    secondLine: "Santosh Iyer",
    initials: "KSI", // shown in the middle of the stamp
    role: "BBA (Hons.) student at T. A. Pai Management Institute, Bengaluru",
    statement: "I study how organizations make decisions under uncertainty, and I build the analysis that makes those decisions clearer.",
    // Text around the rim of the stamp, and the year in its centre:
    stampRim: "BBA (Hons.) ✦ T. A. Pai Management Institute ✦ ",
    stampYear: "2026",
  },

  // ---------------------------------------------------------------- ABOUT --
  about: {
    lede: "I’m a Business Administration student at T. A. Pai Management Institute, concentrating in Finance and Business Strategy.",
    paragraphs: [
      "My interest sits where the two meet: problems that are part analysis and part judgment.",
      "Outside coursework, I take part in quizzes (IIM Rohtak) and case competitions (IIM Bangalore). I care about clear writing, careful numbers, and decisions that hold up under scrutiny.",
    ],
    facts: [
      { label: "Studying at", value: "T. A. Pai Management Institute" },
      { label: "Based in", value: "Bengaluru, Karnataka" },
      { label: "Interests", value: "Operations and finance" },
    ],
  },

  // ------------------------------------------------------------ EDUCATION --
  // "result" is the number in the right-hand column. Leave figure "" to show
  // only the note (e.g. "In progress").
  education: [
    {
      years: "2026 – present",
      institution: "T. A. Pai Management Institute, Bengaluru",
      qualification: "Bachelor of Business Administration (Hons.)",
      result: { figure: "", note: "In progress" },
      courses: {
        label: "Semester 1 coursework",
        items: [
          "Basics of Accounting",
          "Business Mathematics",
          "Excel & Power BI",
          "Technology Literacy for Managers",
          "Language, Literature & Rhetoric",
          "Diversity, Inclusivity, and Rootedness",
        ],
      },
    },
    {
      years: "2024 – 2026",
      institution: "Ramsheth Thakur Public School, Kharghar",
      qualification: "CBSE Class XII, Science (PCB)",
      result: { figure: "88.4", unit: "%" },
    },
    {
      years: "2026",
      institution: "MHT-CET (PCB)",
      qualification: "Top 4% of about 360,000 candidates",
      result: { figure: "96.14", note: "percentile" },
      highlight: true, // red double underline under the figure
      subRow: true, // indented under the school above
    },
    {
      years: "2020 – 2024",
      institution: "Global Indian International School, Whitefield",
      qualification: "CBSE Class X",
      result: { figure: "88.2", unit: "%" },
    },
  ],

  // ----------------------------------------------------------- EXPERIENCE --
  // The italic line at the top of the page. Use "" to hide it.
  experienceIntro: "One role so far. The open lines below are kept for what comes next.",

  // Newest first. Two kinds of entry:
  //
  //   A real one:
  //     {
  //       title: "Job title",
  //       org: "Company, City",
  //       dates: "Mon YYYY – Mon YYYY",
  //       points: [
  //         "What you did and what changed because of it.",
  //         "Another point.",
  //       ],
  //     },
  //
  //   An open line, kept for the future ("lines" = how many blank lines):
  //     { open: true, reservedFor: "a first internship", lines: 3 },
  //
  // To add a new role, copy a real entry (from { to }, including the comma
  // after it), paste it at the top of the list, and change the text.
  experience: [
    {
      title: "Sales Executive Intern",
      org: "BestQ, Bengaluru",
      dates: "Oct 2026 – Present",
      points: [
        "Client outreach, lead generation and brand awareness for BestQ’s software testing and quality engineering services.",
        "Engaging prospective clients through direct communication and cold calling to build sales pipelines.",
        "Gaining practical experience in B2B growth strategy and professional client engagement.",
      ],
    },
    { open: true, reservedFor: "a role in a club, committee or organization", lines: 2 },
    { open: true, reservedFor: "the next role", lines: 2 },
  ],

  // ------------------------------------------------------------- PROJECTS --
  // The italic line at the top of the page. Use "" to hide it.
  projectsIntro: "Course projects, competitions and programmes. The open lines are kept for what comes next.",

  // Newest first. A real project can have any of these (leave out what you
  // don't need):
  //     {
  //       title: "Project name",
  //       context: "Course, club or competition",
  //       dates: "Mon YYYY",
  //       result: "Top 10",            // shown large on the right, like a figure
  //       summary: "One or two sentences on the problem and what you did.",
  //       points: ["A specific step or finding.", "Another one."],
  //       skills: "Excel, market sizing",
  //       link: { label: "View the deck", url: "https://..." },
  //     },
  //
  //   An open line, kept for the future:
  //     { open: true, reservedFor: "a course project", lines: 2 },
  projects: [
    {
      title: "Credit Analysis Virtual Experience",
      context: "Standard Chartered, via Forage",
      summary: "A simulated credit analysis exercise covering quantitative risk assessment and lending decision frameworks.",
      skills: "Credit analysis, risk assessment",
    },
    { open: true, reservedFor: "a course project", lines: 3 },
    { open: true, reservedFor: "a case competition write-up", lines: 3 },
  ],

  // The box beside Projects. Keep open: true until there is a case to show;
  // then set open: false and fill in title, summary and each step's text.
  caseStudy: {
    open: true,
    kicker: "Selected case study",
    reservedFor: "a case study",
    title: "",
    summary: "",
    steps: [
      { label: "Question", text: "" },
      { label: "Method", text: "" },
      { label: "Recommendation", text: "" },
    ],
  },

  // --------------------------------------------------------------- SKILLS --
  skills: [
    {
      group: "Analytical",
      items: ["Financial modeling", "Data analysis", "Market research", "Forecasting"],
    },
    {
      group: "Communication",
      items: ["Business writing", "Client presentations", "Cross-functional collaboration", "Corporate communications"],
    },
    {
      group: "Tools",
      items: ["Excel and Google Sheets", "PowerPoint and Google Slides", "SQL (basic)", "Tableau"],
    },
  ],

  // -------------------------------------------------------------- CONTACT --
  contact: {
    email: "kaustubhsantoshiyer@gmail.com",
    linkedinUrl: "https://www.linkedin.com/in/kaustubhsantoshiyer",
    linkedinLabel: "linkedin.com/in/kaustubhsantoshiyer",
    location: "Bengaluru, Karnataka",
  },
};
