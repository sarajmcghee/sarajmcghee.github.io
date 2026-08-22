import ThemeToggle from "./ThemeToggle.jsx";
import { NAV, PERSON } from "../site.js";

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
    >
      Skip to content
    </a>
  );
}

export function SiteHeader({ compact = false }) {
  return (
    <header className="sticky top-0 z-40 border-b border-rule-soft bg-paper/85 backdrop-blur-md">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-3"
      >
        <a href="/" className="font-display text-[1.05rem] font-semibold no-underline">
          {PERSON.name}
        </a>
        <div className="flex items-center gap-5">
          {compact ? (
            <a href="/#work" className="label no-underline transition-colors hover:text-maple">
              ← All work
            </a>
          ) : (
            <ul className="hidden gap-5 sm:flex">
              {NAV.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className="label no-underline transition-colors duration-200 hover:text-maple"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <p className="label">{PERSON.location} · open to remote</p>
        <ul className="flex gap-5">
          <li>
            <a className="label no-underline hover:text-maple" href={`mailto:${PERSON.email}`}>
              Email
            </a>
          </li>
          <li>
            <a className="label no-underline hover:text-maple" href={PERSON.github}>
              GitHub
            </a>
          </li>
          <li>
            <a className="label no-underline hover:text-maple" href={PERSON.linkedin}>
              LinkedIn
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}

export function SectionHead({ index, eyebrow, title, dek }) {
  return (
    <div className="rule-top flex flex-col gap-1 pt-4">
      <p className="label">
        {index} — {eyebrow}
      </p>
      <h2 className="text-h2 font-semibold leading-[1.18] tracking-[-0.012em]">{title}</h2>
      {dek ? <p className="measure mt-1 text-muted">{dek}</p> : null}
    </div>
  );
}
