import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const rootDir = process.cwd();

export function ensureExists(targetPath, message) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(message || `Path not found: ${targetPath}`);
  }
}

export function run(cmd, args, options = {}) {
  const cwd = options.cwd || rootDir;
  const res = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')} (cwd=${cwd})`);
  }
}

export function runCapture(cmd, args, options = {}) {
  const cwd = options.cwd || rootDir;
  const res = spawnSync(cmd, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf-8',
    shell: false,
  });

  if (res.status !== 0) {
    throw new Error(
      `Command failed: ${cmd} ${args.join(' ')}\n${res.stderr || ''}`.trim(),
    );
  }

  return (res.stdout || '').trim();
}

export function cleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

export function copyRecursive(src, dest) {
  ensureExists(src, `Source path does not exist: ${src}`);
  fs.cpSync(src, dest, { recursive: true, force: true });
}

export function resolvePath(...parts) {
  return path.resolve(rootDir, ...parts);
}

