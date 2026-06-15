#!/usr/bin/env bash
# Atomically swap to a new release tarball produced by .github/workflows/deploy.yml.
#
# Invoked from the GitHub Actions runner over SSH. Lives on the VM at
# /opt/nutcrack/bin/activate.sh (installed by deploy/install.sh on first boot).
#
# Args:
#   $1  absolute path to release.tgz on this host
#   $2  release name (e.g. 20260520-abc1234) — becomes the directory name

set -euo pipefail

TARBALL="${1:?tarball path required}"
RELEASE_NAME="${2:?release name required}"

ROOT=/opt/nutcrack
RELEASES_DIR="$ROOT/releases"
SHARED_DIR="$ROOT/shared"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_NAME"
KEEP_RELEASES=5
HEALTH_PORT="${PORT:-3010}"

log() { printf '\033[36m[activate]\033[0m %s\n' "$*"; }
err() { printf '\033[31m[activate]\033[0m %s\n' "$*" >&2; }

# ---------------------------------------------------------------
# Install shared env from the central project-env repo.
#
# project-env-install (provided by nanops/bootstrap/install.sh) clones the
# encrypted repo into tmpfs, unlocks, copies nutcrack/prod/env to
# $SHARED_DIR/.env, and discards the clone. Atomic + idempotent.
#
# Skipped silently on VMs without nanops bootstrap, so the sanity check
# below still enforces "env must be in place" regardless of source.
# ---------------------------------------------------------------
if command -v project-env-install >/dev/null; then
  log "Installing env from project-env"
  project-env-install nutcrack prod "$SHARED_DIR/.env"
fi

# ---------------------------------------------------------------
# Sanity
# ---------------------------------------------------------------
[[ -f "$TARBALL"          ]] || { err "Tarball not found: $TARBALL"; exit 1; }
[[ -d "$SHARED_DIR/data"  ]] || { err "Missing $SHARED_DIR/data";    exit 1; }
[[ -f "$SHARED_DIR/.env"  ]] || { err "Missing $SHARED_DIR/.env";    exit 1; }

# ---------------------------------------------------------------
# Extract release
# ---------------------------------------------------------------
log "Extracting $TARBALL to $RELEASE_DIR"
mkdir -p "$RELEASE_DIR"
tar -xzf "$TARBALL" -C "$RELEASE_DIR"

[[ -f "$RELEASE_DIR/api/dist/index.js" ]] || { err "api dist missing in release"; exit 1; }
[[ -d "$RELEASE_DIR/web"               ]] || { err "web bundle missing in release"; exit 1; }

# ---------------------------------------------------------------
# Sync systemd unit shipped in the release
# ---------------------------------------------------------------
SYSTEMD_CHANGED=0
src="$RELEASE_DIR/deploy/nutcrack-api.service"
dst=/etc/systemd/system/nutcrack-api.service
if [[ -f "$src" ]] && ! cmp -s "$src" "$dst" 2>/dev/null; then
  log "Updating systemd unit: nutcrack-api.service"
  install -m 644 "$src" "$dst"
  SYSTEMD_CHANGED=1
fi
if [[ "$SYSTEMD_CHANGED" == "1" ]]; then
  systemctl daemon-reload
fi

# ---------------------------------------------------------------
# Sync Caddy snippet → /etc/caddy/conf.d/nutcrack.caddy
# ---------------------------------------------------------------
CADDY_RELOAD=0
if [[ -f "$RELEASE_DIR/deploy/nutcrack.caddy" ]]; then
  src="$RELEASE_DIR/deploy/nutcrack.caddy"
  dst=/etc/caddy/conf.d/nutcrack.caddy
  mkdir -p /etc/caddy/conf.d
  log "Installing Caddy snippet → $dst"
  install -m 644 "$src" "$dst"
  if caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
    # `caddy validate` opens declared log files as the invoking user (root
    # here); those files are then unwritable by the caddy service user on
    # reload. Hand newly-created log files back to caddy:caddy before reload.
    if id caddy >/dev/null 2>&1 && [[ -d /var/log/caddy ]]; then
      chown caddy:caddy /var/log/caddy/*.log 2>/dev/null || true
    fi
    CADDY_RELOAD=1
  else
    err "Merged Caddy config failed validation; reverting $dst"
    rm -f "$dst"
  fi
fi

# ---------------------------------------------------------------
# Atomic switch
# ---------------------------------------------------------------
log "Switching $ROOT/current -> $RELEASE_NAME"
ln -sfn "$RELEASE_DIR" "$ROOT/current"

# ---------------------------------------------------------------
# Restart services
# ---------------------------------------------------------------
log "Restarting nutcrack-api"
systemctl restart nutcrack-api.service

if [[ "$CADDY_RELOAD" == "1" ]]; then
  log "Reloading caddy"
  systemctl reload caddy.service
fi

# ---------------------------------------------------------------
# Health check
# ---------------------------------------------------------------
log "Waiting for /api/health on port $HEALTH_PORT"
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS --max-time 3 "http://localhost:$HEALTH_PORT/api/health" >/dev/null 2>&1; then
    log "Health OK after ${i}s"
    break
  fi
  if [[ $i -eq 10 ]]; then
    err "Health check failed after 10s"
    systemctl --no-pager --lines=20 status nutcrack-api || true
    exit 1
  fi
  sleep 1
done

# ---------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------
log "Pruning old releases (keeping $KEEP_RELEASES newest)"
cd "$RELEASES_DIR"
# shellcheck disable=SC2012
ls -1dt */ 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

rm -f "$TARBALL"

# Self-update from the activated release so a fixed activate.sh ships
# with the next deploy.
SELF_SRC="$RELEASE_DIR/deploy/activate.sh"
SELF_DST="$ROOT/bin/activate.sh"
if [[ -f "$SELF_SRC" ]] && ! cmp -s "$SELF_SRC" "$SELF_DST" 2>/dev/null; then
  log "Updating $SELF_DST from release"
  install -m 755 "$SELF_SRC" "$SELF_DST"
fi

log "Activated $RELEASE_NAME"
log "SHA: $(cat "$RELEASE_DIR/SHA" 2>/dev/null || echo unknown)"
log "Built: $(cat "$RELEASE_DIR/BUILT_AT" 2>/dev/null || echo unknown)"
