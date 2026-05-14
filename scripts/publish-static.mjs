import { ensureExists, resolvePath, run, runCapture } from './utils.mjs';

const env = process.argv[2];
if (!env || !['dev', 'prod'].includes(env)) {
  throw new Error('Usage: node ./scripts/publish-static.mjs <dev|prod>');
}

const branch = env === 'dev' ? 'site-dev' : 'site-prod';
const staticDir = resolvePath('static-site');
ensureExists(staticDir, 'Missing ./static-site directory');

const splitHash = runCapture('git', ['subtree', 'split', '--prefix', 'static-site', 'HEAD']);
if (!splitHash) {
  throw new Error('Unable to resolve split hash for static-site');
}

run('git', ['push', '-f', 'origin', `${splitHash}:refs/heads/${branch}`]);

console.log(`[publish:${env}] Published static-site to origin/${branch}`);

