#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'public/assets/products');
const thumbDir = path.join(srcDir, 'thumbs');
const MAX_EDGE = 420;
const JPEG_QUALITY = 82;

function hasSips() {
  try {
    execSync('which sips', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function withSharp(file, out) {
  const sharp = (await import('sharp')).default;
  await sharp(path.join(srcDir, file))
    .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(out);
}

function withSips(file, out) {
  const input = path.join(srcDir, file);
  execSync(
    `sips -Z ${MAX_EDGE} "${input}" --out "${out}" --setProperty format jpeg --setProperty formatOptions ${JPEG_QUALITY}`,
    { stdio: 'pipe' }
  );
}

async function main() {
  if (!fs.existsSync(srcDir)) {
    console.error('Missing', srcDir);
    process.exit(1);
  }
  fs.mkdirSync(thumbDir, { recursive: true });
  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.jpg'));
  const useSips = hasSips();
  let sharpAvailable = false;
  if (!useSips) {
    try {
      await import('sharp');
      sharpAvailable = true;
    } catch {
      console.error('Install sharp (npm i -D sharp) or run on macOS with sips.');
      process.exit(1);
    }
  }

  let totalBefore = 0;
  let totalAfter = 0;
  for (const file of files) {
    const out = path.join(thumbDir, file);
    const before = fs.statSync(path.join(srcDir, file)).size;
    totalBefore += before;
    if (useSips) withSips(file, out);
    else await withSharp(file, out);
    totalAfter += fs.statSync(out).size;
    console.log('  ✓', file);
  }
  console.log(`\n${files.length} thumbnails → public/assets/products/thumbs/`);
  console.log(`Size: ${(totalBefore / 1024 / 1024).toFixed(1)} MB → ${(totalAfter / 1024 / 1024).toFixed(1)} MB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
