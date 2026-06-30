-- ============================================================
-- MIGRATION: Tambah kolom waktu (jam:menit) ke transaksi
-- Jalankan di: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.transaksi
  ADD COLUMN IF NOT EXISTS waktu TIME DEFAULT NULL;

COMMENT ON COLUMN public.transaksi.waktu IS 'Jam transaksi (HH:MM), opsional';
