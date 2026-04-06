# -*- coding: utf-8 -*-
"""Praecox VPS Deploy Script via Paramiko SSH"""
import sys
import time
import paramiko

# Fix Windows encoding
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

VPS_IP       = "43.156.178.123"
SSH_PORT     = 22
USER         = "root"
PASSWORD     = "praecox2026"
SUPABASE_URL = "https://vvhkmigutnnosfwwioht.supabase.co"
ANON_KEY     = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2aGttaWd1dG5ub3Nmd3dpb2h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY4OTAyOSwiZXhwIjoyMDkwMjY1MDI5fQ.RnCM6g7YM_6ydCjj9LLStX6Xp-3Yy02CR_aiRxpVOEI"
SMTP_USER    = "nddsuksesgrup@gmail.com"
SMTP_PASS    = "utgw qyua dqzb xlvx"


def run(ssh, cmd, timeout=120, label=None):
    if label:
        print(f"\n[{label}]")
    short = cmd.strip().splitlines()[0][:70]
    print(f"  $ {short}{'...' if len(cmd.strip())>70 else ''}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout, get_pty=True)
    out = ""
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            chunk = stdout.channel.recv(4096).decode("utf-8", errors="replace")
            print(chunk, end="", flush=True)
            out += chunk
        time.sleep(0.1)
    remaining = stdout.read().decode("utf-8", errors="replace")
    if remaining:
        print(remaining, end="")
        out += remaining
    err = stderr.read().decode("utf-8", errors="replace")
    if err and "warning" not in err.lower() and "hint:" not in err.lower():
        print(f"  STDERR: {err[:300]}")
    return out


def main():
    print("=" * 55)
    print("  PRAECOX -- VPS Deploy via SSH")
    print(f"  Target: {USER}@{VPS_IP}:{SSH_PORT}")
    print("=" * 55)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(VPS_IP, port=SSH_PORT, username=USER, password=PASSWORD,
                    timeout=20, allow_agent=False, look_for_keys=False)
        print(f"\n[OK] Connected to {VPS_IP}")
    except Exception as e:
        print(f"\n[FAIL] SSH error: {e}")
        print("\nKemungkinan masalah:")
        print("  - Password SSH berbeda dari password aaPanel")
        print("  - Port SSH bukan 22 (cek di aaPanel > Security)")
        print("  - Root login diblokir")
        sys.exit(1)

    # --- Cek OS & tools yang sudah ada ---
    print("\n--- [0/7] Cek environment VPS ---")
    run(ssh, "uname -a; lsb_release -d 2>/dev/null || head -3 /etc/os-release")
    run(ssh, "node -v 2>/dev/null || echo 'Node: tidak ada'")
    run(ssh, "npm -v  2>/dev/null || echo 'npm: tidak ada'")
    run(ssh, "pm2 -v  2>/dev/null || echo 'PM2: tidak ada'")
    run(ssh, "nginx -v 2>/dev/null || echo 'Nginx: tidak ada'")
    run(ssh, "git --version")

    # --- Node.js 20 via NVM ---
    print("\n--- [1/7] Setup Node.js 20 LTS ---")
    run(ssh, r"""
export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ]; then
  echo "Installing NVM..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
source "$NVM_DIR/nvm.sh"
nvm install 20 --lts 2>&1 | tail -5
nvm use 20
nvm alias default 20
echo "Node: $(node -v)  npm: $(npm -v)"
""", timeout=300)

    # --- PM2 ---
    print("\n--- [2/7] Install PM2 ---")
    run(ssh, r"""
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
npm install -g pm2 --quiet 2>&1 | tail -3
pm2 -v
""", timeout=120)

    # --- Nginx ---
    print("\n--- [3/7] Install & konfigurasi Nginx ---")
    run(ssh, "apt-get update -qq && apt-get install -y nginx git curl -qq", timeout=180)
    run(ssh, "systemctl enable nginx && systemctl start nginx && nginx -v")

    # --- Buat direktori ---
    print("\n--- [4/7] Buat direktori app ---")
    run(ssh, "mkdir -p /var/www/praecox /var/log/praecox")

    # --- Cek apakah repo sudah ada ---
    out = run(ssh, "[ -d /var/www/praecox/.git ] && echo HAS_GIT || echo NO_GIT")
    has_git = "HAS_GIT" in out
    if has_git:
        print("  -> Repo sudah ada, akan pull update nanti")
    else:
        print("  -> Direktori kosong, siap menerima upload")

    # --- .env production ---
    print("\n--- [5/7] Buat .env.production.local ---")
    env_content = (
        f"NEXT_PUBLIC_SUPABASE_URL={SUPABASE_URL}\n"
        f"NEXT_PUBLIC_SUPABASE_ANON_KEY={ANON_KEY}\n"
        f"NEXT_PUBLIC_APP_URL=http://{VPS_IP}\n"
        f"SMTP_HOST=smtp.gmail.com\n"
        f"SMTP_PORT=587\n"
        f"SMTP_USER={SMTP_USER}\n"
        f"SMTP_PASS={SMTP_PASS}\n"
        f"NODE_ENV=production\n"
    )
    # Write env file line by line safely
    run(ssh, f"printf '%s' '{env_content}' > /tmp/praecox_env.txt && mv /tmp/praecox_env.txt /var/www/praecox/.env.production.local")
    run(ssh, "echo 'ENV file lines:' && wc -l /var/www/praecox/.env.production.local")

    # --- Nginx config ---
    print("\n--- [6/7] Nginx reverse proxy config ---")
    nginx_conf = f"""server {{
    listen 80;
    server_name {VPS_IP} _;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;
    client_max_body_size 50M;

    location / {{
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }}

    location /_next/static/ {{
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }}
}}
"""
    run(ssh, f"cat > /etc/nginx/sites-available/praecox << 'EOFNGINX'\n{nginx_conf}\nEOFNGINX")
    run(ssh, "ln -sf /etc/nginx/sites-available/praecox /etc/nginx/sites-enabled/ && rm -f /etc/nginx/sites-enabled/default")
    run(ssh, "nginx -t && systemctl reload nginx && echo 'Nginx OK'")

    # --- Status akhir ---
    print("\n--- [7/7] Status VPS ---")
    run(ssh, "systemctl is-active nginx && echo 'Nginx: RUNNING'")
    run(ssh, r"export NVM_DIR='$HOME/.nvm'; source '$NVM_DIR/nvm.sh' 2>/dev/null; node -v && pm2 -v")
    run(ssh, "ls -la /var/www/praecox/")
    run(ssh, "df -h / | tail -1 && free -h | grep Mem")

    ssh.close()

    print("\n" + "=" * 55)
    print("  VPS SETUP SELESAI!")
    print("=" * 55)
    print(f"\n  Langkah selanjutnya:")
    print(f"  -> Upload code praecox ke VPS")
    print(f"  -> Build Next.js di VPS")
    print(f"  -> Start dengan PM2")
    print(f"\n  Akses nanti: http://{VPS_IP}")
    print()


if __name__ == "__main__":
    main()
