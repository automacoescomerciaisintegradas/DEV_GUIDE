# DEV_GUIDE

Repositorio com guia de infraestrutura VPS e scripts de setup.

## Deploy `prod` (GitHub Actions)

Este repositorio possui o workflow:

- `.github/workflows/deploy-prod.yml`

Ele executa em:

- `push` na branch `prod`
- disparo manual em `Actions > Deploy Prod`

### Secrets necessarios

Configure em `Settings > Secrets and variables > Actions`:

- `HOST` (ex.: `185.190.143.17`)
- `USER` (ex.: `devops`)
- `KEY` (chave privada SSH usada para acessar o servidor)
- `PORT` (geralmente `22`)

### Preparo no servidor

O workflow sincroniza este repo em:

- `/projects/apps/DEV_GUIDE`

Antes do primeiro deploy, rode no servidor:

```bash
sudo mkdir -p /projects/apps
sudo chown -R devops:devops /projects
git clone <URL-DO-REPO> /projects/apps/DEV_GUIDE
cd /projects/apps/DEV_GUIDE
git checkout prod
```
