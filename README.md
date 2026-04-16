# 💰 KASPRO V2.0 — Professional Accounting Suite

Transformasi aplikasi kas V1.0 menjadi sistem akuntansi profesional dengan double-entry accounting, Chart of Accounts (CoA) 7-digit, dan laporan keuangan standar.

**KASPRO V2.0** = Kas Management (V1) + Professional Accounting (V2) = Solusi keuangan lengkap.

Dibangun dengan **Next.js 15**, **React Server Components**, **Supabase PostgreSQL**, **Tailwind CSS**, dan **pgvector untuk RAG**.

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

### Langkah 3 — Setup Database V1.0 (Kas Management)

1. Buka **Supabase Dashboard → SQL Editor**
2. Klik **New Query**
3. Copy-paste seluruh isi file `supabase/schema.sql`
4. Klik **Run** — semua tabel V1.0 akan terbuat

### Langkah 3B — Setup Database V2.0 (Accounting)

1. Di **SQL Editor**, buat **New Query** baru
2. Copy-paste seluruh isi file `supabase/migration_v2.sql`
3. Klik **Run** — tabel CoA, Jurnal Memorial, dan functions akan terbuat

### Langkah 3C — Seed Data & Migration (Optional)

Jika sudah punya data transaksi V1.0 yang ingin dimigrasikan:

1. **Seed CoA Default**: Di SQL Editor, jalankan:
   ```sql
   SELECT seed_coa_default('YOUR_USER_ID');
   ```

2. **Setup Migration Functions**: Copy-paste file `supabase/migration_v2_data.sql`

3. **Preview Migrasi**:
   ```sql
   SELECT * FROM migrate_transaksi_to_jurnal('YOUR_USER_ID', true);
   ```

4. **Run Migration**:
   ```sql
   SELECT * FROM migrate_transaksi_to_jurnal('YOUR_USER_ID', false);
   ```

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

## 📚 KASPRO V2.0 Features Guide

### **Akuntansi Menu** (`/akuntansi`)

Sidebar → **Akuntansi** (menu baru di V2.0) terdiri dari 4 halaman:

#### **1. Chart of Accounts** (`/akuntansi/coa`)

**Chart of Accounts (CoA)** adalah standar akun dengan format **7-digit: X.X.XX.XXX**

Struktur Klasifikasi:
```
1 = ASET (Current Assets, Fixed Assets)
2 = KEWAJIBAN (Current Liabilities, Long-term Liabilities)
3 = EKUITAS (Modal, Retained Earnings)
4 = PENDAPATAN (Revenue, Sales)
5 = HPP (Cost of Goods Sold)
6 = BEBAN OPERASIONAL (Operating Expenses)
7 = PENDAPATAN LAIN (Other Income)
8 = BEBAN LAIN (Other Expenses)
9 = PAJAK (Taxes)
```

**Default CoA** tersedia ~100+ akun standar. Kamu bisa:
- ✅ Lihat daftar akun terstruktur (grouped by klasifikasi)
- ✅ Tambah akun custom dengan validasi format X.X.XX.XXX
- ✅ Link akun ke kas tertentu (untuk auto-journal)
- ✅ Tipe akun: Header (1.0.00.000) → Sub Header (1.1.00.000) → Detail (1.1.11.001)

#### **2. Jurnal Memorial** (`/akuntansi/jurnal`)

**Jurnal Memorial** adalah pencatatan transaksi double-entry (Debit/Kredit).

Setiap jurnal harus **balanced**: Total Debit = Total Kredit

**Fitur:**
- ✅ Buat jurnal dengan minimal 2 baris (1 debit, 1 kredit)
- ✅ AI-powered account search (pattern-based recommendation)
- ✅ Auto-validation: real-time debit/kredit balance checker
- ✅ Status: Draft → Posted → Void
- ✅ List jurnal dengan summary stats (Total, Posted, Draft, Void)
- ✅ Post jurnal (status: draft → posted, lock untuk edit)
- ✅ Void jurnal (reverse entries, maintain audit trail)

**Auto-Journal** (saat transaksi kas dibuat):
```
Transaksi Kas (V1) → Trigger → Jurnal Memorial (V2) otomatis
Contoh: Penjualan Rp 1.000.000 (kas)
  D: 1.1.11.001 Kas Utama          1.000.000
  K: 4.1.11.001 Pendapatan Usaha              1.000.000
```

#### **3. Neraca (Balance Sheet)** (`/akuntansi/neraca`)

**Neraca** adalah laporan posisi keuangan per tanggal tertentu.

Persamaan Akuntansi:
```
ASET = KEWAJIBAN + EKUITAS

Contoh:
Total Aset           : Rp 100.000.000
Total Kewajiban      : Rp  30.000.000
Total Ekuitas        : Rp  70.000.000
                       ─────────────── +
                       Rp 100.000.000 ✓ SEIMBANG
```

