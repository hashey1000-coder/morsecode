import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const siteRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(siteRoot, '..');
const sourceDir = path.join(repoRoot, 'uploads');
const targetDir = path.join(siteRoot, 'public', 'wp-content', 'uploads');
const allowedExtensions = new Set([
  '.avif',
  '.bmp',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.mp3',
  '.mp4',
  '.pdf',
  '.png',
  '.svg',
  '.wav',
  '.webm',
  '.webp',
]);

mkdirSync(targetDir, { recursive: true });

if (!existsSync(sourceDir)) {
  console.log('[sync-uploads] Source uploads folder not found, keeping existing public assets.');
  process.exit(0);
}

rmSync(targetDir, { recursive: true, force: true });

function copyAllowedFiles(fromDir, toDir) {
  for (const entry of readdirSync(fromDir)) {
    const sourcePath = path.join(fromDir, entry);
    const targetPath = path.join(toDir, entry);
    const stats = statSync(sourcePath);

    if (stats.isDirectory()) {
      copyAllowedFiles(sourcePath, targetPath);
      continue;
    }

    if (!allowedExtensions.has(path.extname(entry).toLowerCase())) {
      continue;
    }

    mkdirSync(toDir, { recursive: true });
    copyFileSync(sourcePath, targetPath);
  }
}

copyAllowedFiles(sourceDir, targetDir);

console.log('[sync-uploads] Synced media uploads -> public/wp-content/uploads');
