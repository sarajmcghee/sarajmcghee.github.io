import ThemeToggle from "./components/ThemeToggle.jsx";

/* Phase B: foundation + shell.
   Sections carry their real headings and anchors so phase C is content work,
   not layout work. Case studies are the two confirmed ones — the third slot
   is intentionally absent, not stubbed. */

const NAV = [
  { id: "work", label: "Work" },
  { id: "lab", label: "Lab" },
  { id: "approach", label: "Approach" },
  { id: "field-notes", label: "Field notes" },
  { id: "about", label: "About" },
];

const CASE_STUDIES = [
  {
    id: "legacy-broker",
    eyebrow: "C# · .NET 8 · Selenium · Edge IE mode",
    title: "Teaching an LLM to operate software that predates it",
    summary:
      "An agent driving a legacy ASP.NET WebForms application through Edge's IE mode — grounded in DOM state rather than screenshots, with every action verified before the next one is allowed.",
    href: "https://github.com/sarajmcghee/LegacyAutomation",
  },
  {
    id: "leakage-audit",
    eyebrow: "Python · scikit-learn · evaluation",
    title: "My baseline scored 97.8%. I didn't believe it.",
    summary:
      "A logistic regression scored 97.82% on 85-way bird species classification. Three checks later, the number was real and the task wasn't. This is the audit.",
    href: "https://github.com/sarajmcghee/research-portfolio",
  },
];

function SectionHead({ index, eyebrow, title, dek }) {
  return (
    <div className="rule-top flex flex-col gap-1 pt-4">
      <p className="label">
        {index} — {eyebrow}
      </p>
      <h2 className="text-h2 leading-[1.18] tracking-[-0.012em]">{title}</h2>
      {dek ? <p className="measure mt-1 text-muted">{dek}</p> : null}
    </div>
  );
}

export default function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-rule-soft bg-paper/85 backdrop-blur-md">
        <nav
          aria-label="Primary"
          className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-3"
        >
          <a href="#top" className="font-display text-[1.05rem] font-semibold no-underline">
            Sara McGhee
          </a>
          <div className="flex items-center gap-5">
            <ul className="hidden gap-5 sm:flex">
              {NAV.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="label no-underline transition-colors duration-200 hover:text-maple"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main id="main" className="mx-auto max-w-5xl px-6 pb-32">
        {/* ---------- 1. Hero ---------- */}
        <section id="top" className="relative py-24 sm:py-32">
          {/* Canvas mounts here in phase D. Text must paint without it. */}
          <div
            id="hero-canvas-slot"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          />

          <p className="label">Software Engineer II · Unum · Chattanooga, TN</p>

          <h1 className="mt-5 text-hero font-semibold leading-[1.06] tracking-[-0.02em]">
            I put AI into systems that <span className="text-maple">already exist</span>.
          </h1>

          <p className="measure mt-6 text-lg leading-relaxed text-muted">
            Retrieval systems and agents for software that can&rsquo;t be rewritten — plus models
            I train, and then check hard enough to catch my own mistakes.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#work"
              className="rounded-md bg-maple px-5 py-2.5 font-medium text-paper no-underline transition-opacity duration-200 hover:opacity-90"
            >
              See the work
            </a>
            <a
              href="/resume.pdf"
              className="rounded-md border border-rule px-5 py-2.5 no-underline transition-colors duration-200 hover:border-maple hover:text-maple"
            >
              Résumé
            </a>
          </div>

          <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-2">
            {[
              "MS Computer Science (AI/ML), in progress",
              "Azure AI Foundry · .NET · PyTorch",
              "AZ-900 · GitHub Foundations",
            ].map((chip) => (
              <li key={chip} className="label">
                {chip}
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- 2. Work ---------- */}
        <section id="work" className="py-16">
          <SectionHead
            index="01"
            eyebrow="Selected work"
            title="Two case studies"
            dek="Both are personal projects with public code, so you can check them rather than take my word for it."
          />

          <div className="mt-10 flex flex-col gap-5">
            {CASE_STUDIES.map((cs) => (
              <article
                key={cs.id}
                className="rounded-md border border-rule-soft bg-surface p-6 shadow-card sm:p-8"
              >
                <p className="label">{cs.eyebrow}</p>
                <h3 className="mt-3 font-display text-[1.35rem] font-semibold leading-snug">
                  {cs.title}
                </h3>
                <p className="measure mt-3 text-muted">{cs.summary}</p>
                <a
                  href={cs.href}
                  className="label mt-5 inline-block text-maple no-underline hover:underline"
                >
                  Read the case study →
                </a>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- 3. Lab ---------- */}
        <section id="lab" className="py-16">
          <SectionHead
            index="02"
            eyebrow="The lab"
            title="Models I trained, and what the numbers don't prove"
            dek="An image baseline, an audio baseline, and the label-space problem that sits between them."
          />
        </section>

        {/* ---------- 4. Approach ---------- */}
        <section id="approach" className="py-16">
          <SectionHead
            index="03"
            eyebrow="How I work"
            title="Five things I actually do"
            dek="Each one links to the place on this site where I did it."
          />
        </section>

        {/* ---------- 5. Field notes ---------- */}
        <section id="field-notes" className="py-16">
          <SectionHead
            index="04"
            eyebrow="Field notes"
            title="I drew these birds before I trained a model to recognize them"
            dek="Park Steward, City of Chattanooga, since 2021."
          />
        </section>

        {/* ---------- 6. About ---------- */}
        <section id="about" className="py-16">
          <SectionHead index="05" eyebrow="About" title="Background and credentials" />
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <p className="label">Chattanooga, TN · open to remote</p>
          <ul className="flex gap-5">
            <li>
              <a className="label no-underline hover:text-maple" href="mailto:sarajmcghee@gmail.com">
                Email
              </a>
            </li>
            <li>
              <a className="label no-underline hover:text-maple" href="https://github.com/sarajmcghee">
                GitHub
              </a>
            </li>
            <li>
              <a
                className="label no-underline hover:text-maple"
                href="https://www.linkedin.com/in/sara-mcghee/"
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </>
  );
}
