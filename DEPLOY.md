# LiberProof Deployment Guide

## Prerequisites

- Ubuntu 22.04+ VPS (Linode recommended)
- Node.js 20+, pnpm 9+
- NGINX, Certbot
- DNS: `api.`, `verify.`, `app.` → your server IP

---

## Option A — PM2 + NGINX (recommended for Linode)

### 1. Install deps

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx
npm install -g pnpm pm2
```

### 2. Clone and build

```bash
git clone https://github.com/liberlayer/liberproof.git /var/www/liberproof
cd /var/www/liberproof
pnpm install
pnpm build
```

### 3. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
nano apps/api/.env   # fill in JWT_SECRET, DB_PATH, etc.
```

### 4. Run database migration

```bash
cd apps/api && pnpm db:migrate
```

### 5. Start API with PM2

```bash
pm2 start infra/pm2/ecosystem.config.cjs
pm2 save
pm2 startup   # follow the printed command to enable on boot
```

### 6. SSL certificates

```bash
sudo certbot --nginx -d api.liberproof.com -d verify.liberproof.com -d app.liberproof.com
```

### 7. NGINX config

```bash
sudo cp infra/nginx/*.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/api.liberproof.com.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/verify.liberproof.com.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/app.liberproof.com.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 8. Deploy frontend builds

```bash
mkdir -p /var/www/liberproof/verify/dist /var/www/liberproof/app/dist
cp -r apps/verify/dist/* /var/www/liberproof/verify/dist/
cp -r apps/app/dist/* /var/www/liberproof/app/dist/
```

---

## Option B — Docker Compose

```bash
git clone https://github.com/liberlayer/liberproof.git
cd liberproof
cp apps/api/.env.example apps/api/.env
# edit .env

# Build frontends first
pnpm install
pnpm --filter @liberproof/verify build
pnpm --filter @liberproof/app build

# Launch everything
docker compose -f infra/docker/docker-compose.yml up -d
```

Services will be available at:
- API: `http://localhost:3000`
- Verify: `http://localhost:5173`
- App: `http://localhost:5174`

Put NGINX or Traefik in front for SSL in production.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | — | Health check |
| POST | /auth/nonce | — | Get SIWE challenge |
| POST | /auth/verify | — | Verify wallet sig → JWT |
| GET | /auth/me | JWT | Current wallet |
| POST | /notarizations | JWT | Create notarization |
| GET | /notarizations | JWT | List mine |
| GET | /notarizations/:id | — | Get by ID (public) |
| GET | /notarizations/hash/:h | — | Lookup by file hash |
| POST | /attestations | JWT | Issue attestation |
| GET | /attestations | JWT | List issued |
| GET | /attestations/:id | — | Get by ID (public) |
| GET | /attestations/subject/:addr | — | By subject wallet |
| GET | /verify/:id | — | Unified proof lookup |

---

## Updating

```bash
cd /var/www/liberproof
git pull
pnpm install
pnpm build
pm2 restart liberproof-api
# redeploy frontend builds as in step 8
```

---

## Anchor Endpoints

Once a proof is created, record its on-chain anchor by calling:

```bash
# Notarization
curl -X POST https://api.liberproof.com/notarizations/urn:liberproof:notarization:abc123.../anchor \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"chain":"liberland","txHash":"0xabc...","blockNumber":12345}'

# Attestation
curl -X POST https://api.liberproof.com/attestations/urn:liberproof:attestation:def456.../anchor \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"chain":"ethereum","txHash":"0xdef..."}'
```

The anchor is stored immutably — once set, it cannot be changed (returns 409 on duplicate).