**Halaman Neraca menampilkan:**
- ✅ Stat cards: Total Aset, Kewajiban, Ekuitas, Balance Indicator (🟢 Seimbang / 🔴 Tidak)
- ✅ Dua kolom:
  - **ASET** (Kiri): Aset Lancar + Aset Tetap
  - **KEWAJIBAN + EKUITAS** (Kanan): Hutang + Modal
- ✅ Detail setiap akun dengan saldo terkini
- ✅ Real-time calculation dari jurnal yang sudah di-post

#### **4. Laba Rugi (Income Statement)** (`/akuntansi/laba-rugi`)

**Laba Rugi (P&L)** adalah laporan kinerja keuangan periode tertentu.

Struktur:
```
PENDAPATAN (4.x)                    : Rp 50.000.000
(─) HPP (5.x)                       : Rp 20.000.000
────────────────────────────────────
= LABA KOTOR                        : Rp 30.000.000

(─) BEBAN OPERASIONAL (6.x)         : Rp 10.000.000
────────────────────────────────────
= LABA OPERASIONAL                  : Rp 20.000.000

(+) PENDAPATAN LAIN (7.x)           : Rp  2.000.000
(─) BEBAN LAIN (8.x)                : Rp  1.000.000
────────────────────────────────────
= LABA BERSIH                       : Rp 21.000.000 ✓ UNTUNG
```

**Halaman Laba Rugi menampilkan:**
- ✅ Stat cards: Total Pendapatan, Laba Bersih, Profit/Loss Indicator
- ✅ Struktur berjenjang: Pendapatan → HPP → Laba Kotor → Beban Ops → Laba Ops → Lain-lain → Laba Bersih
- ✅ 🟢 Profit (Laba) atau 🔴 Loss (Rugi) indicator
- ✅ Filterable by date range (dari - sampai)

---

### **V1 ↔ V2 Integration**

**Kategori V1 → CoA V2 Mapping:**
- Setiap kategori V1 di-map otomatis ke akun CoA V2
- Contoh: Kategori "Gaji" → CoA "6.1.31.001 Gaji Karyawan"
- Saat transaksi kas dibuat, auto-generate jurnal dengan mapping ini

