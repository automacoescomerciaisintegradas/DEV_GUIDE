# DEV_GUIDE - 1 VPS (Compose + Traefik)

Guia pratico para o seu servidor:

- Host: `<VPS_HOST>`
- Usuario admin: `<ADMIN_USER>`
- Modelo: `1 VPS`, Docker Compose, Traefik, SSL automatico

## 1) Primeira conexao e bootstrap

```bash
# local
scp setup-git-server.sh <ADMIN_USER>@<VPS_HOST>:~/
ssh <ADMIN_USER>@<VPS_HOST> "sudo bash ~/setup-git-server.sh"
```

## 2) Estrutura canonica da VPS

```text
/projects
  /apps                  # stacks docker compose
  /infra
    /traefik             # reverse proxy
  /backups
/home/<ADMIN_USER>
  /projects -> /projects # symlink
```

```bash
sudo install -d /projects/apps /projects/infra /projects/backups -m 2775 -o <ADMIN_USER> -g <ADMIN_USER>
sudo setfacl -m d:g:<ADMIN_USER>:rwx /projects
ln -sfn /projects /home/<ADMIN_USER>/projects
```

## 3) Hardening minimo

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y vim curl ca-certificates htop ufw fail2ban acl tree git

# SSH key-only (ajuste arquivo conforme seu padrao)
sudo sshd -t && sudo systemctl restart ssh

# firewall basico
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# fail2ban
sudo systemctl enable --now fail2ban
```

## 4) Usuario `git` para acesso Git via SSH (sem shell interativo)

Comandos corrigidos (flags customizadas como `--seu-usuario` estao incorretas para `adduser`):

```bash
# cria usuario de sistema para git-shell
sudo adduser \
  --system \
  --shell /usr/bin/git-shell \
  --home /home/git \
  --group \
  git || echo "Usuario git ja existe"

# estrutura base
sudo mkdir -p /home/git/repos /home/git/worktrees /home/git/.config /home/git/git-shell-commands

# bloqueio de shell interativo
cat <<'EOF' | sudo tee /home/git/git-shell-commands/no-interactive-login >/dev/null
#!/bin/sh
echo "Acesso interativo desabilitado. Apenas operacoes Git."
exit 128
EOF
sudo chmod +x /home/git/git-shell-commands/no-interactive-login

# ssh
sudo install -d -m 700 -o git -g git /home/git/.ssh
sudo install -m 600 -o git -g git /dev/null /home/git/.ssh/authorized_keys
sudo chown -R git:git /home/git

echo "OK: usuario git configurado"
```

## 5) Bare repositorio para deploy

Para servidor Git, prefira **bare repo** em `/home/git/repos`:

```bash
sudo -u git git init --bare /home/git/repos/meuapp.git
```

No seu local:

```bash
git remote add production git@<VPS_HOST>:/home/git/repos/meuapp.git
git push production main
```

## 6) Worktree (como usar sem conflito)

Use worktree no **seu repositorio de trabalho** (na maquina de dev ou no servidor app), nao dentro do bare repo do usuario `git`.

Exemplo valido:

```bash
# dentro do repo principal (ja com branch main)
git worktree add .worktrees/main main
git worktree add .worktrees/prod prod

git worktree add -b gitlens .worktrees/gitlens main
git worktree add -b feature-a ../feature-a main
git worktree add -b feature-b ../feature-b main

git worktree list
```

Notas:

- `git worktree add -b <nova-branch> <path> <base-branch>` cria branch nova a partir da base.
- Se a branch ja existe, remova `-b`.
- Evite comando como `git init -- worktree made-in.git` (sintaxe invalida para esse objetivo).

## 7) Traefik (infra unica do VPS)

Estrutura recomendada:

```text
/projects/infra/traefik
  docker-compose.yml
  traefik.yml
  letsencrypt/acme.json
```

Checklist:

1. DNS do dominio e subdominios apontando para `<VPS_HOST>`
2. portas 80/443 abertas
3. rede docker externa `web`

```bash
docker network create web || true
chmod 600 /projects/infra/traefik/letsencrypt/acme.json
docker compose -f /projects/infra/traefik/docker-compose.yml up -d
```

## 8) Fluxo de deploy (simples)

Padrao recomendado para cada app em `/projects/apps/<slug>`:

1. pull da branch (`main` ou `prod`)
2. `docker compose pull`
3. `docker compose up -d --remove-orphans`
4. healthcheck e logs

```bash
cd /projects/apps/meuapp
git fetch --all
git checkout main
git pull --ff-only
docker compose pull
docker compose up -d --remove-orphans
docker compose ps
```

## 9) Comandos de diagnostico rapido

```bash
# docker
docker ps

# traefik logs
docker logs -f traefik

# ufw
sudo ufw status verbose

# fail2ban
sudo fail2ban-client status sshd
```

## 10) Erros corrigidos do seu rascunho

- `adduser --disabled-password --<qualquer-usuario> ...` -> essa flag nao existe.
- para comentario/descricao de usuario no `adduser`, use `--gecos` (usuario normal) ou use `--system` como acima.
- `git init -- worktree made-in.git` nao monta estrategia de worktree; use `git worktree add ...` dentro de repo ja iniciado.

---

Se quiser, no proximo passo eu te entrego tambem:

1. `setup-git-server.sh` pronto e idempotente
2. `deploy.sh` padrao por app
3. `docker-compose.yml` base do Traefik com labels padrao para subdominios
