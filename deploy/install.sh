#!/usr/bin/env bash
# One-time nutcrack-specific bootstrap on a VM that nanops already prepared.
#
# Prereq: Node 22, Caddy, ufw, /etc/caddy/Caddyfile + conf.d/ all present.
#
# This script does NOT install system packages and does NOT touch the base
# Caddyfile. It only sets up the nutcrack project itself:
#   - /opt/nutcrack/{bin,releases,shared/data}
#   - /opt/nutcrack/bin/activate.sh
#   - /opt/nutcrack/shared/.env (seeded from template if missing)
#   - nutcrack-api systemd unit (enabled, not started)
#
# Run as root:
#   git clone https://github.com/wanggang316/nutcrack.git /tmp/nutcrack-bootstrap
#   bash /tmp/nutcrack-bootstrap/deploy/install.sh
#
# Idempotent. Won't overwrite an existing .env or DB.

set -euo pipefail

ROOT=/opt/nutcrack
BOOTSTRAP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() { printf '\033[36m[nutcrack-install]\033[0m %s\n' "$*"; }
die() { printf '\033[31m[nutcrack-install]\033[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run as root"

# ---------------------------------------------------------------
# Sanity: VM baseline must already be in place
# ---------------------------------------------------------------
command -v node  >/dev/null 2>&1 || die "node not found — run nanops bootstrap first"
command -v caddy >/dev/null 2>&1 || die "caddy not found — run nanops bootstrap first"
[[ -d /etc/caddy/conf.d ]] || die "/etc/caddy/conf.d missing — run nanops bootstrap first"

# ---------------------------------------------------------------
# Directory layout
# ---------------------------------------------------------------
log "Preparing layout under $ROOT"
mkdir -p "$ROOT/releases" "$ROOT/bin" "$ROOT/shared/data"
chmod 755 "$ROOT/shared/data"

log "Installing $ROOT/bin/activate.sh"
install -m 755 "$BOOTSTRAP_DIR/deploy/activate.sh" "$ROOT/bin/activate.sh"

# Seed .env. Source of truth is the central project-env repo (nutcrack/prod/env),
# installed via project-env-install on every deploy by activate.sh. Here we just
# populate it once so the first deploy's sanity check passes.
if [[ -f "$ROOT/shared/.env" ]]; then
  log "$ROOT/shared/.env already exists — leaving untouched"
elif command -v project-env-install >/dev/null; then
  log "Installing $ROOT/shared/.env from project-env (nutcrack/prod)"
  project-env-install nutcrack prod "$ROOT/shared/.env"
else
  log "project-env-install not found — seeding $ROOT/shared/.env from template"
  install -m 600 "$BOOTSTRAP_DIR/deploy/.env.production.example" "$ROOT/shared/.env"
  echo
  echo "  >>> No nanops/project-env on this VM. Fill in JINA_API_KEY manually:"
  echo "  >>>   nano $ROOT/shared/.env"
  echo "  >>> AI keys are managed in the admin UI (settings table), not here."
  echo
fi

# ---------------------------------------------------------------
# systemd units (Caddy snippet is installed by activate.sh on each deploy)
# ---------------------------------------------------------------
log "Installing systemd units"
install -m 644 "$BOOTSTRAP_DIR/deploy/nutcrack-api.service" /etc/systemd/system/nutcrack-api.service
systemctl daemon-reload
systemctl enable nutcrack-api.service

log "Bootstrap complete. Service is NOT started — it needs a release first."
echo
echo "Next steps:"
echo "  1. Ensure nutcrack/prod/env exists in the project-env repo (see deploy/README.md)."
echo "  2. Point DNS A record for nutcrack.gumpw.com to this VM."
echo "  3. Push to main; CI runs $ROOT/bin/activate.sh on the first deploy."