**Data Migration:**
- Script `migration_v2_data.sql` handle full V1→V2 migration
- 9 transaksi V1 kamu sudah dimigrasikan → 9 jurnal V2
- Support dry-run preview sebelum actual migration

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
│   ├── schema.sql              ← V1.0: Database schema (kas, kategori, transaksi)
│   ├── migration_v2.sql        ← V2.0: DDL (CoA, Jurnal Memorial, functions)
│   └── migration_v2_data.sql   ← V2.0: Data migration scripts
├── src/
│   ├── app/
│   │   ├── (auth)/             ← Login, register, lupa password
│   │   ├── dashboard/          ← Dashboard V2.0 (V1 stats + V2 neraca/laba-rugi)
│   │   ├── transaksi/          ← Transaksi kas (V1)
│   │   ├── kas/                ← Manajemen kas (V1)
│   │   ├── transfer/           ← Transfer antar kas (V1)
│   │   ├── kategori/           ← Kategori transaksi (V1)
│   │   ├── laporan/            ← Laporan V1 (grafik, bulanan)
│   │   ├── unit-bisnis/        ← Multi cabang (V1)
│   │   ├── proyek/             ← Tracking proyek (V1)
│   │   └── akuntansi/          ← V2.0 Accounting Menu
│   │       ├── coa/            ← Chart of Accounts (7-digit: X.X.XX.XXX)
│   │       ├── jurnal/         ← Jurnal Memorial (double-entry)
│   │       ├── neraca/         ← Balance Sheet (Aset = Kewajiban + Ekuitas)
│   │       └── laba-rugi/      ← Income Statement (P&L)
│   ├── components/
│   │   ├── layout/             ← Sidebar (updated: Akuntansi section), Topbar
│   │   ├── ui/                 ← StatCard, TxItem, KasSaldoBar
│   │   ├── forms/              ← AddTxButton, KasForm, CoAForm, JurnalMemorialForm
│   │   └── charts/             ← WeeklyChart, MonthlyChart
│   ├── lib/
│   │   ├── actions/
│   │   │   ├── index.ts        ← V1.0 CRUD (kas, kategori, transaksi, dll.)
│   │   │   ├── transaksi.ts    ← V1.0 transaction actions
│   │   │   ├── auth.ts         ← Auth server actions
│   │   │   ├── akuntansi.ts    ← V2.0 accounting actions (CoA, Jurnal, Neraca, P&L)
│   │   │   └── rag.ts          ← V2.0 RAG & AI account recommendation
│   │   ├── supabase/           ← Supabase client instances
│   │   └── utils.ts            ← Helper functions
│   ├── types/
│   │   └── index.ts            ← TypeScript (V1 + V2.0 types)
│   └── middleware.ts            ← Auth guard (simplified for dev)
├── scripts/
│   └── vps_deploy.py           ← VPS deployment helper
├── .env.example
├── package.json
└── README.md
```

---

## ✨ Fitur

### **V1.0 — Kas Management (Existing)**

| Fitur | Status |
|-------|--------|
| 🔐 Auth (login, register, lupa password) | ✅ |
| 💰 Catat uang masuk & keluar (kas) | ✅ |
| 🏦 Multi kas (tunai, bank, e-wallet) | ✅ |
| 🔄 Transfer antar kas (atomic) | ✅ |
| 🏷️ Manajemen kategori | ✅ |
| 🏪 Multi unit bisnis / cabang | ✅ |
| 📁 Tracking per proyek / klien | ✅ |
| 📊 Dashboard & grafik | ✅ |
| 📈 Laporan bulanan & pie chart | ✅ |
| 🔒 Multi-tenant (data terisolasi per user) | ✅ |
| 📱 Responsive (mobile-first) | ✅ |

### **V2.0 — Professional Accounting (NEW)**

| Fitur | Status |
|-------|--------|
| 📊 Chart of Accounts (7-digit: X.X.XX.XXX) | ✅ |
| 📝 Jurnal Memorial (double-entry: D/K) | ✅ |
| 📋 Balance Sheet (Neraca: A = K + E) | ✅ |
| 📈 Income Statement (Laba Rugi: P&L) | ✅ |
| 🔗 Auto Journal dari Transaksi Kas | ✅ |
| 🏷️ Kategori → CoA Mapping | ✅ |
| 💾 V1→V2 Data Migration Script | ✅ |
| 🤖 AI Account Recommendation (RAG) | ✅ (Pattern-based, RAG ready) |
| 🔍 Semantic Search (pgvector) | ✅ (Ready, awaiting embeddings) |
| 📤 Export Excel / PDF | 🔜 |
| 👥 Multi user / tim | 🔜 |
| 🔔 Notifikasi WhatsApp | 🔜 |

### **Deployment**

| Platform | Status |
|----------|--------|
| 🌐 Vercel | ✅ |
| 🖥️ Self-hosted (VPS + aPanel) | ✅ |
| 🐳 Docker | 🔜 |

---

## 🧱 Database Schema

### **V1.0 Tables**

```
profiles       ← Data user (nama, bisnis, plan)
kas            ← Dompet/rekening (saldo auto-update via trigger)
kategori       ← Kategori transaksi per user
transaksi      ← Semua transaksi (trigger update saldo otomatis)
transfer       ← Transfer antar kas (atomic via RPC)
unit_bisnis    ← Cabang / booth
proyek         ← Proyek / klien
```

### **V2.0 Tables (Accounting)**

```
chart_of_accounts          ← CoA 7-digit (kode, nama, klasifikasi 1-9, saldo_normal)
jurnal_memorial            ← Jurnal (nomor, tanggal, total_debit, total_kredit, status)
jurnal_memorial_detail     ← Jurnal lines (coa_id, debit, kredit, keterangan)
kategori_coa_mapping       ← V1 Kategori → V2 CoA linking
coa_embeddings             ← pgvector embeddings untuk semantic search RAG
audit_trail                ← Audit log (create, update, delete, post, void)
```

### **V2.0 Functions**

```
seed_coa_default()                 ← Seed 100+ default CoA accounts
generate_nomor_jurnal()            ← Auto-generate journal numbers (JM-YYYYMM-XXX)
post_jurnal_memorial()             ← Post journal (draft→posted, update saldo)
void_jurnal_memorial()             ← Void journal (posted→void, reverse saldo)
get_neraca()                       ← Balance Sheet calculation
get_laba_rugi()                    ← P&L calculation
search_coa_semantic()              ← Semantic CoA search via pgvector
migrate_kategori_to_coa()          ← Auto-map V1 kategori → V2 CoA
migrate_transaksi_to_jurnal()      ← Migrate V1 transaksi → V2 jurnal
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
| Framework | Next.js 15 (App Router, RSC) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (JWT) |
| Server Actions | Next.js Server Actions |
| Styling | Tailwind CSS 3 + CSS Variables |
| Charts | Chart.js |
| Vector DB | pgvector (RAG ready) |
| Language | TypeScript |
| Deployment | Vercel, Self-hosted (VPS + aPanel) |

### **Key Packages**

```json
{
  "next": "^15.x",
  "@supabase/auth-js": "^2.x",
  "@supabase/supabase-js": "^2.x",
  "tailwindcss": "^3.x",
  "chart.js": "^4.x",
  "react": "^19.x"
}
```

---

## 📝 Lisensi

MIT — bebas digunakan dan dikembangkan.

---

Dibuat dengan cinta yang amat besar untuk Istriku Nia Permatasari ❤️ dan Calon Anakku ❤️ yang aku tunggu kedatangannya dengan sangat Bahagia - 6 April 2026
