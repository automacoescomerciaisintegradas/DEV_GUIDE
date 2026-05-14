import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ensureExists, resolvePath, run } from './utils.mjs';

const wtGitlens = resolvePath('.worktrees', 'gitlens');
const wtProd = resolvePath('.worktrees', 'prod');
const wtMain = resolvePath('.worktrees', 'main');

function ensureWorktree(dir) {
  ensureExists(dir, `Missing worktree: ${dir}`);
  ensureExists(path.join(dir, '.git'), `Invalid worktree (no .git): ${dir}`);
}

function isAncestor(cwd, olderRef, newerRef) {
  const res = spawnSync('git', ['merge-base', '--is-ancestor', olderRef, newerRef], {
    cwd,
    stdio: 'ignore',
    shell: false,
  });
  return res.status === 0;
}

function syncGitlens() {
  run('git', ['fetch', 'origin', '--prune'], { cwd: wtGitlens });
  run('git', ['checkout', 'gitlens'], { cwd: wtGitlens });
  run('git', ['merge', '--ff-only', 'origin/gitlens'], { cwd: wtGitlens });
}

function ffGitlensToProd() {
  run('git', ['fetch', 'origin', '--prune'], { cwd: wtProd });
  run('git', ['checkout', 'prod'], { cwd: wtProd });

  if (!isAncestor(wtProd, 'prod', 'gitlens')) {
    throw new Error(
      'Branch divergence detected: prod is not ancestor of gitlens. Refusing non-FF merge.',
    );
  }

  run('git', ['merge', '--ff-only', 'gitlens'], { cwd: wtProd });
  run('git', ['push', 'origin', 'prod'], { cwd: wtProd });
}

function ffProdToMain() {
  run('git', ['fetch', 'origin', '--prune'], { cwd: wtMain });
  run('git', ['checkout', 'main'], { cwd: wtMain });

  if (!isAncestor(wtMain, 'main', 'prod')) {
    throw new Error(
      'Branch divergence detected: main is not ancestor of prod. Refusing non-FF merge.',
    );
  }

  run('git', ['merge', '--ff-only', 'prod'], { cwd: wtMain });
  run('git', ['push', 'origin', 'main'], { cwd: wtMain });
}

ensureWorktree(wtGitlens);
ensureWorktree(wtProd);
ensureWorktree(wtMain);

syncGitlens();
ffGitlensToProd();
ffProdToMain();

console.log('[publish:all] Completed.');

