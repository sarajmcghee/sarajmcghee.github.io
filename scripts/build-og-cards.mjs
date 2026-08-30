#!/usr/bin/env node
/**
 * Generates one 1200×630 Open Graph card per page.
 *
 * Why this exists: the first social image was a portrait photo (900×1200).
 * Scrapers want landscape at roughly 1.91:1, so LinkedIn refused it and asked
 * for a manual upload. Four links sharing one image also meant four identical
 * thumbnails in a Featured row.
 *
 * Cards are rendered from HTML through headless Chrome so they use the same
 * type and palette as the site. Run with: npm run og
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = path.join(process.cwd(), "public", "assets", "social");
const TMP = path.join(process.cwd(), ".og-tmp");

const CARDS = [
  {
    file: "home.jpg",
    eyebrow: "Sara McGhee · Software Engineer",
    title: "I put AI into systems that <em>already exist</em>.",
    foot: "Retrieval · agents · evaluation",
  },
  {
    file: "legacy-broker.jpg",
    eyebrow: "Case study · C# · Edge IE mode",
    title: "Teaching an LLM to operate software that <em>predates it</em>",
    foot: "DOM state, not screenshots",
  },
  {
    file: "onboarding.jpg",
    eyebrow: "Case study · Hackathon winner 2025",
    title: "Onboarding is a <em>retrieval problem</em>",
    foot: "Azure AI Foundry · Blob · AI Search",
  },
  {
    file: "podcastlens.jpg",
    eyebrow: "Case study · AWS · serverless",
    title: "The bill is a <em>failure mode</em>",
    foot: "Lambda · Transcribe · CloudFormation",
  },
  {
    file: "leakage-audit.jpg",
    eyebrow: "Case study · Python · evaluation",
    title: "My baseline scored 97.8%. <em>I didn't believe it.</em>",
    foot: "A leakage audit of my own result",
  },
];

/* The same small rotated quads the site's hero uses as falling leaves, so the
   card and the page share a motif rather than each inventing one. Positions are
   from a seeded PRNG: identical every run, so cards don't churn in git. */
function leaves() {
  let seed = 20260822;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const tones = ["#a8322b", "#c4693f", "#7c6a54"];
  let out = '<div class="leaves">';
  for (let i = 0; i < 34; i++) {
    const x = 56 + rand() * 46;          // right side only, clear of the text
    const y = rand() * 96;
    const size = 9 + rand() * 13;
    const rot = rand() * 360;
    const tone = tones[Math.floor(rand() * tones.length)];
    const alpha = 0.16 + rand() * 0.3;
    out += `<i style="left:${x}%;top:${y}%;width:${size}px;height:${size * 1.35}px;` +
           `background:${tone};opacity:${alpha.toFixed(2)};transform:rotate(${rot.toFixed(0)}deg)"></i>`;
  }
  return out + "</div>";
}

const template = ({ eyebrow, title, foot }) => `<!doctype html>
<html><head><meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500&display=swap" />
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: #f1f3ee; color: #12211c;
    font-family: "IBM Plex Mono", monospace;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 64px 72px; position: relative;
  }
  .leaves { position: absolute; inset: 0; overflow: hidden; }
  .leaves i {
    position: absolute; display: block; border-radius: 1.5px;
  }
  .eyebrow {
    font-size: 20px; letter-spacing: 0.16em; text-transform: uppercase;
    color: #a8322b; position: relative;
  }
  h1 {
    font-family: "Fraunces", Georgia, serif; font-weight: 600;
    font-size: 74px; line-height: 1.06; letter-spacing: -0.02em;
    max-width: 15ch; position: relative; text-wrap: balance;
  }
  h1 em { font-style: normal; color: #a8322b; }
  .foot {
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 19px; letter-spacing: 0.08em; color: #55625a;
    border-top: 2px solid #12211c; padding-top: 18px; position: relative;
  }
  .foot .url { color: #12211c; }
</style></head>
<body>
${leaves()}
  <p class="eyebrow">${eyebrow}</p>
  <h1>${title}</h1>
  <div class="foot"><span>${foot}</span><span class="url">sarajmcghee.github.io</span></div>
</body></html>`;

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

console.log("Building Open Graph cards → public/assets/social\n");

for (const card of CARDS) {
  const html = path.join(TMP, card.file.replace(".jpg", ".html"));
  const png = path.join(TMP, card.file.replace(".jpg", ".png"));
  const jpg = path.join(OUT, card.file);

  writeFileSync(html, template(card));

  execFileSync(
    CHROME,
    [
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=1200,630",
      "--virtual-time-budget=8000",
      `--screenshot=${png}`,
      `file://${html}`,
    ],
    { stdio: "ignore" }
  );

  // JPEG, not PNG: scrapers handle it universally and it's a fraction of the size.
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "72", png, "--out", jpg], {
    stdio: "ignore",
  });

  const kb = (statSync(jpg).size / 1024).toFixed(0);
  const dims = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", jpg])
    .toString()
    .match(/pixelWidth: (\d+)[\s\S]*pixelHeight: (\d+)/);
  console.log(`  ✓ ${card.file}  ${dims[1]}×${dims[2]}  ${kb} KB`);
}

rmSync(TMP, { recursive: true, force: true });
console.log("\nDone.\n");
