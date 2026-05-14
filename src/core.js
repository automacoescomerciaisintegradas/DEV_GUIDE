export function extractUsername(input) {
  const value = String(input || '').trim();
  if (!value) return '';

  const noProtocol = value.replace(/^https?:\/\//i, '');
  const noDomain = noProtocol.replace(/^www\./i, '');

  if (noDomain.toLowerCase().startsWith('github.com/')) {
    return noDomain.slice('github.com/'.length).split('/')[0].replace(/^@/, '');
  }

  return noDomain.split('/')[0].replace(/^@/, '');
}

export function compactNumber(value) {
  const n = Number(value || 0);
  if (n < 1000) return String(Math.round(n));
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

export function languageSummary(repos) {
  const counter = new Map();

  for (const repo of repos || []) {
    const name = repo?.language || 'Other';
    counter.set(name, (counter.get(name) || 0) + 1);
  }

  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function topRepositories(repos, limit = 6) {
  return [...(repos || [])]
    .sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count) {
        return b.stargazers_count - a.stargazers_count;
      }
      return (b.forks_count || 0) - (a.forks_count || 0);
    })
    .slice(0, limit);
}
