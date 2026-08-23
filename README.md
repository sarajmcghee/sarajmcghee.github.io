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

**Phase C (content) — complete.** Three case studies as their own pages, all home sections
written.

**Phase D (the maple) — complete.** `src/hero/` mounts a canvas into `#hero-canvas-slot`.
three.js `WebGPURenderer` with one TSL shader compiled to WGSL or GLSL depending on backend.

Test the ladder without changing machines:

| URL | Path |
|---|---|
| `/` | WebGPU where available, 2,200 leaves |
| `/?hero=webgl` | forced WebGL2 backend, 900 leaves |
| `/?hero=off` | no canvas, and three.js is never fetched |

On `prefers-reduced-motion`, Save-Data, under 4GB device memory, or a 2G connection the canvas
never mounts, and those visitors get **the poster** instead: a still of the same scene rendered
by `npm run poster` (needs `npm run dev` running). One file per theme, swapped by media query.
An inline script in `index.html` makes that call **before first paint** and stamps
`data-hero="canvas"` or `"poster"` on the root. Anyone getting the canvas never renders the
poster and never downloads it — so there is no still-to-moving swap to notice. If the canvas
later fails to build, `hero/index.js` flips the attribute and the poster appears. The width gate mounts and unmounts across the breakpoint rather than deciding
once, so maximising a narrow window brings the canvas in and dragging it narrow gives the text
column back. The canvas follows theme changes live — the leaf palette is a uniform, not a baked
constant.

Measured 120fps with a 9.8ms worst frame on both backends.

## Not on this site

Nothing about Unum's systems, data, architecture, or outcomes. Employment and awards are
résumé facts and may appear in About; the work itself does not appear at all.
