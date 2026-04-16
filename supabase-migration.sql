-- ============================================================
-- PRAECOX / KASPRO — SQL Migration
-- Siap copas ke Supabase SQL Editor
-- ============================================================
-- Jalankan seluruh script ini sekaligus di:
--   Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 0. HELPER: pastikan ekstensi uuid tersedia
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ────────────────────────────────────────────────────────────
-- 1. PROFILES — tambah kolom no_whatsapp (jika belum ada)
-- ────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS no_whatsapp TEXT DEFAULT '';


-- ────────────────────────────────────────────────────────────
-- 2. SUPPLIER
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jenis       TEXT NOT NULL DEFAULT '',
  nama        TEXT NOT NULL,
  alamat      TEXT NOT NULL DEFAULT '',
  no_tlp      TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_user_id ON supplier(user_id);

-- RLS
ALTER TABLE supplier ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Supplier: user hanya lihat miliknya" ON supplier;
CREATE POLICY "Supplier: user hanya lihat miliknya"
  ON supplier FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Supplier: user bisa tambah" ON supplier;
CREATE POLICY "Supplier: user bisa tambah"
  ON supplier FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Supplier: user bisa edit miliknya" ON supplier;
CREATE POLICY "Supplier: user bisa edit miliknya"
  ON supplier FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Supplier: user bisa hapus miliknya" ON supplier;
