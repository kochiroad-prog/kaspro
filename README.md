# 💰 KasPro — Buku Kas Digital untuk UMKM

Aplikasi pencatatan keuangan sederhana berbasis cloud untuk UMKM, booth, dan usaha kecil.
Dibangun dengan **Next.js 15**, **Supabase**, dan **Tailwind CSS**.

---

## 🚀 Quick Start (5 menit)

### Langkah 1 — Clone & Install

```bash
git clone https://github.com/username/kaspro.git
cd kaspro
npm install
```

### Langkah 2 — Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Isi nama project: `kaspro`
3. Pilih region: **Southeast Asia (Singapore)**
4. Catat **Project URL** dan **Anon Key** dari menu *Settings → API*

### Langkah 3 — Setup Database

1. Buka **Supabase Dashboard → SQL Editor**
2. Klik **New Query**
3. Copy-paste seluruh isi file `supabase/schema.sql`
4. Klik **Run** — semua tabel, RLS, dan trigger akan terbuat otomatis

### Langkah 4 — Konfigurasi Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Langkah 5 — Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) → daftar akun baru → mulai mencatat!

---

## 📦 Deploy ke Vercel

### Cara Tercepat (Recommended)

1. Push kode ke GitHub
2. Buka [vercel.com](https://vercel.com) → **Import Project**
3. Pilih repo `kaspro`
4. Tambahkan Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` → isi dengan domain Vercel Anda
5. Klik **Deploy**

### Via Vercel CLI

```bash
npm i -g vercel
vercel
# Ikuti instruksi, masukkan env vars saat diminta
```

---

## 🏗️ Struktur Project

```
kaspro/
├── supabase/
│   └── schema.sql          ← Database schema + RLS + triggers
├── src/
│   ├── app/
│   │   ├── (auth)/         ← Halaman login, register, lupa password
│   │   ├── dashboard/      ← Dashboard utama
│   │   ├── transaksi/      ← List & filter transaksi
│   │   ├── kas/            ← Manajemen kas & rekening
│   │   ├── transfer/       ← Transfer antar kas
│   │   ├── kategori/       ← Manajemen kategori
│   │   ├── laporan/        ← Laporan & grafik
│   │   ├── unit-bisnis/    ← Multi cabang/booth
│   │   └── proyek/         ← Tracking per proyek/klien
│   ├── components/
│   │   ├── layout/         ← Sidebar, Topbar
│   │   ├── ui/             ← StatCard, TxItem, KasSaldoBar
│   │   ├── forms/          ← AddTxButton, KasForm, dll.
│   │   └── charts/         ← WeeklyChart, MonthlyChart, PieChart
│   ├── lib/
│   │   ├── actions/        ← Server Actions (transaksi, kas, dll.)
│   │   ├── supabase/       ← Client & server Supabase instance
│   │   └── utils.ts        ← Helper functions
│   ├── types/
│   │   └── index.ts        ← TypeScript types
│   └── middleware.ts        ← Auth guard (route protection)
├── .env.example
├── package.json
└── README.md
```

---

## ✨ Fitur

| Fitur | Status |
|-------|--------|
| 🔐 Auth (login, register, lupa password) | ✅ |
| 💰 Catat uang masuk & keluar | ✅ |
| 🏦 Multi kas (tunai, bank, e-wallet) | ✅ |
| 🔄 Transfer antar kas (atomic) | ✅ |
| 🏷️ Manajemen kategori | ✅ |
| 🏪 Multi unit bisnis / cabang | ✅ |
| 📁 Tracking per proyek / klien | ✅ |
| 📊 Dashboard & grafik | ✅ |
| 📈 Laporan bulanan & pie chart | ✅ |
| 🔒 Multi-tenant (data terisolasi per user) | ✅ |
| 📱 Responsive (mobile-first) | ✅ |
| 🌐 Deploy ke Vercel | ✅ |
| 📤 Export Excel / PDF | 🔜 Pro |
| 👥 Multi user / tim | 🔜 Pro |
| 🔔 Notifikasi WhatsApp | 🔜 Pro |

---

## 🧱 Database Schema

```
profiles       ← Data user (nama, bisnis, plan)
kas            ← Dompet/rekening (saldo auto-update via trigger)
kategori       ← Kategori transaksi per user
transaksi      ← Semua transaksi (trigger update saldo otomatis)
transfer       ← Transfer antar kas (atomic via RPC)
unit_bisnis    ← Cabang / booth
proyek         ← Proyek / klien
```

**Row Level Security (RLS)** aktif di semua tabel — setiap user hanya bisa mengakses data miliknya sendiri.

---

## 🔧 Konfigurasi Supabase Auth

Di Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://kaspro.vercel.app`
- **Redirect URLs**: `https://kaspro.vercel.app/**`

Untuk email reset password agar bekerja, aktifkan juga **SMTP** di Authentication → SMTP Settings.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS |
| Charts | Chart.js |
| Deployment | Vercel |
| Language | TypeScript |

---

## 📝 Lisensi

MIT — bebas digunakan dan dikembangkan.

---

Dibuat dengan ❤️ untuk UMKM Indonesia.
