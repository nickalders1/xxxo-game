#!/usr/bin/env node
/**
 * Renders the SVG icon sources at the sizes required by the PWA manifest and
 * Apple home-screen, writing PNG files to `public/icons/`.
 *
 *   node scripts/generate-icons.mjs
 *
 * Re-run this whenever you change `scripts/icons/source*.svg`.
 */

import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const iconsDir = path.join(root, "public", "icons");

const targets = [
  { source: "source.svg",          size: 192, out: "icon-192.png" },
  { source: "source.svg",          size: 512, out: "icon-512.png" },
  { source: "source.svg",          size: 180, out: "apple-touch-icon.png" },
  { source: "source-maskable.svg", size: 512, out: "icon-maskable-512.png" },
];

await mkdir(iconsDir, { recursive: true });

for (const target of targets) {
  const sourcePath = path.join(here, "icons", target.source);
  const outPath = path.join(iconsDir, target.out);
  const svg = await readFile(sourcePath);
  await sharp(svg, { density: 384 })
    .resize(target.size, target.size, { fit: "contain" })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`✓ ${target.out} (${target.size}×${target.size})`);
}

console.log(`\nDone — ${targets.length} PNG icons written to ${iconsDir}`);
