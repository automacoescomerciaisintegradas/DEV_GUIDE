#!/usr/bin/env bash

set -Eeuo pipefail

###############################################################################
# setup-git-server.sh
#
# Idempotent setup for a simple Git server user using git-shell.
#
# Usage:
#   sudo bash setup-git-server.sh
#   sudo bash setup-git-server.sh --admin-user devops
#   sudo bash setup-git-server.sh --pubkey-file /tmp/id_ed25519.pub
#   sudo bash setup-git-server.sh --pubkey "ssh-ed25519 AAAA... user@host"
###############################################################################

ADMIN_USER="devops"
GIT_USER="git"
GIT_HOME="/home/git"
PUBKEY=""
PUBKEY_FILE=""

log() {
  printf '[setup-git-server] %s\n' "$*"
}

die() {
  printf '[setup-git-server][ERROR] %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"
}

usage() {
  cat <<'EOF'
Usage:
  sudo bash setup-git-server.sh [options]

Options:
  --admin-user <name>     Admin user that owns /projects (default: devops)
  --pubkey <key>          Public SSH key content to append to git authorized_keys
  --pubkey-file <path>    File containing a public SSH key to append
  -h, --help              Show this help
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --admin-user)
        [[ $# -ge 2 ]] || die "--admin-user requires a value"
        ADMIN_USER="$2"
        shift 2
        ;;
      --pubkey)
        [[ $# -ge 2 ]] || die "--pubkey requires a value"
        PUBKEY="$2"
        shift 2
        ;;
      --pubkey-file)
        [[ $# -ge 2 ]] || die "--pubkey-file requires a value"
        PUBKEY_FILE="$2"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        die "Unknown argument: $1"
        ;;
    esac
  done
}

require_root() {
  [[ "${EUID}" -eq 0 ]] || die "Run as root (use sudo)."
}

load_pubkey() {
  if [[ -n "${PUBKEY_FILE}" ]]; then
    [[ -f "${PUBKEY_FILE}" ]] || die "Public key file not found: ${PUBKEY_FILE}"
    PUBKEY="$(<"${PUBKEY_FILE}")"
  fi
}

ensure_packages() {
  log "Installing required packages (git, openssh-server, acl)..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y git openssh-server acl
}

ensure_git_shell() {
  if ! grep -Fxq "/usr/bin/git-shell" /etc/shells; then
    log "Adding /usr/bin/git-shell to /etc/shells"
    echo "/usr/bin/git-shell" >> /etc/shells
  fi
}

ensure_admin_user() {
  id "${ADMIN_USER}" >/dev/null 2>&1 || die "Admin user not found: ${ADMIN_USER}"
}

ensure_projects_layout() {
  log "Ensuring /projects layout..."
  install -d -m 2775 -o "${ADMIN_USER}" -g "${ADMIN_USER}" /projects
  install -d -m 2775 -o "${ADMIN_USER}" -g "${ADMIN_USER}" /projects/apps
  install -d -m 2775 -o "${ADMIN_USER}" -g "${ADMIN_USER}" /projects/infra
  install -d -m 2775 -o "${ADMIN_USER}" -g "${ADMIN_USER}" /projects/backups

  if command -v setfacl >/dev/null 2>&1; then
    setfacl -m "d:g:${ADMIN_USER}:rwx" /projects || true
  fi

  ln -sfn /projects "/home/${ADMIN_USER}/projects"
}

ensure_git_user() {
  if id "${GIT_USER}" >/dev/null 2>&1; then
    log "User ${GIT_USER} already exists"
  else
    log "Creating system user ${GIT_USER} with git-shell..."
    adduser \
      --system \
      --shell /usr/bin/git-shell \
      --home "${GIT_HOME}" \
      --group \
      "${GIT_USER}"
  fi

  usermod -d "${GIT_HOME}" "${GIT_USER}"
  usermod -s /usr/bin/git-shell "${GIT_USER}"
  passwd -l "${GIT_USER}" >/dev/null 2>&1 || true
}

ensure_git_dirs() {
  log "Ensuring git directories and permissions..."
  install -d -m 0755 -o "${GIT_USER}" -g "${GIT_USER}" "${GIT_HOME}"
  install -d -m 0755 -o "${GIT_USER}" -g "${GIT_USER}" "${GIT_HOME}/repos"
  install -d -m 0755 -o "${GIT_USER}" -g "${GIT_USER}" "${GIT_HOME}/worktrees"
  install -d -m 0755 -o "${GIT_USER}" -g "${GIT_USER}" "${GIT_HOME}/.config"
  install -d -m 0755 -o "${GIT_USER}" -g "${GIT_USER}" "${GIT_HOME}/git-shell-commands"

  cat > "${GIT_HOME}/git-shell-commands/no-interactive-login" <<'EOF'
#!/bin/sh
echo "Acesso interativo desabilitado. Apenas operacoes Git."
exit 128
EOF
  chmod 0755 "${GIT_HOME}/git-shell-commands/no-interactive-login"
  chown "${GIT_USER}:${GIT_USER}" "${GIT_HOME}/git-shell-commands/no-interactive-login"

  install -d -m 0700 -o "${GIT_USER}" -g "${GIT_USER}" "${GIT_HOME}/.ssh"
  install -m 0600 -o "${GIT_USER}" -g "${GIT_USER}" /dev/null "${GIT_HOME}/.ssh/authorized_keys"
}

append_pubkey_if_needed() {
  [[ -n "${PUBKEY}" ]] || return 0
  log "Ensuring provided public key is present in authorized_keys..."

  local auth_keys
  auth_keys="${GIT_HOME}/.ssh/authorized_keys"

  if grep -Fqx "${PUBKEY}" "${auth_keys}"; then
    log "Public key already present"
    return 0
  fi

  printf '%s\n' "${PUBKEY}" >> "${auth_keys}"
  chown "${GIT_USER}:${GIT_USER}" "${auth_keys}"
  chmod 0600 "${auth_keys}"
  log "Public key appended"
}

main() {
  parse_args "$@"
  require_root
  require_cmd adduser
  require_cmd usermod
  require_cmd passwd
  require_cmd install
  require_cmd ln
  require_cmd grep
  load_pubkey
  ensure_admin_user
  ensure_packages
  ensure_git_shell
  ensure_projects_layout
  ensure_git_user
  ensure_git_dirs
  append_pubkey_if_needed

  log "Done."
  log "Next step (optional): sudo -u git git init --bare /home/git/repos/meuapp.git"
}

main "$@"
