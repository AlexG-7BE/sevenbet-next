import { mkdir } from "node:fs/promises";
import { basename, resolve } from "node:path";

import sharp from "sharp";

const sources = [
  "chapter-apply.jpg",
  "hero-confidence.jpg",
  "hero-creator.jpg",
  "hero-outcome.jpg",
  "hero-plan.jpg",
];
const widths = [320, 640, 1280, 1920];
const sourceRoot = resolve("public/home");
const outputRoot = resolve(sourceRoot, "responsive");

await mkdir(outputRoot, { recursive: true });

for (const source of sources) {
  const input = resolve(sourceRoot, source);
  const stem = basename(source, ".jpg");
  for (const width of widths) {
    const pipeline = sharp(input).autoOrient().resize({ width, withoutEnlargement: true });
    await pipeline.clone().avif({ chromaSubsampling: "4:2:0", effort: 5, quality: 62 }).toFile(resolve(outputRoot, `${stem}-${width}.avif`));
    await pipeline.clone().webp({ effort: 5, quality: 82, smartSubsample: true }).toFile(resolve(outputRoot, `${stem}-${width}.webp`));
  }
}

console.log(`Generated ${sources.length * widths.length * 2} responsive Home images in ${outputRoot}`);
