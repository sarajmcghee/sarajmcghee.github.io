#!/usr/bin/env node
/**
 * Renders the hero poster — the still that stands in for the live canvas on
 * phones, on reduced-motion, and while three.js is still downloading.
 *
 * It captures the real scene rather than a hand-drawn stand-in, so the fallback
 * can't drift away from what desktop visitors see. One file per theme, with
 * alpha, swapped by media query in styles.css.
 *
 * Needs the dev server running:  npm run dev
 * Then:                          npm run poster
 */

import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = process.env.POSTER_PORT ?? "5173";
const OUT = path.join(process.cwd(), "public", "assets", "trees");

/* One poster per framing per theme. Each is rendered at roughly the hero's own
   aspect for that breakpoint, so `background-size: cover` lands it in nearly the
   same place the live canvas draws and the crossfade reads as a fade. */
const VARIANTS = [
  { framing: "desktop", w: 1040, h: 760 },
  { framing: "mobile", w: 420, h: 700 },
];

const url = (theme, framing) =>
  `http://localhost:${PORT}/poster.html?theme=${theme}&framing=${framing}`;

try {
  execFileSync("curl", ["-sf", "-o", "/dev/null", `http://localhost:${PORT}/poster.html`]);
} catch {
  console.error(`\nNo dev server on :${PORT}. Run "npm run dev" first.\n`);
  process.exit(1);
}

console.log("\nRendering hero posters\n");

for (const { framing, w, h } of VARIANTS) {
  for (const theme of ["light", "dark"]) {
    const name = `maple-poster-${framing}-${theme}`;
    const png = `/tmp/${name}.png`;
    const webp = path.join(OUT, `${name}.webp`);

    execFileSync(
      CHROME,
      [
        "--headless=new",
        "--hide-scrollbars",
        "--force-device-scale-factor=2",
        // Transparent background so one file works on either theme's ground.
        "--default-background-color=00000000",
        // Without a GPU backend the canvas renders empty.
        "--enable-unsafe-webgpu",
        "--use-angle=metal",
        `--window-size=${w},${h}`,
        "--virtual-time-budget=18000",
        `--screenshot=${png}`,
        url(theme, framing),
      ],
      { stdio: "ignore" }
    );

    if (!existsSync(png)) {
      console.error(`  ! ${name}: capture failed`);
      continue;
    }

    execFileSync("cwebp", ["-quiet", "-q", "80", "-alpha_q", "90", "-resize", String(w), "0", png, "-o", webp]);
    console.log(`  ✓ ${name}.webp  ${(statSync(webp).size / 1024).toFixed(0)} KB`);
  }
}

console.log("\nDone.\n");
