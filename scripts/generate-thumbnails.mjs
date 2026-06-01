#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'public/assets/products');
const MAX_EDGE = 420;
const JPEG_QUALITY = 82;
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

function hasSips() {
  try {
    execSync('which sips', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function resizeToJpeg(input, out) {
  const sharp = (await import('sharp')).default;
  await sharp(input)
    .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(out);
}

function resizeWithSips(input, out) {
  execSync(
    `sips -Z ${MAX_EDGE} "${input}" --out "${out}" --setProperty format jpeg --setProperty formatOptions ${JPEG_QUALITY}`,
    { stdio: 'pipe' }
  );
}

function listImages(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (name === 'thumbs' || name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      out.push(...listImages(full).map((rel) => path.join(name, rel)));
    } else if (IMAGE_EXT.test(name)) {
      out.push(name);
    }
  }
  return out;
}

async function main() {
  if (!fs.existsSync(srcDir)) {
    console.error('Missing', srcDir);
    process.exit(1);
  }

  const useSips = hasSips();
  let useSharp = false;
  if (!useSips) {
    try {
      await import('sharp');
      useSharp = true;
    } catch {
      console.error('Install sharp (npm i -D sharp) or run on macOS with sips.');
      process.exit(1);
    }
  }

  const files = listImages(srcDir);
  let totalBefore = 0;
  let totalAfter = 0;
  let count = 0;

  for (const rel of files) {
    const input = path.join(srcDir, rel);
    const dir = path.dirname(rel);
    const base = path.basename(rel, path.extname(rel)) + '.jpg';
    const thumbDir = dir === '.' ? path.join(srcDir, 'thumbs') : path.join(srcDir, dir, 'thumbs');
    fs.mkdirSync(thumbDir, { recursive: true });
    const out = path.join(thumbDir, base);
    const before = fs.statSync(input).size;
    totalBefore += before;
    if (useSips) resizeWithSips(input, out);
    else await resizeToJpeg(input, out);
    totalAfter += fs.statSync(out).size;
    count += 1;
    console.log('  ✓', rel, '→', path.relative(srcDir, out));
  }

  console.log(`\n${count} thumbnails (max ${MAX_EDGE}px JPEG)`);
  console.log(`Size: ${(totalBefore / 1024 / 1024).toFixed(1)} MB → ${(totalAfter / 1024 / 1024).toFixed(1)} MB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
