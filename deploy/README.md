# Nutcrack VM Deployment

Production runs on `162.243.195.13` behind Caddy. CI builds a release tarball,
SCPs it to the VM, and `activate.sh` atomically swaps a symlink to the new
release. The VM only runs Node — no build toolchain, no source code.

This project shares the VM with inboxlm and other apps. Nutcrack only
contributes:

- `/opt/nutcrack/...` — release tree, shared env/data
- `/etc/systemd/system/nutcrack-api.service`
- `/etc/caddy/conf.d/nutcrack.caddy` — site block only, imported by the
  base Caddyfile

## VM layout

```
/opt/nutcrack/
├── current           → releases/20260520-abc1234/   (atomic symlink)
├── releases/
│   ├── 20260520-abc1234/
│   │   ├── api/         dist/ + node_modules/ + package.json
│   │   ├── web/         Vite static bundle
│   │   ├── deploy/      systemd unit + Caddy snippet + activate.sh
│   │   ├── SHA          git sha
│   │   └── BUILT_AT     UTC timestamp
│   └── …                up to 5 retained
├── bin/
│   └── activate.sh
└── shared/
    ├── data/nutcrack.db     persistent SQLite + WAL
    └── .env                 installed from project-env (nutcrack/prod/env) each deploy
```

The API listens on `localhost:3010` (distinct from inboxlm's 3000). Caddy
reverse-proxies `nutcrack.gumpw.com/api/*` to it and serves the SPA from
`/opt/nutcrack/current/web`.

## One-time setup

### 1. Generate a deploy SSH key (laptop)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/nutcrack-deploy -N "" -C "github-actions deploy nutcrack"
ssh-copy-id -i ~/.ssh/nutcrack-deploy.pub root@162.243.195.13
```

### 2. GitHub repo secrets

In Settings → Secrets and variables → Actions:

| Secret           | Value                                                  |
|------------------|--------------------------------------------------------|
| `DEPLOY_HOST`    | `162.243.195.13`                                       |
| `DEPLOY_USER`    | `root`                                                 |
| `DEPLOY_SSH_KEY` | full contents of `~/.ssh/nutcrack-deploy` (private)    |
| `DEPLOY_PORT`    | `22` (optional)                                        |

### 3. Bootstrap the VM (system packages must already exist via nanops)

```bash
ssh root@162.243.195.13
git clone https://github.com/wanggang316/nutcrack.git /tmp/nutcrack-bootstrap
bash /tmp/nutcrack-bootstrap/deploy/install.sh
rm -rf /tmp/nutcrack-bootstrap
```

The installer:
- creates `/opt/nutcrack/{releases,bin,shared/data}`
- installs `/opt/nutcrack/bin/activate.sh`
- installs `/opt/nutcrack/shared/.env` from project-env (`nutcrack/prod`),
  falling back to the template on VMs without project-env
- enables (does not start) `nutcrack-api`

### 4. Provision env via project-env

Production secrets are managed centrally in the `project-env` repo
(`nutcrack/prod/env`, git-crypt encrypted), not hand-edited on the VM. On
every deploy `activate.sh` runs `project-env-install nutcrack prod
/opt/nutcrack/shared/.env`, which clones the encrypted repo into tmpfs,
unlocks, writes the one file, and discards the clone.

Before the first deploy, make sure `nutcrack/prod/env` exists in the repo
(at minimum `NODE_ENV`, `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `LOG_LEVEL`,
`JINA_API_KEY`). See **Changing environment variables** below.

AI provider keys (OpenRouter key + model) live in the app's `settings` table,
set via the admin UI after the first user signs up — not in this file.

### 5. Point DNS at the VM

Add an A record:

- `nutcrack.gumpw.com` → `162.243.195.13`

Caddy requests Let's Encrypt automatically on the first HTTPS hit.

### 6. First deploy

Push to `main` (or open Actions → "Build and Deploy" → "Run workflow").
On success, `https://nutcrack.gumpw.com` is live.

## Routine deploys

Every push to `main` triggers `.github/workflows/deploy.yml`. The full
sequence (CI build → SCP → activate) takes ~3 minutes; the VM portion
(extract + swap + restart) is < 10 seconds.

`shared/data/nutcrack.db` is never touched by deploys. `shared/.env` is
re-installed from `project-env` (`nutcrack/prod/env`) on every deploy, so any
manual edit on the VM is overwritten — change env vars via a project-env PR
(see below).

## Changing environment variables

Env vars are managed in the central `project-env` repo (`nutcrack/prod/env`,
git-crypt encrypted). Never hand-edit `/opt/nutcrack/shared/.env` on the VM.

```bash
git clone git@github.com:wanggang316/project-env.git   # or git pull
cd project-env
git-crypt unlock ~/.config/git-crypt-keys/project-env.key
git switch -c env/nutcrack-<purpose>                    # e.g. env/nutcrack-rotate-jina
$EDITOR nutcrack/prod/env                               # edit values
git commit -am "nutcrack prod: <what changed and why, no values>"
git push -u origin env/nutcrack-<purpose>
gh pr create --fill
```

After a human reviews and merges the PR, redeploy nutcrack (push to `main`,
or on the VM run
`project-env-install nutcrack prod /opt/nutcrack/shared/.env && systemctl restart nutcrack-api`).

## Rollback

```bash
ssh root@162.243.195.13
cd /opt/nutcrack/releases
PREV=$(ls -1dt */ | sed -n '2p' | tr -d /)
ln -sfn "/opt/nutcrack/releases/$PREV" /opt/nutcrack/current
systemctl restart nutcrack-api
```

## Operations cheatsheet

```bash
# Logs
journalctl -u nutcrack-api -f
tail -f /var/log/caddy/nutcrack.gumpw.com.log

# Restart (re-reads .env)
systemctl restart nutcrack-api

# Current release
readlink /opt/nutcrack/current
cat $(readlink /opt/nutcrack/current)/SHA

# DB snapshot
sqlite3 /opt/nutcrack/shared/data/nutcrack.db \
  ".backup /opt/nutcrack/shared/data/backup-$(date +%Y%m%d-%H%M).db"
```
