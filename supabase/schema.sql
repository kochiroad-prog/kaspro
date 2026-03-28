-- ============================================================
-- KasPro - Database Schema + RLS
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABEL PROFILES (extend auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  nama_bisnis TEXT DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','admin','staff')),
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','enterprise')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL UNIT BISNIS (cabang/booth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.unit_bisnis (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama       TEXT NOT NULL,
  alamat     TEXT DEFAULT '',
  deskripsi  TEXT DEFAULT '',
  aktif      BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL PROYEK
-- ============================================================
CREATE TABLE IF NOT EXISTS public.proyek (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama         TEXT NOT NULL,
  nama_client  TEXT DEFAULT '',
  deskripsi    TEXT DEFAULT '',
  tgl_mulai    DATE,
  tgl_selesai  DATE,
  status       TEXT DEFAULT 'aktif' CHECK (status IN ('aktif','selesai','dibatalkan')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL KAS (wallets)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kas (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama       TEXT NOT NULL,
  tipe       TEXT NOT NULL DEFAULT 'tunai' CHECK (tipe IN ('tunai','bank','ewallet','lainnya')),
  saldo      BIGINT NOT NULL DEFAULT 0,  -- dalam Rupiah (integer, hindari float)
  aktif      BOOLEAN DEFAULT TRUE,
  warna      TEXT DEFAULT '#1a7f5a',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL KATEGORI
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kategori (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama       TEXT NOT NULL,
  tipe       TEXT NOT NULL CHECK (tipe IN ('pemasukan','pengeluaran')),
  ikon       TEXT DEFAULT '💰',
  warna      TEXT DEFAULT '#1a7f5a',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL TRANSAKSI
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transaksi (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kas_id          UUID NOT NULL REFERENCES public.kas(id) ON DELETE RESTRICT,
  kategori_id     UUID REFERENCES public.kategori(id) ON DELETE SET NULL,
  unit_bisnis_id  UUID REFERENCES public.unit_bisnis(id) ON DELETE SET NULL,
  proyek_id       UUID REFERENCES public.proyek(id) ON DELETE SET NULL,
  tipe            TEXT NOT NULL CHECK (tipe IN ('pemasukan','pengeluaran')),
  jumlah          BIGINT NOT NULL CHECK (jumlah > 0),
  catatan         TEXT DEFAULT '',
  tanggal         DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL TRANSFER ANTAR KAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transfer (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dari_kas_id UUID NOT NULL REFERENCES public.kas(id) ON DELETE RESTRICT,
  ke_kas_id   UUID NOT NULL REFERENCES public.kas(id) ON DELETE RESTRICT,
  jumlah      BIGINT NOT NULL CHECK (jumlah > 0),
  catatan     TEXT DEFAULT '',
  tanggal     DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT transfer_kas_berbeda CHECK (dari_kas_id != ke_kas_id)
);

-- ============================================================
-- INDEXES untuk performa query
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transaksi_user    ON public.transaksi(user_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON public.transaksi(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_transaksi_tipe    ON public.transaksi(tipe);
CREATE INDEX IF NOT EXISTS idx_transaksi_kas     ON public.transaksi(kas_id);
CREATE INDEX IF NOT EXISTS idx_kas_user          ON public.kas(user_id);
CREATE INDEX IF NOT EXISTS idx_kategori_user     ON public.kategori(user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_user     ON public.transfer(user_id);
CREATE INDEX IF NOT EXISTS idx_unit_bisnis_user  ON public.unit_bisnis(user_id);
CREATE INDEX IF NOT EXISTS idx_proyek_user       ON public.proyek(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Multi-tenant isolation
-- ============================================================
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kategori    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_bisnis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyek      ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "User hanya bisa lihat profilnya sendiri"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "User bisa update profilnya sendiri"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- KAS
CREATE POLICY "User hanya bisa lihat kasnya sendiri"
  ON public.kas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User bisa insert kas"
  ON public.kas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User bisa update kasnya sendiri"
  ON public.kas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User bisa hapus kasnya sendiri"
  ON public.kas FOR DELETE USING (auth.uid() = user_id);

-- KATEGORI
CREATE POLICY "User hanya bisa lihat kategorinya sendiri"
  ON public.kategori FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User bisa insert kategori"
  ON public.kategori FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User bisa update kategorinya sendiri"
  ON public.kategori FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User bisa hapus kategorinya sendiri"
  ON public.kategori FOR DELETE USING (auth.uid() = user_id);

-- TRANSAKSI
CREATE POLICY "User hanya bisa lihat transaksinya sendiri"
  ON public.transaksi FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User bisa insert transaksi"
  ON public.transaksi FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User bisa update transaksinya sendiri"
  ON public.transaksi FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User bisa hapus transaksinya sendiri"
  ON public.transaksi FOR DELETE USING (auth.uid() = user_id);

-- TRANSFER
CREATE POLICY "User hanya bisa lihat transfernya sendiri"
  ON public.transfer FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User bisa insert transfer"
  ON public.transfer FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User bisa hapus transfernya sendiri"
  ON public.transfer FOR DELETE USING (auth.uid() = user_id);

-- UNIT BISNIS
CREATE POLICY "User hanya bisa lihat unit bisnisnya sendiri"
  ON public.unit_bisnis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User bisa insert unit bisnis"
  ON public.unit_bisnis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User bisa update unit bisnisnya sendiri"
  ON public.unit_bisnis FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User bisa hapus unit bisnisnya sendiri"
  ON public.unit_bisnis FOR DELETE USING (auth.uid() = user_id);

-- PROYEK
CREATE POLICY "User hanya bisa lihat proyeknya sendiri"
  ON public.proyek FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User bisa insert proyek"
  ON public.proyek FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User bisa update proyeknya sendiri"
  ON public.proyek FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User bisa hapus proyeknya sendiri"
  ON public.proyek FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile saat user register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update saldo kas secara otomatis saat transaksi INSERT
CREATE OR REPLACE FUNCTION public.update_saldo_on_transaksi()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipe = 'pemasukan' THEN
    UPDATE public.kas SET saldo = saldo + NEW.jumlah, updated_at = NOW()
    WHERE id = NEW.kas_id;
  ELSIF NEW.tipe = 'pengeluaran' THEN
    UPDATE public.kas SET saldo = saldo - NEW.jumlah, updated_at = NOW()
    WHERE id = NEW.kas_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update saldo kas saat transaksi DELETE
CREATE OR REPLACE FUNCTION public.revert_saldo_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.tipe = 'pemasukan' THEN
    UPDATE public.kas SET saldo = saldo - OLD.jumlah, updated_at = NOW()
    WHERE id = OLD.kas_id;
  ELSIF OLD.tipe = 'pengeluaran' THEN
    UPDATE public.kas SET saldo = saldo + OLD.jumlah, updated_at = NOW()
    WHERE id = OLD.kas_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update saldo kas saat transaksi UPDATE
CREATE OR REPLACE FUNCTION public.update_saldo_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Revert saldo lama
  IF OLD.tipe = 'pemasukan' THEN
    UPDATE public.kas SET saldo = saldo - OLD.jumlah WHERE id = OLD.kas_id;
  ELSE
    UPDATE public.kas SET saldo = saldo + OLD.jumlah WHERE id = OLD.kas_id;
  END IF;
  -- Apply saldo baru
  IF NEW.tipe = 'pemasukan' THEN
    UPDATE public.kas SET saldo = saldo + NEW.jumlah, updated_at = NOW() WHERE id = NEW.kas_id;
  ELSE
    UPDATE public.kas SET saldo = saldo - NEW.jumlah, updated_at = NOW() WHERE id = NEW.kas_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger transaksi
CREATE OR REPLACE TRIGGER trg_saldo_insert
  AFTER INSERT ON public.transaksi
  FOR EACH ROW EXECUTE FUNCTION public.update_saldo_on_transaksi();

CREATE OR REPLACE TRIGGER trg_saldo_delete
  AFTER DELETE ON public.transaksi
  FOR EACH ROW EXECUTE FUNCTION public.revert_saldo_on_delete();

CREATE OR REPLACE TRIGGER trg_saldo_update
  AFTER UPDATE ON public.transaksi
  FOR EACH ROW EXECUTE FUNCTION public.update_saldo_on_update();

-- Function transfer antar kas (atomic)
CREATE OR REPLACE FUNCTION public.proses_transfer(
  p_user_id    UUID,
  p_dari_kas   UUID,
  p_ke_kas     UUID,
  p_jumlah     BIGINT,
  p_catatan    TEXT,
  p_tanggal    DATE
)
RETURNS JSON AS $$
DECLARE
  v_saldo_asal BIGINT;
  v_transfer_id UUID;
BEGIN
  -- Cek saldo mencukupi
  SELECT saldo INTO v_saldo_asal FROM public.kas WHERE id = p_dari_kas AND user_id = p_user_id;
  IF v_saldo_asal < p_jumlah THEN
    RETURN json_build_object('error', 'Saldo tidak mencukupi');
  END IF;

  -- Kurangi saldo kas asal
  UPDATE public.kas SET saldo = saldo - p_jumlah, updated_at = NOW()
  WHERE id = p_dari_kas AND user_id = p_user_id;

  -- Tambah saldo kas tujuan
  UPDATE public.kas SET saldo = saldo + p_jumlah, updated_at = NOW()
  WHERE id = p_ke_kas AND user_id = p_user_id;

  -- Catat di tabel transfer
  INSERT INTO public.transfer (user_id, dari_kas_id, ke_kas_id, jumlah, catatan, tanggal)
  VALUES (p_user_id, p_dari_kas, p_ke_kas, p_jumlah, p_catatan, p_tanggal)
  RETURNING id INTO v_transfer_id;

  RETURN json_build_object('success', true, 'transfer_id', v_transfer_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEED DATA: Kategori default saat user baru daftar
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_kategori_default(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.kategori (user_id, nama, tipe, ikon) VALUES
    (p_user_id, 'Penjualan',         'pemasukan',   '🛒'),
    (p_user_id, 'Jasa',              'pemasukan',   '🔧'),
    (p_user_id, 'Piutang Masuk',     'pemasukan',   '💵'),
    (p_user_id, 'Pendapatan Lain',   'pemasukan',   '💰'),
    (p_user_id, 'Belanja Bahan',     'pengeluaran', '🧺'),
    (p_user_id, 'Gaji Karyawan',     'pengeluaran', '👤'),
    (p_user_id, 'Sewa Tempat',       'pengeluaran', '🏠'),
    (p_user_id, 'Listrik & Air',     'pengeluaran', '⚡'),
    (p_user_id, 'Operasional',       'pengeluaran', '⚙️'),
    (p_user_id, 'Transport',         'pengeluaran', '🚗'),
    (p_user_id, 'Marketing',         'pengeluaran', '📢'),
    (p_user_id, 'Pengeluaran Lain',  'pengeluaran', '📦');

  INSERT INTO public.kas (user_id, nama, tipe, saldo) VALUES
    (p_user_id, 'Kas Tunai', 'tunai', 0);

  INSERT INTO public.unit_bisnis (user_id, nama) VALUES
    (p_user_id, 'Toko Utama');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
