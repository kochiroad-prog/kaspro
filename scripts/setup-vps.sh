#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  PRAECOX — VPS Initial Setup Script
#  Jalankan SEKALI saat pertama kali setup VPS
#  OS: Ubuntu 20.04 / 22.04
#  Cara pakai: chmod +x setup-vps.sh && sudo bash setup-vps.sh
# ═══════════════════════════════════════════════════════════

set -e  # stop jika ada error

VPS_IP="YOUR_VPS_IP"          # << GANTI dengan IP VPS kamu
APP_DIR="/var/www/praecox"
GIT_REPO="YOUR_GIT_REPO_URL"  # << GANTI: https://github.com/user/repo.git
LOG_DIR="/var/log/praecox"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   PRAECOX — VPS Setup Starting...   ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── 1. Update sistem ──────────────────────
echo "▶ [1/8] Update sistem..."
apt update -qq && apt upgrade -y -qq

# ── 2. Install Git ────────────────────────
echo "▶ [2/8] Install Git..."
apt install -y git curl unzip -qq

# ── 3. Install NVM + Node.js 20 LTS ──────
echo "▶ [3/8] Install/Update Node.js 20 LTS..."
if ! command -v nvm &> /dev/null; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
fi
source "$HOME/.nvm/nvm.sh" 2>/dev/null || true
nvm install 20
nvm use 20
nvm alias default 20
echo "   ✓ Node.js: $(node -v), npm: $(npm -v)"

# ── 4. Install PM2 ───────────────────────
echo "▶ [4/8] Install PM2..."
npm install -g pm2 -q
pm2 startup systemd -u root --hp /root
echo "   ✓ PM2: $(pm2 -v)"

# ── 5. Install Nginx ─────────────────────
echo "▶ [5/8] Install Nginx..."
apt install -y nginx -qq
systemctl enable nginx
systemctl start nginx
echo "   ✓ Nginx terinstall"

# ── 6. Buat folder ───────────────────────
echo "▶ [6/8] Buat direktori..."
mkdir -p "$APP_DIR"
mkdir -p "$LOG_DIR"

# ── 7. Clone repo ────────────────────────
echo "▶ [7/8] Clone repository..."
if [ -d "$APP_DIR/.git" ]; then
  echo "   Repo sudah ada, skip clone"
else
  git clone "$GIT_REPO" "$APP_DIR"
  echo "   ✓ Repo cloned ke $APP_DIR"
fi

# ── 8. Konfigurasi Nginx ─────────────────
echo "▶ [8/8] Setup Nginx reverse proxy..."
cat > /etc/nginx/sites-available/praecox << NGINX
server {
    listen 80;
    server_name $VPS_IP _;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;

    # Proxy ke Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 120s;
    }

    # Static files cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /favicon.ico {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/praecox /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "   ✓ Nginx configured"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Setup selesai! Langkah selanjutnya:                ║"
echo "║                                                      ║"
echo "║  1. cd $APP_DIR                                    ║"
echo "║  2. cp .env.example .env.production.local           ║"
echo "║  3. nano .env.production.local  (isi variabel env)  ║"
echo "║  4. bash scripts/deploy.sh                          ║"
echo "║                                                      ║"
echo "║  Akses app: http://$VPS_IP                          ║"
echo "╚══════════════════════════════════════════════════════╝"
