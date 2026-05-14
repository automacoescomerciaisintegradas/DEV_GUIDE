# DEV_GUIDE

Repositorio com guia de infraestrutura VPS e scripts de setup.

## Deploy estatico (HTML/CSS/JS)

### Estrutura

- `static-site/` -> codigo puro para hospedagem
- `deploy/dev` e `deploy/prod` -> pacote local gerado automaticamente

### Build local por ambiente

- `npm run deploy:dev`
- `npm run deploy:prod`

Isso gera as pastas:

- `deploy/dev`
- `deploy/prod`

### Publicacao Git sem Actions (100% funcional)

Deploy direto para branches de publicacao:

- `npm run publish:dev` -> publica `static-site/` na branch `site-dev`
- `npm run publish:prod` -> publica `static-site/` na branch `site-prod`

Esses comandos usam `git subtree split` + `git push -f`, entao a branch de deploy fica somente com arquivos estaticos na raiz.

### Promocao de branches da plataforma

Para promover features para producao da plataforma (nao estatico), use:

- `npm run publish:all`

Fluxo automatico:

1. Atualiza `gitlens` com `origin/gitlens`.
2. Faz fast-forward `gitlens -> prod` e push em `origin/prod`.
3. Faz fast-forward `prod -> main` e push em `origin/main`.

Observacoes:

- Requer worktrees em `./.worktrees/gitlens` e `./.worktrees/prod`.
- A branch `main` e promovida a partir da raiz do repositorio.
- Se houver divergencia entre branches, o script interrompe com erro para evitar merge indevido.

### Como usar na hospedagem

1. Configure o ambiente DEV para ler a branch `site-dev`.
2. Configure o ambiente PROD para ler a branch `site-prod`.

Se a hospedagem nao conecta Git direto, use o conteudo de `deploy/dev` ou `deploy/prod` e envie via painel/FTP.

## Deploy `prod` (GitHub Actions)

Este repositorio possui o workflow:

- `.github/workflows/deploy-prod.yml`

Ele executa em:

- `push` na branch `prod`
- disparo manual em `Actions > Deploy Prod`

### Secrets necessarios

Configure em `Settings > Secrets and variables > Actions`:

- `HOST` (ex.: `<VPS_HOST>`)
- `USER` (ex.: `<ADMIN_USER>`)
- `KEY` (chave privada SSH usada para acessar o servidor)
- `PORT` (geralmente `22`)

### Preparo no servidor

O workflow sincroniza este repo em:

- `/projects/apps/DEV_GUIDE`

Antes do primeiro deploy, rode no servidor:

```bash
sudo mkdir -p /projects/apps
sudo chown -R <ADMIN_USER>:<ADMIN_USER> /projects
git clone <URL-DO-REPO> /projects/apps/DEV_GUIDE
cd /projects/apps/DEV_GUIDE
git checkout prod
```