CREATE POLICY "Supplier: user bisa hapus miliknya"
  ON supplier FOR DELETE
  USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 3. PENGGUNA TAMBAHAN (multi-user per akun)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pengguna_tambahan (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- user_id = pemilik/owner akun yang membuat pengguna ini
  nama            TEXT NOT NULL,
  email           TEXT NOT NULL,
  password_hash   TEXT NOT NULL DEFAULT '',
  peran           TEXT NOT NULL DEFAULT 'read_only',
  -- peran: 'read_only' | 'writer' | 'supervisor' | 'manager' | 'custom'
  permisi_custom  JSONB DEFAULT '{}'::jsonb,
  -- contoh: { "kas_id_1": { "lihat": true, "tambah": true, "edit": false, ... } }
  aktif           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pengguna_tambahan_user_id ON pengguna_tambahan(user_id);

-- RLS
ALTER TABLE pengguna_tambahan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PenggunaTambahan: owner lihat" ON pengguna_tambahan;
CREATE POLICY "PenggunaTambahan: owner lihat"
  ON pengguna_tambahan FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "PenggunaTambahan: owner tambah" ON pengguna_tambahan;
CREATE POLICY "PenggunaTambahan: owner tambah"
  ON pengguna_tambahan FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "PenggunaTambahan: owner edit" ON pengguna_tambahan;
CREATE POLICY "PenggunaTambahan: owner edit"
  ON pengguna_tambahan FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "PenggunaTambahan: owner hapus" ON pengguna_tambahan;
CREATE POLICY "PenggunaTambahan: owner hapus"
  ON pengguna_tambahan FOR DELETE
  USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 4. CATATAN (sticky notes)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catatan (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teks        TEXT NOT NULL DEFAULT '',
  warna       TEXT NOT NULL DEFAULT '#FFF9C4',
  -- warna hex: #FFF9C4 Kuning | #FFCDD2 Merah | #C8E6C9 Hijau
  --            #BBDEFB Biru   | #ECEFF1 Abu-Abu | #FFFFFF Putih
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catatan_user_id ON catatan(user_id);

-- RLS
ALTER TABLE catatan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Catatan: user lihat miliknya" ON catatan;
CREATE POLICY "Catatan: user lihat miliknya"
  ON catatan FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Catatan: user tambah" ON catatan;
CREATE POLICY "Catatan: user tambah"
  ON catatan FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Catatan: user edit" ON catatan;
CREATE POLICY "Catatan: user edit"
  ON catatan FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Catatan: user hapus" ON catatan;
CREATE POLICY "Catatan: user hapus"
  ON catatan FOR DELETE
  USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 5. UTANG
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS utang (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tanggal_awal  DATE NOT NULL DEFAULT CURRENT_DATE,
  jatuh_tempo   DATE,
  nominal       NUMERIC(15, 2) NOT NULL DEFAULT 0,
  klien         TEXT NOT NULL,
  deskripsi     TEXT NOT NULL DEFAULT '',
  kas_id        UUID REFERENCES kas(id) ON DELETE SET NULL,
  -- jika kas_id diisi → otomatis catat sebagai pemasukan di buku kas tsb
  status        TEXT NOT NULL DEFAULT 'belum_lunas',
  -- status: 'belum_lunas' | 'lunas'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_utang_user_id   ON utang(user_id);
CREATE INDEX IF NOT EXISTS idx_utang_status    ON utang(status);
CREATE INDEX IF NOT EXISTS idx_utang_tanggal   ON utang(tanggal_awal);

-- RLS
ALTER TABLE utang ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utang: user lihat" ON utang;
CREATE POLICY "Utang: user lihat"
  ON utang FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utang: user tambah" ON utang;
CREATE POLICY "Utang: user tambah"
  ON utang FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utang: user edit" ON utang;
CREATE POLICY "Utang: user edit"
  ON utang FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utang: user hapus" ON utang;
CREATE POLICY "Utang: user hapus"
  ON utang FOR DELETE
  USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 6. PIUTANG
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS piutang (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tanggal_awal  DATE NOT NULL DEFAULT CURRENT_DATE,
  jatuh_tempo   DATE,
  nominal       NUMERIC(15, 2) NOT NULL DEFAULT 0,
  klien         TEXT NOT NULL,
  deskripsi     TEXT NOT NULL DEFAULT '',
  kas_id        UUID REFERENCES kas(id) ON DELETE SET NULL,
  -- jika kas_id diisi → otomatis catat sebagai pengeluaran di buku kas tsb
  status        TEXT NOT NULL DEFAULT 'belum_lunas',
  -- status: 'belum_lunas' | 'lunas'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_piutang_user_id   ON piutang(user_id);
CREATE INDEX IF NOT EXISTS idx_piutang_status    ON piutang(status);
CREATE INDEX IF NOT EXISTS idx_piutang_tanggal   ON piutang(tanggal_awal);

-- RLS
ALTER TABLE piutang ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Piutang: user lihat" ON piutang;
CREATE POLICY "Piutang: user lihat"
  ON piutang FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Piutang: user tambah" ON piutang;
CREATE POLICY "Piutang: user tambah"
  ON piutang FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Piutang: user edit" ON piutang;
CREATE POLICY "Piutang: user edit"
  ON piutang FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Piutang: user hapus" ON piutang;
CREATE POLICY "Piutang: user hapus"
  ON piutang FOR DELETE
  USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 7. INVOICE (e-Invoice)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nomor       TEXT NOT NULL,
  tanggal     DATE NOT NULL DEFAULT CURRENT_DATE,
  pelanggan   TEXT NOT NULL,
  items       JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- items: [{ id, deskripsi, qty, hargaSatuan }]
  total       NUMERIC(15, 2) NOT NULL DEFAULT 0,
  catatan     TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'belum_lunas',
  -- status: 'belum_lunas' | 'lunas'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_user_id  ON invoice(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_tanggal  ON invoice(tanggal);
CREATE INDEX IF NOT EXISTS idx_invoice_status   ON invoice(status);

-- RLS
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Invoice: user lihat" ON invoice;
CREATE POLICY "Invoice: user lihat"
  ON invoice FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Invoice: user tambah" ON invoice;
CREATE POLICY "Invoice: user tambah"
  ON invoice FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Invoice: user edit" ON invoice;
CREATE POLICY "Invoice: user edit"
  ON invoice FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Invoice: user hapus" ON invoice;
CREATE POLICY "Invoice: user hapus"
  ON invoice FOR DELETE
  USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 8. TRIGGER: auto-update updated_at untuk supplier & catatan
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- supplier
DROP TRIGGER IF EXISTS trg_supplier_updated_at ON supplier;
CREATE TRIGGER trg_supplier_updated_at
  BEFORE UPDATE ON supplier
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- catatan
DROP TRIGGER IF EXISTS trg_catatan_updated_at ON catatan;
CREATE TRIGGER trg_catatan_updated_at
  BEFORE UPDATE ON catatan
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- pengguna_tambahan
DROP TRIGGER IF EXISTS trg_pengguna_tambahan_updated_at ON pengguna_tambahan;
CREATE TRIGGER trg_pengguna_tambahan_updated_at
  BEFORE UPDATE ON pengguna_tambahan
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ────────────────────────────────────────────────────────────
-- SELESAI ✓
-- ────────────────────────────────────────────────────────────
-- Tabel yang sudah dibuat/diperbarui:
--   ✓ profiles        → kolom no_whatsapp ditambahkan
--   ✓ supplier        → tabel baru + RLS
--   ✓ pengguna_tambahan → tabel baru + RLS
--   ✓ catatan         → tabel baru + RLS
--   ✓ utang           → tabel baru + RLS
--   ✓ piutang         → tabel baru + RLS
--   ✓ invoice         → tabel baru + RLS
--   ✓ trigger set_updated_at dipasang di supplier, catatan, pengguna_tambahan
-- ────────────────────────────────────────────────────────────
