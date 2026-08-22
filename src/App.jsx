import { useEffect, useRef } from "react";
import { SkipLink, SiteHeader, SiteFooter, SectionHead } from "./components/SiteChrome.jsx";
import { CASE_STUDIES, ART, PERSON } from "./site.js";

const CHIPS = [
  "2× company hackathon winner",
  "Team MVP three years running",
  "MS Computer Science (AI/ML), in progress",
  "Azure AI Foundry · .NET · PyTorch",
];

const LAB = [
  {
    title: "Bird image classifier",
    meta: "CUB-200-2011 · ResNet-18 · linear probe",
    body: "A frozen ImageNet backbone with only the final layer trained, three epochs: 55.19% top-1 across 200 species against a 0.5% random floor.",
    limit:
      "It's a baseline, not a result. Fine-tuned models on this dataset reach roughly 80%. The next step is unfreezing the backbone and adding augmentation.",
  },
  {
    title: "Birdsong baseline",
    meta: "85 species · 169 precomputed features · logistic regression",
    body: "Scored 97.82%, which was too good. Three checks showed the dataset's own split put segments of the same recording on both sides.",
    limit:
      "The number I report is ~89%, the cross-validated score. The full audit is the second case study above.",
  },
  {
    title: "Audio + image label spaces",
    meta: "Prototype",
    body: "The image model speaks CUB-200 English common names; the audio model speaks Latin species from an unrelated dataset. There is no principled mapping between them.",
    limit:
      "Currently a rule-based agreement check over a hand-written mapping, so I don't call it fusion. Real fusion needs a shared taxonomy first, then a measured comparison against the better single modality.",
  },
];

const APPROACH = [
  {
    claim: "I check my own results before anyone else has to.",
    where: "The 97.8% that turned out to be measuring recording identity.",
    href: "/work/birdsong-leakage-audit/",
  },
  {
    claim: "I test the rejection path before the happy path.",
    where: "Submitting an empty form first, so the broker proves it can detect refusal.",
    href: "/work/legacy-automation-broker/",
  },
  {
    claim: "I ground agents in facts, not inferences.",
    where: "DOM state instead of screenshots — enabled:false is a fact, greyed-out is a guess.",
    href: "/work/legacy-automation-broker/",
  },
  {
    claim: "I say what a number doesn't prove.",
    where: "Every entry in the lab below carries its own limitation.",
    href: "#lab",
  },
  {
    claim: "I keep the trace, because that's what makes a run reviewable.",
    where: "A JSON audit log written for every automated run.",
    href: "/work/legacy-automation-broker/",
  },
];

const CREDENTIALS = [
  { term: "Now", value: "Software Engineer II, Unum — Chattanooga, TN, since 2022" },
  {
    term: "Recognized",
    value:
      "Won Unum's company hackathon in 2024 and 2025 · voted MVP by my team three years running",
  },
  { term: "Studying", value: "MS Computer Science (AI/ML focus), Colorado State University Global" },
  { term: "Studied", value: "BS Computer Science, minor in Mathematics — University of Nevada, Las Vegas" },
  { term: "Also", value: "Full-stack bootcamp, 2022, returning to engineering" },
  { term: "Certified", value: "Azure Fundamentals (AZ-900) · GitHub Foundations" },
  { term: "Outside", value: "Park Steward, City of Chattanooga, since 2021" },
];

