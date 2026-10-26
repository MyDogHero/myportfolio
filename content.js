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
 *  Search this file for PLACEHOLDER to find everything still to fill in.
 *
 *  If something is wrong, the site still opens and shows a red notice naming
 *  the line to fix.
 * ============================================================================
 */

window.PORTFOLIO_CONTENT = {

  // ================================================================ HOME ==

  profile: {
    name: "Kaustubh Santosh Iyer",
    initials: "KSI", // shown in the navigation bar and in place of a photo
    role: "BBA (Hons.) student at T. A. Pai Management Institute, Bengaluru",
    // A short line under your name in the text version (*stars* = accent style):
    tagline: "I build the analysis that makes decisions *clearer*.",
    // Your areas in a few words, shown on the business card and monitor:
    focusLine: "Finance × Business Strategy",
    // The line under your name at the bottom of the screen:
    nameLine: "Student at T.A. Pai Management Institute",
    // The glowing neon sign above the window:
    sign: "My Portfolio",
    // The sentence shown as a quote in the About panel. Words between *stars*
    // are shown in the accent colour and italic serif.
    statement: "I study how organizations make decisions under *uncertainty*, and I build the analysis that makes those decisions *clearer*.",
    // PLACEHOLDER: your photo. Upload it into the "public" folder, then write
    // its file name here, e.g. "photo.jpg". A portrait (taller than wide)
    // looks best. Leave it as "" to show your initials instead.
    photo: "",
    photoAlt: "Portrait of Kaustubh Santosh Iyer",
  },

  // The LED ticker that runs along the wall above the window. Add or remove
  // items freely. A ▲ makes the item light up like a rising stock.
  ticker: [
    "MHT-CET 96.14 ▲ Top 4%",
    "CBSE XII 88.4% ▲",
    "CBSE X 88.2% ▲",
    "BBA (Hons.) · TAPMI Bengaluru",
    "Finance",
    "Business Strategy",
    "Sales Executive Intern · BestQ",
    "Case competition · IIM Bangalore",
    "Quiz · IIM Rohtak",
  ],

  // The "market board" of key numbers on the home page. The digits roll into
  // place when scrolled into view.
  //   code:   a short ticker-style name, in capitals
  //   value:  the number only (digits and at most one dot)
  //   suffix: anything after the number, e.g. "%"
  //   change: the small note on the right, e.g. "▲ Top 4%"
  highlights: [
    { code: "MHTCET", value: "96.14", suffix: "", label: "MHT-CET percentile", detail: "PCB, 2026. Top 4% of about 360,000 candidates", change: "▲ Top 4%" },
    { code: "CBSE-12", value: "88.4", suffix: "%", label: "CBSE Class XII", detail: "Science (PCB), Ramsheth Thakur Public School", change: "▲ 2026" },
    { code: "CBSE-10", value: "88.2", suffix: "%", label: "CBSE Class X", detail: "Global Indian International School, Whitefield", change: "▲ 2024" },
    { code: "IIM", value: "2", suffix: "", label: "IIM competitions", detail: "A case competition at IIM Bangalore and a quiz at IIM Rohtak", change: "● Case + quiz" },
  ],

  // The areas that change one at a time as visitors scroll the home page.
  // Add, remove or reorder them freely; 3 to 6 works best.
  focusAreas: [
    {
      title: "Finance",
      text: "Accounting, credit analysis and financial models: the numbers that show whether an idea holds up.",
      tags: ["Basics of Accounting", "Credit analysis", "Financial modeling"],
    },
    {
      title: "Business Strategy",
      text: "Problems that are part analysis and part judgment, where the answer depends on what you choose to weigh.",
      tags: ["Market research", "Forecasting", "Case competitions"],
    },
    {
      title: "Operations",
      text: "How organizations actually run, and where better processes and clearer data change the result.",
      tags: ["Business Mathematics", "Data analysis", "Sales pipelines"],
    },
    {
      title: "Data & Analytics",
      text: "Excel, Power BI, Tableau and SQL, used to turn raw data into forecasts and charts people can act on.",
      tags: ["Excel & Power BI", "Tableau", "SQL (basic)"],
    },
    {
      title: "Communication",
      text: "Clear writing and client presentations, so the analysis lands with the people who make the call.",
      tags: ["Business writing", "Client presentations", "Client outreach"],
    },
  ],

  // =============================================================== ABOUT ==

  about: {
    headline: "Part analysis, part judgment.", // the big title on the About page
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

  // Newest first. "result" is the number shown on the right. Leave figure ""
  // to show only the note (e.g. "In progress").
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
      highlight: true, // shows the figure in the accent colour
      subRow: true, // indented under the school above
    },
    {
      years: "2020 – 2024",
      institution: "Global Indian International School, Whitefield",
      qualification: "CBSE Class X",
      result: { figure: "88.2", unit: "%" },
    },
  ],

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

  // ========================================================== EXPERIENCE ==

  experienceHeadline: "Experience and projects.", // the big title on the page
  // The line under the "Experience" heading. Use "" to hide it.
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
  //   An open line, kept for the future:
  //     { open: true, reservedFor: "a first internship" },
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
    { open: true, reservedFor: "a role in a club, committee or organization" },
    { open: true, reservedFor: "the next role" },
  ],

  // The line under the "Projects" heading. Use "" to hide it.
  projectsIntro: "Course projects and case write-ups. The open lines are kept for what comes next.",

  // Newest first. A real project can have any of these (leave out what you
  // don't need):
  //     {
  //       title: "Project name",
  //       context: "Course, club or competition",
  //       dates: "Mon YYYY",
  //       result: "Top 10",            // shown large, like a figure
  //       summary: "One or two sentences on the problem and what you did.",
  //       points: ["A specific step or finding.", "Another one."],
  //       skills: "Excel, market sizing",
  //       link: { label: "View the deck", url: "https://..." },
  //     },
  //
  //   An open line, kept for the future:
  //     { open: true, reservedFor: "a course project" },
  projects: [
    { open: true, reservedFor: "a course project" },
    { open: true, reservedFor: "a case competition write-up" },
  ],

  // The case study panel under Projects. Keep open: true until there is a case
  // to show; then set open: false and fill in title, summary and each step.
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

  // ======================================== ACHIEVEMENTS & CERTIFICATIONS ==

  achievementsHeadline: "Results so far.", // the big title on the page

  // Newest or most important first. Each achievement can have:
  //     {
  //       title: "What it was",
  //       context: "Who ran it, or where",
  //       date: "Mon YYYY",
  //       figure: "1st",          // optional big number or rank
  //       note: "place",          // optional word after the figure
  //       text: "One sentence on what you did or achieved.",
  //     },
  //   An open line, kept for the future:
  //     { open: true, reservedFor: "the next competition result" },
  //
  // The first achievement with a number in "figure" is shown large at the top.
  achievements: [
    {
      title: "MHT-CET (PCB)",
      context: "Maharashtra Common Entrance Test",
      date: "2026",
      figure: "96.14",
      note: "percentile",
      text: "Top 4% of about 360,000 candidates.",
    },
    {
      title: "Case competition",
      context: "IIM Bangalore",
      date: "", // PLACEHOLDER: month and year, e.g. "Sep 2026"
      // PLACEHOLDER: name the competition and add your round or result.
      text: "Took part in a case competition hosted at IIM Bangalore.",
    },
    {
      title: "Quiz",
      context: "IIM Rohtak",
      date: "", // PLACEHOLDER: month and year
      // PLACEHOLDER: name the quiz and add your round or result.
      text: "Took part in a quiz hosted at IIM Rohtak.",
    },
    { open: true, reservedFor: "the next competition result" },
  ],

  // Each certification can have title, issuer, date, summary, skills and a
  // link (e.g. to the certificate). Leave the link url "" to hide the link.
  certifications: [
    {
      title: "Credit Analysis Virtual Experience",
      issuer: "Standard Chartered, via Forage",
      date: "", // PLACEHOLDER: month and year you completed it
      summary: "A simulated credit analysis exercise covering quantitative risk assessment and lending decision frameworks.",
      skills: "Credit analysis, risk assessment",
      // PLACEHOLDER: paste the link to your Forage certificate between the quotes.
      link: { label: "View certificate", url: "" },
    },
    {
      title: "McKinsey Forward Program",
      issuer: "McKinsey & Company",
      date: "", // PLACEHOLDER: month and year you joined or completed it
      summary: "McKinsey Forward Learner: McKinsey’s learning programme for early-career professionals, covering structured problem solving, communication and adaptability.",
      skills: "Problem solving, communication",
      // PLACEHOLDER: paste the link to your McKinsey Forward badge or certificate.
      link: { label: "View credential", url: "" },
    },
    { open: true, reservedFor: "the next certification" },
  ],

  // ============================================================= CONTACT ==

  contact: {
    headline: "Let’s talk.", // the big title on the Contact page
    text: "For internships, projects or a conversation about finance and strategy, email is the quickest way to reach me.",
    email: "kaustubhsantoshiyer@gmail.com",
    linkedinUrl: "https://www.linkedin.com/in/kaustubhsantoshiyer",
    linkedinLabel: "linkedin.com/in/kaustubhsantoshiyer",
    location: "Bengaluru, Karnataka",
    // PLACEHOLDER: the "Download CV" button gives this file from the "public"
    // folder. The current file is a simple starter CV made from this page's
    // text. Replace it with your own PDF (upload it with the same name, or
    // upload it under a new name and change the name here).
    cvFile: "Kaustubh-Santosh-Iyer-CV.pdf",
  },

  // =========================================================== EASTER EGG ==
  // A hidden section. It opens only when a visitor clicks the football in the
  // room; it isn't in the menu or the text version.
  easterEgg: {
    kicker: "You found the football",
    headline: "Off the *clock*.",
    intro: "A couple of things that matter to me outside the classroom.",
    items: [
      {
        tag: "Football",
        title: "Arsenal FC",
        text: "A proud Gooner. Arsenal is my club: win, lose or draw.",
        theme: "arsenal", // red and white
      },
      {
        tag: "Taekwondo",
        title: "World record holder",
        record: "Maximum students performed Taekwondo punches in 30 minutes",
        issuer: "World Records India",
        date: "", // PLACEHOLDER: the year of the record
        text: "",
        // PLACEHOLDER: paste a link to the record certificate, if there is one online.
        link: { label: "View record", url: "" },
        theme: "record",
      },
    ],
  },

  // ================================================================ MUSIC ==
  // The speaker in the room plays these songs, with a small "Now playing"
  // card that shows the song and can skip between them. Each song needs a
  // title and EITHER:
  //   youtube: the song's YouTube link. Best: an official upload from the
  //            record label's own channel (for example Saregama Music), so
  //            the label has licensed it. The video shows in the card.
  //   file:    the name of an audio file you have uploaded into the folder
  //            public/music/ (only for recordings you have permission to use).
  // Optional: credit (who made the recording and its licence, shown small in
  // the card) and creditUrl (where the licence can be checked). Recordings
  // marked "CC BY" or "CC BY-SA" must keep their credit.
  //
  //     {
  //       title: "Song title",
  //       artist: "Singer or composer",
  //       file: "music/song-name.mp3",
  //       credit: "Performer · licence",
  //       creditUrl: "https://...",
  //     },
  //
  // The songs below are free to use: public domain recordings.
  music: {
    title: "Radio KSI",
    songs: [
      {
        title: "Air on the G String",
        artist: "J. S. Bach",
        file: "music/air-on-the-g-string.mp3",
        credit: "Air Force Strings, U.S. Air Force Band · public domain",
        creditUrl: "https://commons.wikimedia.org/wiki/File:Air_-_Air_Force_Strings_-_United_States_Air_Force_Band.mp3",
      },
      {
        title: "Nocturne in E-flat, Op. 9 No. 2",
        artist: "Frédéric Chopin",
        file: "music/chopin-nocturne-op9-no2.mp3",
        credit: "Musopen · public domain (CC0)",
        creditUrl: "https://archive.org/details/musopen-chopin",
      },
    ],
  },

  // ====================================================== SECTION TITLES ==
  // The smaller titles above each section. (The big title at the top of each
  // page is set in that page's part of this file, above.)
  headings: {
    highlights: "Key figures",
    focus: "Focus areas",
    education: "Where I’ve studied.",
    skills: "Skills & tools",
    roles: "Roles",
    projects: "Projects",
    achievements: "Achievements",
    certifications: "Certifications",
  },
};
