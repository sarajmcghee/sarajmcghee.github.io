import { SkipLink, SiteHeader, SiteFooter } from "./SiteChrome.jsx";

/**
 * meta: [{ term, value }]
 * repo: URL string, or null when the code isn't public. Never render a dead link.
 */
export default function CaseStudyLayout({ eyebrow, title, standfirst, meta, repo, children }) {
  return (
    <>
      <SkipLink />
      <SiteHeader compact />

      <main id="main" className="mx-auto max-w-5xl px-6 pb-28">
        <article>
          <header className="py-16 sm:py-20">
            <p className="label">{eyebrow}</p>
            <h1 className="mt-4 font-display text-[clamp(2rem,4.4vw,3.1rem)] font-semibold leading-[1.08] tracking-[-0.018em]">
              {title}
            </h1>
            <p className="measure mt-6 text-lg leading-relaxed text-muted">{standfirst}</p>

            <dl className="mt-10 grid gap-x-10 gap-y-4 border-t border-rule pt-6 sm:grid-cols-3">
              {meta.map((m) => (
                <div key={m.term}>
                  <dt className="label">{m.term}</dt>
                  <dd className="mt-1 text-[0.95rem]">{m.value}</dd>
                </div>
              ))}
            </dl>

            {repo ? (
              <a
                href={repo}
                className="label mt-8 inline-block rounded-md border border-rule px-4 py-2 no-underline transition-colors hover:border-maple hover:text-maple"
              >
                Read the code →
              </a>
            ) : null}
          </header>

          <div className="prose pb-8">{children}</div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
