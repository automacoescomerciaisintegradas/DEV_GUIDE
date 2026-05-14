import { cleanDir, copyRecursive, resolvePath } from './utils.mjs';

const env = process.argv[2];
if (!env || !['dev', 'prod'].includes(env)) {
  throw new Error('Usage: node ./scripts/deploy-static.mjs <dev|prod>');
}

const sourceDir = resolvePath('static-site');
const targetDir = resolvePath('deploy', env);

cleanDir(targetDir);
copyRecursive(sourceDir, targetDir);

console.log(`[deploy:${env}] Generated ${targetDir}`);

