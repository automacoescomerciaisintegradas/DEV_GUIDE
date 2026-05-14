# RepoCanvas MVP (estatico)

MVP estatico para gerar portfolio visual de perfis GitHub.

## Funcionalidades

- busca por username ou URL do GitHub
- resumo de perfil (avatar, bio, local)
- metricas (repos, seguidores, stars, forks)
- ranking de linguagens
- repositorios em destaque
- temas visuais (Bento, Minimal, Terminal)
- link compartilhavel por query (`?u=username`)
- exportacao PNG da area gerada

## Como executar

Opcao simples:

```bash
cd gitprofile-mvp
python -m http.server 8080
```

Abra:

- `http://localhost:8080`

## Testes

```bash
cd gitprofile-mvp
node --test
```

## Deploy na VPS com Traefik (Docker Compose)

1. Copie `.env.example` para `.env` e ajuste:

```bash
cp .env.example .env
```

Variaveis:

- `APP_DOMAIN`: dominio publico desse app
- `TRAEFIK_NETWORK`: rede externa usada pelo Traefik (`web`, `network_public`, etc)
- `TRAEFIK_CERTRESOLVER`: nome do resolver no Traefik

2. Suba o app:

```bash
docker compose up -d
```

3. Verifique:

```bash
docker compose ps
docker logs -f repocanvas
```

4. Acesse:

- `https://<APP_DOMAIN>`

## Observacoes

- Este MVP usa apenas API publica do GitHub.
- Existe rate limit sem token para muitas consultas seguidas.
- Branding neutro (sem nomes/dominios de terceiros).
