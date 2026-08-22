export const PERSON = {
  name: "Sara McGhee",
  role: "Software Engineer II",
  employer: "Unum",
  location: "Chattanooga, TN",
  email: "sarajmcghee@gmail.com",
  github: "https://github.com/sarajmcghee",
  linkedin: "https://www.linkedin.com/in/sara-mcghee/",
};

export const NAV = [
  { id: "work", label: "Work", href: "/#work" },
  { id: "lab", label: "Lab", href: "/#lab" },
  { id: "approach", label: "Approach", href: "/#approach" },
  { id: "field-notes", label: "Field notes", href: "/#field-notes" },
  { id: "about", label: "About", href: "/#about" },
];

/* `repo: null` means the code isn't public yet. The card and the case study page
   both check this — the site must never link to a repository that 404s, and must
   never claim "public code" for one that doesn't exist. */
export const CASE_STUDIES = [
  {
    slug: "legacy-automation-broker",
    href: "/work/legacy-automation-broker/",
    stack: "C# · .NET 8 · Selenium · Edge IE mode",
    title: "Teaching an LLM to operate software that predates it",
    summary:
      "An agent driving a legacy ASP.NET WebForms application through Edge's IE mode — grounded in DOM state rather than screenshots, with every action verified before the next one is allowed.",
    repo: "https://github.com/sarajmcghee/LegacyAutomation",
  },
  {
    slug: "onboarding-assistant",
    href: "/work/onboarding-assistant/",
    stack: "Azure AI Foundry · Blob · AI Search · Power Platform",
    title: "Onboarding is a retrieval problem",
    summary:
      "A knowledge assistant for new billing specialists, built over a corpus that started life as Word documents and Excel workbooks. Won the company hackathon; the write-up is honest about what a demo does and doesn't prove.",
    repo: null,
  },
  {
    slug: "birdsong-leakage-audit",
    href: "/work/birdsong-leakage-audit/",
    stack: "Python · scikit-learn · evaluation",
    title: "My baseline scored 97.8%. I didn't believe it.",
    summary:
      "A logistic regression scored 97.82% on 85-way bird species classification. Three checks later, the number was real and the task wasn't. This is the audit.",
    repo: "https://github.com/sarajmcghee/research-portfolio",
  },
];

export const ART = [
  { file: "DUOWvQ3EcRL.webp", alt: "Coloured-pencil study of a belted kingfisher" },
  { file: "CIy9qYhHpPi.webp", alt: "Prismacolor kingfisher portrait" },
  { file: "CTnjhBXLtMH.webp", alt: "Graphite study of a bald eagle" },
  { file: "CTXiXNLLZav.webp", alt: "Ink study of an owl" },
  { file: "CU-s4qzrjg5.webp", alt: "Inktober blue jay" },
  { file: "CUplS_aLaQx.webp", alt: "Inktober raven" },
  { file: "DJMpq_au-ye.webp", alt: "Woodpecker study" },
  { file: "CSsVNcvrBqb.webp", alt: "Eastern bluebird drawing" },
];
