# sarajmcghee.github.io

Personal site. React + Vite + Tailwind v4, deployed to GitHub Pages from `main`.

**Read [DESIGN.md](DESIGN.md) before changing anything visual.** It holds the tokens, the
reasoning behind them, and the performance budget. Tokens are defined once in `src/styles.css`
and exposed to Tailwind through `@theme inline`; components never carry raw hex values.

## Develop

```bash
npm install
npm run dev
```

## Assets

Source images and the tree model live in the old portfolio repo. `scripts/build-assets.mjs`
pulls them across and compresses them to the DESIGN.md budgets:

```bash
npm run assets
```

Requires `cwebp` (`brew install webp`); `gltf-transform` is fetched via `npx`. Illustrations
step their WebP quality down per-file until each clears 120 KB, because the detailed graphite
drawings cost two to three times what the flat ink pieces do at a fixed setting.

Current output — all under budget:

| Asset | Before | After |
|---|---|---|
| Red maple model | 3.35 MB | 503 KB |
| Social preview | 2.99 MB | 138 KB |
| 11 illustrations | 109–463 KB each | 43–119 KB each |

## Deploy

Push to `main`. `.github/workflows/deploy.yml` builds and publishes to Pages.

One-time setup on the GitHub side: **Settings → Pages → Source → GitHub Actions.**

Because the repo is named `sarajmcghee.github.io`, it serves from the domain root, so
`base` in `vite.config.js` is `/`. A differently-named repo would need `base: "/<repo>/"`.

## Status

**Phase B (foundation) — complete.** Build is green, tokens work across all three theme states,
assets are compressed, deploy workflow is in place.

**Phase C (content) — next.** Sections currently carry their real headings and anchors but no
body content. The two case studies are drafted in `src/content/case-studies/` and need to be
rendered into pages.

**Phase D (the maple)** — the hero canvas mounts into `#hero-canvas-slot` in `src/App.jsx`.
Hero text must paint without it. See the fallback ladder in the plan: WebGPU → WebGL2 with a
reduced leaf count → static poster on unsupported browsers or `prefers-reduced-motion`.

## Not on this site

Nothing about Unum's systems, data, architecture, or outcomes. Employment and awards are
résumé facts and may appear in About; the work itself does not appear at all.
