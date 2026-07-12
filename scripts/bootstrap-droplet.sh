#!/usr/bin/env bash
# One-time VPS bootstrap — run as root on a fresh Ubuntu 24.04 Droplet.
# docs/DEPLOY-DIGITALOCEAN.md §5
#
#   curl -fsSL https://raw.githubusercontent.com/AndAleixo/sir-relay/main/scripts/bootstrap-droplet.sh | bash
#   # or after clone: sudo bash scripts/bootstrap-droplet.sh
set -euo pipefail

if [[ $(id -u) -ne 0 ]]; then
  echo "error: run as root (DO web console or ssh root@DROPLET)" >&2
  exit 1
fi

echo "→ bootstrap-droplet · user deploy + Docker"

if ! id deploy &>/dev/null; then
  adduser --disabled-password --gecos "" deploy
  echo "→ created user deploy (login via SSH key — no password set)"
fi

usermod -aG sudo deploy

if [[ -d /root/.ssh ]]; then
  install -d -o deploy -g deploy -m 700 /home/deploy/.ssh
  if [[ -f /root/.ssh/authorized_keys ]]; then
    cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
    chown deploy:deploy /home/deploy/.ssh/authorized_keys
    chmod 600 /home/deploy/.ssh/authorized_keys
    echo "→ copied root SSH keys to deploy"
  fi
fi

if ! command -v docker >/dev/null 2>&1; then
  apt-get update
  apt-get install -y ca-certificates curl git
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | tee /etc/apt/sources.list.d/docker.list >/dev/null
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  echo "→ Docker installed"
else
  echo "→ Docker already installed"
fi

usermod -aG docker deploy

echo ""
echo "→ bootstrap done"
echo "  1. su - deploy"
echo "  2. git clone git@github.com:AndAleixo/sir-relay.git && cd sir-relay"
echo "     (repo privado — ver docs/DEPLOY-DIGITALOCEAN.md § deploy key)"
echo "  3. nano .env  (prod VPS — chmod 600 .env)"
echo "  4. npm run prod-vps   # or: bash scripts/env/prod-vps.sh"
echo ""
echo "  Do not run day-to-day commands as root."
