import {
  extractUsername,
  compactNumber,
  languageSummary,
  topRepositories,
} from './src/core.js';

const els = {
  form: document.getElementById('searchForm'),
  input: document.getElementById('usernameInput'),
  status: document.getElementById('status'),
  portfolio: document.getElementById('portfolio'),
  hero: document.getElementById('heroCard'),
  stats: document.getElementById('statsCard'),
  languages: document.getElementById('languagesCard'),
  repos: document.getElementById('reposCard'),
  copyLinkBtn: document.getElementById('copyLinkBtn'),
  exportBtn: document.getElementById('exportBtn'),
  themeSelect: document.getElementById('themeSelect'),
};

const apiHeaders = {
  Accept: 'application/vnd.github+json',
};

function setStatus(message, type = '') {
  els.status.textContent = message;
  els.status.className = `status ${type}`.trim();
}

function withFallback(value, fallback = 'N/A') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function renderProfile(user, repos) {
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
  const mainRepos = topRepositories(repos, 6);
  const langs = languageSummary(repos).slice(0, 6);

  els.hero.innerHTML = `
    <div class="hero-top">
      <img class="avatar" src="${user.avatar_url}" alt="Avatar de ${user.login}" />
      <div class="meta">
        <h2>${withFallback(user.name, user.login)}</h2>
        <div class="handle">@${user.login}</div>
        <div class="bio">${withFallback(user.bio, 'Sem bio publica.')}</div>
      </div>
    </div>
    <div class="pills">
      <span class="pill">${withFallback(user.location, 'Local nao informado')}</span>
      <span class="pill">Conta criada em ${new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
      <span class="pill">${withFallback(user.company, 'Sem empresa')}</span>
    </div>
  `;

  els.stats.innerHTML = `
    <h3>Resumo</h3>
    <div class="stat-grid">
      <div class="metric"><span class="label">Repos publicos</span><strong>${compactNumber(user.public_repos)}</strong></div>
      <div class="metric"><span class="label">Seguidores</span><strong>${compactNumber(user.followers)}</strong></div>
      <div class="metric"><span class="label">Stars totais</span><strong>${compactNumber(totalStars)}</strong></div>
      <div class="metric"><span class="label">Forks totais</span><strong>${compactNumber(totalForks)}</strong></div>
    </div>
  `;

  els.languages.innerHTML = `
    <h3>Linguagens</h3>
    <div class="lang-list">
      ${langs
        .map((l) => `<div class="lang-item"><span>${l.name}</span><strong>${l.count}</strong></div>`)
        .join('')}
    </div>
  `;

  els.repos.innerHTML = `
    <h3>Repositorios em destaque</h3>
    <div class="repo-list">
      ${mainRepos
        .map(
          (r) => `
          <div class="repo-item">
            <a href="${r.html_url}" target="_blank" rel="noopener noreferrer">${r.name}</a>
            <span class="repo-meta">★ ${compactNumber(r.stargazers_count || 0)} | Forks ${compactNumber(r.forks_count || 0)}</span>
          </div>
        `,
        )
        .join('')}
    </div>
  `;
}

async function fetchGitHubProfile(username) {
  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, { headers: apiHeaders }),
    fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers: apiHeaders }),
  ]);

  if (!userRes.ok) {
    if (userRes.status === 404) throw new Error('Perfil nao encontrado no GitHub.');
    throw new Error(`Erro ao buscar perfil (${userRes.status}).`);
  }

  if (!reposRes.ok) {
    throw new Error(`Erro ao buscar repositorios (${reposRes.status}).`);
  }

  const user = await userRes.json();
  const repos = await reposRes.json();

  return { user, repos };
}

async function handleSubmit(event) {
  event.preventDefault();

  const username = extractUsername(els.input.value);
  if (!username) {
    setStatus('Informe um username valido.', 'error');
    return;
  }

  setStatus('Buscando dados no GitHub...');
  els.portfolio.classList.add('hidden');

  try {
    const { user, repos } = await fetchGitHubProfile(username);
    renderProfile(user, repos);
    els.portfolio.classList.remove('hidden');

    const url = new URL(window.location.href);
    url.searchParams.set('u', username);
    history.replaceState({}, '', url);

    setStatus(`Portfolio de @${username} gerado com sucesso.`, 'ok');
  } catch (error) {
    setStatus(error.message || 'Falha ao gerar portfolio.', 'error');
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    setStatus('Link copiado para a area de transferencia.', 'ok');
  } catch {
    setStatus('Nao foi possivel copiar o link.', 'error');
  }
}

async function exportPng() {
  if (els.portfolio.classList.contains('hidden')) {
    setStatus('Gere um portfolio antes de exportar.', 'error');
    return;
  }

  const node = els.portfolio;
  const canvas = await window.html2canvas(node, {
    backgroundColor: null,
    scale: 2,
  });

  const link = document.createElement('a');
  link.download = 'repo-canvas.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  setStatus('Exportacao concluida.', 'ok');
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem('repo-canvas-theme', theme);
}

function loadFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('u');
  if (fromQuery) {
    els.input.value = fromQuery;
    els.form.requestSubmit();
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('repo-canvas-theme') || 'bento';
  els.themeSelect.value = savedTheme;
  applyTheme(savedTheme);
}

els.form.addEventListener('submit', handleSubmit);
els.copyLinkBtn.addEventListener('click', copyLink);
els.exportBtn.addEventListener('click', exportPng);
els.themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));

initTheme();
loadFromQuery();