export default function App() {
  const heroSlot = useRef(null);

  useEffect(() => {
    let scene;
    let cancelled = false;
    import("./hero/index.js").then(({ mountHero }) =>
      mountHero(heroSlot.current).then((s) => {
        if (cancelled) s?.dispose();
        else scene = s;
      })
    );
    return () => {
      cancelled = true;
      scene?.dispose();
    };
  }, []);

  return (
    <>
      <SkipLink />
      <SiteHeader />

      <main id="main" className="mx-auto max-w-5xl px-6 pb-32">
        {/* ---------- Hero ---------- */}
        <section id="top" className="relative py-24 sm:py-32">
          <div
            ref={heroSlot}
            id="hero-canvas-slot"
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-6 -bottom-10 -top-16 -z-10 overflow-hidden"
          />

          <p className="label">
            {PERSON.role} · {PERSON.employer} · {PERSON.location}
          </p>

          <h1 className="mt-5 text-hero font-semibold leading-[1.06] tracking-[-0.02em]">
            I put AI into systems that <span className="text-maple">already exist</span>.
          </h1>

          <p className="measure mt-6 text-lg leading-relaxed text-muted">
            Retrieval systems and agents for software that can&rsquo;t be rewritten — plus models I
            train, and then check hard enough to catch my own mistakes.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#work"
              className="rounded-md bg-maple px-5 py-2.5 font-medium text-paper no-underline transition-opacity duration-200 hover:opacity-90"
            >
              See the work
            </a>
          </div>

          <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-2">
            {CHIPS.map((chip) => (
              <li key={chip} className="label">
                {chip}
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Work ---------- */}
        <section id="work" className="py-16">
          <SectionHead
            index="01"
            eyebrow="Selected work"
            title="Three case studies"
            dek="Written up in full, including what each one doesn't prove. Two are mine with code you can read; the third is work I can describe but not hand you."
          />

          <div className="mt-10 flex flex-col gap-5">
            {CASE_STUDIES.map((cs) => (
              <article
                key={cs.slug}
                className="rounded-md border border-rule-soft bg-surface p-6 shadow-card transition-colors duration-200 hover:border-rule sm:p-8"
              >
                <p className="label">{cs.stack}</p>
                <h3 className="mt-3 font-display text-[1.35rem] font-semibold leading-snug">
                  <a href={cs.href} className="no-underline hover:text-maple">
                    {cs.title}
                  </a>
                </h3>
                <p className="measure mt-3 text-muted">{cs.summary}</p>
                <a href={cs.href} className="label mt-5 inline-block text-maple no-underline hover:underline">
                  Read the case study →
                </a>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Lab ---------- */}
        <section id="lab" className="py-16">
          <SectionHead
            index="02"
            eyebrow="The lab"
            title="Models I trained, and what the numbers don't prove"
            dek="An image baseline, an audio baseline, and the label-space problem sitting between them."
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {LAB.map((item) => (
              <article key={item.title} className="flex flex-col gap-3 border-t border-rule pt-5">
                <div>
                  <h3 className="font-display text-[1.1rem] font-semibold leading-snug">
                    {item.title}
                  </h3>
                  <p className="label mt-1">{item.meta}</p>
                </div>
                <p className="text-[0.95rem] text-muted">{item.body}</p>
                <p className="mt-auto border-l-2 border-maple pl-3 text-[0.88rem] text-muted">
                  {item.limit}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Approach ---------- */}
        <section id="approach" className="py-16">
          <SectionHead
            index="03"
            eyebrow="How I work"
            title="Five things I actually do"
            dek="Each one links to the place on this site where I did it. Unlinked principles are just adjectives."
          />

          <ol className="mt-10 flex flex-col">
            {APPROACH.map((item) => (
              <li key={item.claim} className="border-t border-rule-soft py-5">
                <a href={item.href} className="group block no-underline">
                  <p className="font-display text-[1.15rem] font-semibold leading-snug transition-colors group-hover:text-maple">
                    {item.claim}
                  </p>
                  <p className="measure mt-1 text-[0.95rem] text-muted">{item.where}</p>
                </a>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Field notes ---------- */}
        <section id="field-notes" className="py-16">
          <SectionHead
            index="04"
            eyebrow="Field notes"
            title="I drew these birds before I trained a model to recognize them"
            dek="Park Steward with the City of Chattanooga since 2021. The datasets I reach for aren't an accident."
          />

          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ART.map((art) => (
              <li key={art.file}>
                <img
                  src={`/assets/art/${art.file}`}
                  alt={art.alt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full rounded-md border border-rule-soft object-cover"
                />
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- About ---------- */}
        <section id="about" className="py-16">
          <SectionHead index="05" eyebrow="About" title="Background" />

          <div className="mt-10 grid gap-10 sm:grid-cols-[1.3fr_1fr]">
            <div className="measure flex flex-col gap-4 text-muted">
              <p>
                I write software for an insurance company, which means most of what I work on has to
                fit alongside systems that were built long before I got there. That constraint is
                the thing I find interesting rather than the thing I put up with — it&rsquo;s where
                the actual engineering is.
              </p>
              <p>
                I&rsquo;m moving deeper into AI engineering: retrieval systems, agents that operate
                real software, and the evaluation work that tells you whether any of it is behaving.
                I train models too, mostly on birds, and I&rsquo;ve learned to distrust my own good
                results before someone else has to.
              </p>
              <p>
                I won my company&rsquo;s hackathon in 2024 and 2025, both times building on retrieval,
                and my teammates have voted me MVP three years running. I can&rsquo;t show you that
                work — it belongs to my employer — so everything on this site is my own.
              </p>
              <p>
                I studied computer science and mathematics, spent a stretch of years at home with
                my kids, and came back to the field in 2022. The years away sharpened rather than
                dulled the thing I&rsquo;m good at, which is being patient with systems that resist
                being understood.
              </p>
              <p>
                Outside of work I&rsquo;m a park steward and I draw. Both of those are older than
                the machine learning, and they&rsquo;re why the datasets on this site have feathers.
              </p>
            </div>

            <dl className="flex flex-col gap-4">
              {CREDENTIALS.map((c) => (
                <div key={c.term} className="border-t border-rule-soft pt-3">
                  <dt className="label">{c.term}</dt>
                  <dd className="mt-1 text-[0.95rem]">{c.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-12 rounded-md border border-rule-soft bg-surface p-6 shadow-card sm:p-8">
            <p className="label">Get in touch</p>
            <p className="measure mt-3 text-muted">
              I&rsquo;m open to AI engineering roles, remote or Chattanooga-based. The fastest way
              to reach me is email.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={`mailto:${PERSON.email}`}
                className="rounded-md bg-maple px-5 py-2.5 font-medium text-paper no-underline transition-opacity hover:opacity-90"
              >
                {PERSON.email}
              </a>
              <a
                href={PERSON.linkedin}
                className="rounded-md border border-rule px-5 py-2.5 no-underline transition-colors hover:border-maple hover:text-maple"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
