// Pre-generates responsive AVIF + WebP variants (and a compressed JPEG fallback) for the images in
// public/images, and writes src/lib/image-manifest.json so <Img> can emit srcsets.
// Run once after changing the bundled images: `pnpm images`. Outputs are committed, so Vercel does
// no image processing at build or request time.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('public/images');
const SRC_DIR = path.resolve('scripts/image-sources');
const MANIFEST = path.resolve('src/lib/image-manifest.json');

const widthsFor = (rel, width) => {
  if (rel.startsWith('hero')) return [640, 1080, 1600, 2400];
  if (rel.startsWith('products/')) return [400, 800];
  return [Math.round(width / 2), width];
};

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(jpe?g|png)$/i.test(entry.name)) yield full;
  }
}

const manifest = {};
await fs.mkdir(SRC_DIR, { recursive: true });

for await (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  // Keep pristine originals out of public/ so re-runs never compress a compressed file.
  const original = path.join(SRC_DIR, rel);
  await fs.mkdir(path.dirname(original), { recursive: true });
  try { await fs.access(original); } catch { await fs.copyFile(file, original); }

  const { width, height } = await sharp(original).metadata();
  const widths = widthsFor(rel, width).filter((w) => w <= width);
  const base = file.replace(/\.(jpe?g|png)$/i, '');
  for (const w of widths) {
    const img = sharp(original).resize({ width: w });
    await img.clone().avif({ quality: 50, effort: 6 }).toFile(`${base}-${w}.avif`);
    await img.clone().webp({ quality: 72, effort: 6 }).toFile(`${base}-${w}.webp`);
  }
  await sharp(original).resize({ width: Math.min(width, 1600) }).jpeg({ quality: 74, mozjpeg: true, progressive: true }).toFile(`${file}.tmp`);
  await fs.rename(`${file}.tmp`, file);
  manifest[`/images/${rel}`] = { w: widths, ratio: +(width / height).toFixed(4) };
}

await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`optimized ${Object.keys(manifest).length} images`);
