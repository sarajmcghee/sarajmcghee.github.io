#!/usr/bin/env node
/**
 * One-shot asset pipeline: pull the originals out of the old portfolio repo,
 * compress them to the DESIGN.md budgets, and write them into public/.
 *
 * Budgets (DESIGN.md):
 *   tree model            < 900 KB
 *   social preview image  < 200 KB
 *   any illustration      < 120 KB
 *
 * Requires: cwebp (brew install webp). gltf-transform is fetched via npx.
 * Run with: npm run assets
 */

import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const SRC = path.join(homedir(), "Documents", "New project");
const OUT = path.join(process.cwd(), "public", "assets");

const KB = (p) => (statSync(p).size / 1024).toFixed(0);
const ok = (m) => console.log(`  ✓ ${m}`);
const warn = (m) => console.log(`  ! ${m}`);

function ensure(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

function have(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/* ---------- 1. Tree model ---------- */

function buildTree() {
  console.log("\nTree model");
  const src = path.join(SRC, "public", "assets", "trees", "red_maple_hero.glb");
  if (!existsSync(src)) return warn(`source not found: ${src}`);

  const dir = ensure(path.join(OUT, "trees"));
  const out = path.join(dir, "red-maple.glb");

  console.log(`  source: ${KB(src)} KB`);
  try {
    // Meshopt over Draco: comparable ratio, much cheaper to decode, and three.js
    // ships the decoder. Texture recompression to WebP does most of the work here.
    execFileSync(
      "npx",
      ["--yes", "@gltf-transform/cli", "optimize", src, out, "--compress", "meshopt", "--texture-compress", "webp"],
      { stdio: "inherit" }
    );
    const size = Number(KB(out));
    ok(`red-maple.glb → ${size} KB ${size < 900 ? "(under budget)" : "(OVER 900 KB budget)"}`);
  } catch {
    warn("gltf-transform failed; copying the LOD1 model as a fallback");
    const lod = path.join(SRC, "public", "assets", "trees", "red_maple_lod1.glb");
    if (existsSync(lod)) {
      copyFileSync(lod, out);
      ok(`red-maple.glb (lod1 fallback) → ${KB(out)} KB`);
    }
  }
}

/* ---------- 2. Illustrations ---------- */

function buildIllustrations() {
  console.log("\nIllustrations");
  const src = path.join(SRC, "src", "assets", "instagram-art");
  if (!existsSync(src)) return warn(`source not found: ${src}`);
  if (!have("cwebp")) return warn("cwebp not installed — run: brew install webp");

  const dir = ensure(path.join(OUT, "art"));
  const files = readdirSync(src).filter((f) => /\.(jpe?g|png)$/i.test(f));

  for (const file of files) {
    const from = path.join(src, file);
    const to = path.join(dir, file.replace(/\.[^.]+$/, ".webp"));
    // 900px long edge, then step quality down until the file clears the 120 KB
    // budget. A fixed quality can't work here: the detailed graphite drawings
    // cost two to three times what the flat ink pieces do at the same setting.
    let quality = 76;
    let size;
    do {
      execFileSync("cwebp", ["-quiet", "-q", String(quality), "-resize", "900", "0", from, "-o", to]);
      size = Number(KB(to));
      quality -= 8;
    } while (size >= 120 && quality >= 44);
    console.log(
      `  ${size < 120 ? "✓" : "!"} ${path.basename(to)} ${KB(from)} → ${size} KB @ q${quality + 8}`
    );
  }
  ok(`${files.length} illustrations converted`);
}

/* ---------- 3. Social preview ---------- */

function buildSocial() {
  console.log("\nSocial preview");
  const src = path.join(SRC, "src", "assets", "king.jpg");
  if (!existsSync(src)) return warn(`source not found: ${src}`);

  const dir = ensure(path.join(OUT, "social"));
  const out = path.join(dir, "preview.jpg");

  // og:image wants 1200×630. sips keeps it a JPEG, which every scraper handles;
  // WebP is still risky for link previews.
  execFileSync("sips", ["-Z", "1200", "-s", "format", "jpeg", "-s", "formatOptions", "45", src, "--out", out], {
    stdio: "ignore",
  });
  const size = Number(KB(out));
  console.log(`  ${size < 200 ? "✓" : "!"} preview.jpg ${KB(src)} → ${size} KB`);
}

console.log("Building assets → public/assets");
buildTree();
buildIllustrations();
buildSocial();
console.log("\nDone.\n");
