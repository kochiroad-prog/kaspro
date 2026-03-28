#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  PRAECOX — Deploy / Update Script
#  Jalankan setiap kali ada update code
#  Cara pakai: bash scripts/deploy.sh
# ═══════════════════════════════════════════════════════════

set -e

APP_DIR="/var/www/praecox"
LOG_DIR="/var/log/praecox"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   PRAECOX — Deploying...            ║"
echo "╚══════════════════════════════════════╝"
echo ""

cd "$APP_DIR"

# ── Load NVM ─────────────────────────────
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

# ── 1. Pull latest code ──────────────────
echo "▶ [1/5] Pull latest code..."
git pull origin main
echo "   ✓ Code updated"

# ── 2. Install dependencies ──────────────
echo "▶ [2/5] Install dependencies..."
npm ci --production=false
echo "   ✓ Dependencies installed"

# ── 3. Build Next.js ─────────────────────
echo "▶ [3/5] Building Next.js..."
NODE_ENV=production npm run build
echo "   ✓ Build selesai"

# ── 4. Restart PM2 ───────────────────────
echo "▶ [4/5] Restart PM2..."
mkdir -p "$LOG_DIR"
if pm2 list | grep -q "praecox"; then
  pm2 reload praecox --env production
  echo "   ✓ PM2 reloaded (zero-downtime)"
else
  pm2 start ecosystem.config.js --env production
  pm2 save
  echo "   ✓ PM2 started"
fi

# ── 5. Check status ──────────────────────
echo "▶ [5/5] Cek status..."
sleep 2
pm2 status praecox

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✅ Deploy berhasil!                    ║"
echo "║                                          ║"
echo "║  Cek log: pm2 logs praecox              ║"
echo "║  Status : pm2 status                    ║"
echo "╚══════════════════════════════════════════╝"
