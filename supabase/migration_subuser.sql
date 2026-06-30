-- ============================================================
-- MIGRATION: Sub-User (Pengguna Tambahan) Login Support
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── 1. Tambah kolom auth_user_id ke pengguna_tambahan ─────────────────────
ALTER TABLE pengguna_tambahan
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pengguna_tambahan_auth_user_id
  ON pengguna_tambahan(auth_user_id);

-- ─── 2. Fungsi get_owner_id() ───────────────────────────────────────────────
-- Mengembalikan user_id owner jika yang login adalah sub-user,
-- atau auth.uid() jika yang login adalah owner biasa.
CREATE OR REPLACE FUNCTION public.get_owner_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT user_id
      FROM pengguna_tambahan
      WHERE auth_user_id = auth.uid()
        AND aktif = true
      LIMIT 1
    ),
    auth.uid()
  );
$$;

-- ─── 3. Update RLS: profiles ────────────────────────────────────────────────
DROP POLICY IF EXISTS "User hanya bisa lihat profilnya sendiri" ON public.profiles;
CREATE POLICY "User hanya bisa lihat profilnya sendiri"
  ON public.profiles FOR SELECT
  USING (id = get_owner_id());

-- UPDATE tetap hanya untuk owner asli
DROP POLICY IF EXISTS "User bisa update profilnya sendiri" ON public.profiles;
CREATE POLICY "User bisa update profilnya sendiri"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─── 4. Update RLS: kas ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "User hanya bisa lihat kasnya sendiri" ON public.kas;
CREATE POLICY "User hanya bisa lihat kasnya sendiri"
  ON public.kas FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa insert kas" ON public.kas;
CREATE POLICY "User bisa insert kas"
  ON public.kas FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa update kasnya sendiri" ON public.kas;
CREATE POLICY "User bisa update kasnya sendiri"
  ON public.kas FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa hapus kasnya sendiri" ON public.kas;
CREATE POLICY "User bisa hapus kasnya sendiri"
  ON public.kas FOR DELETE USING (get_owner_id() = user_id);

-- ─── 5. Update RLS: kategori ────────────────────────────────────────────────
DROP POLICY IF EXISTS "User hanya bisa lihat kategorinya sendiri" ON public.kategori;
CREATE POLICY "User hanya bisa lihat kategorinya sendiri"
  ON public.kategori FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa insert kategori" ON public.kategori;
CREATE POLICY "User bisa insert kategori"
  ON public.kategori FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa update kategorinya sendiri" ON public.kategori;
CREATE POLICY "User bisa update kategorinya sendiri"
  ON public.kategori FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa hapus kategorinya sendiri" ON public.kategori;
CREATE POLICY "User bisa hapus kategorinya sendiri"
  ON public.kategori FOR DELETE USING (get_owner_id() = user_id);

-- ─── 6. Update RLS: transaksi ───────────────────────────────────────────────
DROP POLICY IF EXISTS "User hanya bisa lihat transaksinya sendiri" ON public.transaksi;
CREATE POLICY "User hanya bisa lihat transaksinya sendiri"
  ON public.transaksi FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa insert transaksi" ON public.transaksi;
CREATE POLICY "User bisa insert transaksi"
  ON public.transaksi FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa update transaksinya sendiri" ON public.transaksi;
CREATE POLICY "User bisa update transaksinya sendiri"
  ON public.transaksi FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa hapus transaksinya sendiri" ON public.transaksi;
CREATE POLICY "User bisa hapus transaksinya sendiri"
  ON public.transaksi FOR DELETE USING (get_owner_id() = user_id);

-- ─── 7. Update RLS: transfer ────────────────────────────────────────────────
DROP POLICY IF EXISTS "User hanya bisa lihat transfernya sendiri" ON public.transfer;
CREATE POLICY "User hanya bisa lihat transfernya sendiri"
  ON public.transfer FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa insert transfer" ON public.transfer;
CREATE POLICY "User bisa insert transfer"
  ON public.transfer FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa hapus transfernya sendiri" ON public.transfer;
CREATE POLICY "User bisa hapus transfernya sendiri"
  ON public.transfer FOR DELETE USING (get_owner_id() = user_id);

-- ─── 8. Update RLS: unit_bisnis ─────────────────────────────────────────────
DROP POLICY IF EXISTS "User hanya bisa lihat unit bisnisnya sendiri" ON public.unit_bisnis;
CREATE POLICY "User hanya bisa lihat unit bisnisnya sendiri"
  ON public.unit_bisnis FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa insert unit bisnis" ON public.unit_bisnis;
CREATE POLICY "User bisa insert unit bisnis"
  ON public.unit_bisnis FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa update unit bisnisnya sendiri" ON public.unit_bisnis;
CREATE POLICY "User bisa update unit bisnisnya sendiri"
  ON public.unit_bisnis FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa hapus unit bisnisnya sendiri" ON public.unit_bisnis;
CREATE POLICY "User bisa hapus unit bisnisnya sendiri"
  ON public.unit_bisnis FOR DELETE USING (get_owner_id() = user_id);

-- ─── 9. Update RLS: proyek ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "User hanya bisa lihat proyeknya sendiri" ON public.proyek;
CREATE POLICY "User hanya bisa lihat proyeknya sendiri"
  ON public.proyek FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa insert proyek" ON public.proyek;
CREATE POLICY "User bisa insert proyek"
  ON public.proyek FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa update proyeknya sendiri" ON public.proyek;
CREATE POLICY "User bisa update proyeknya sendiri"
  ON public.proyek FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "User bisa hapus proyeknya sendiri" ON public.proyek;
CREATE POLICY "User bisa hapus proyeknya sendiri"
  ON public.proyek FOR DELETE USING (get_owner_id() = user_id);

-- ─── 10. Update RLS: supplier ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Supplier: user hanya lihat miliknya" ON public.supplier;
CREATE POLICY "Supplier: user hanya lihat miliknya"
  ON public.supplier FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "Supplier: user bisa tambah" ON public.supplier;
CREATE POLICY "Supplier: user bisa tambah"
  ON public.supplier FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "Supplier: user bisa edit miliknya" ON public.supplier;
CREATE POLICY "Supplier: user bisa edit miliknya"
  ON public.supplier FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "Supplier: user bisa hapus miliknya" ON public.supplier;
CREATE POLICY "Supplier: user bisa hapus miliknya"
  ON public.supplier FOR DELETE USING (get_owner_id() = user_id);

-- ─── 11. Update RLS: pengguna_tambahan ──────────────────────────────────────
DROP POLICY IF EXISTS "PenggunaTambahan: owner lihat" ON public.pengguna_tambahan;
CREATE POLICY "PenggunaTambahan: owner lihat"
  ON public.pengguna_tambahan FOR SELECT
  -- owner lihat semua sub-usernya, sub-user lihat record miliknya sendiri
  USING (auth.uid() = user_id OR auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "PenggunaTambahan: owner tambah" ON public.pengguna_tambahan;
CREATE POLICY "PenggunaTambahan: owner tambah"
  ON public.pengguna_tambahan FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "PenggunaTambahan: owner edit" ON public.pengguna_tambahan;
CREATE POLICY "PenggunaTambahan: owner edit"
  ON public.pengguna_tambahan FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "PenggunaTambahan: owner hapus" ON public.pengguna_tambahan;
CREATE POLICY "PenggunaTambahan: owner hapus"
  ON public.pengguna_tambahan FOR DELETE
  USING (auth.uid() = user_id);

-- ─── 12. Update RLS: catatan ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Catatan: user lihat miliknya" ON public.catatan;
CREATE POLICY "Catatan: user lihat miliknya"
  ON public.catatan FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "Catatan: user tambah" ON public.catatan;
CREATE POLICY "Catatan: user tambah"
  ON public.catatan FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "Catatan: user edit" ON public.catatan;
CREATE POLICY "Catatan: user edit"
  ON public.catatan FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "Catatan: user hapus" ON public.catatan;
CREATE POLICY "Catatan: user hapus"
  ON public.catatan FOR DELETE USING (get_owner_id() = user_id);

-- ─── 13. Update RLS: utang ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Utang: user lihat" ON public.utang;
CREATE POLICY "Utang: user lihat"
  ON public.utang FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "Utang: user tambah" ON public.utang;
CREATE POLICY "Utang: user tambah"
  ON public.utang FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "Utang: user edit" ON public.utang;
CREATE POLICY "Utang: user edit"
  ON public.utang FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "Utang: user hapus" ON public.utang;
CREATE POLICY "Utang: user hapus"
  ON public.utang FOR DELETE USING (get_owner_id() = user_id);

-- ─── 14. Update RLS: piutang ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Piutang: user lihat" ON public.piutang;
CREATE POLICY "Piutang: user lihat"
  ON public.piutang FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "Piutang: user tambah" ON public.piutang;
CREATE POLICY "Piutang: user tambah"
  ON public.piutang FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "Piutang: user edit" ON public.piutang;
CREATE POLICY "Piutang: user edit"
  ON public.piutang FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "Piutang: user hapus" ON public.piutang;
CREATE POLICY "Piutang: user hapus"
  ON public.piutang FOR DELETE USING (get_owner_id() = user_id);

-- ─── 15. Update RLS: invoice ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Invoice: user lihat" ON public.invoice;
CREATE POLICY "Invoice: user lihat"
  ON public.invoice FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "Invoice: user tambah" ON public.invoice;
CREATE POLICY "Invoice: user tambah"
  ON public.invoice FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "Invoice: user edit" ON public.invoice;
CREATE POLICY "Invoice: user edit"
  ON public.invoice FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "Invoice: user hapus" ON public.invoice;
CREATE POLICY "Invoice: user hapus"
  ON public.invoice FOR DELETE USING (get_owner_id() = user_id);

-- ─── 16. Update RLS: tagihan_rutin ──────────────────────────────────────────
DROP POLICY IF EXISTS "TagihanRutin: user lihat" ON public.tagihan_rutin;
CREATE POLICY "TagihanRutin: user lihat"
  ON public.tagihan_rutin FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "TagihanRutin: user tambah" ON public.tagihan_rutin;
CREATE POLICY "TagihanRutin: user tambah"
  ON public.tagihan_rutin FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "TagihanRutin: user edit" ON public.tagihan_rutin;
CREATE POLICY "TagihanRutin: user edit"
  ON public.tagihan_rutin FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "TagihanRutin: user hapus" ON public.tagihan_rutin;
CREATE POLICY "TagihanRutin: user hapus"
  ON public.tagihan_rutin FOR DELETE USING (get_owner_id() = user_id);

-- ─── 17. Update RLS: chart_of_accounts ─────────────────────────────────────
DROP POLICY IF EXISTS "coa_select" ON public.chart_of_accounts;
CREATE POLICY "coa_select" ON public.chart_of_accounts FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "coa_insert" ON public.chart_of_accounts;
CREATE POLICY "coa_insert" ON public.chart_of_accounts FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "coa_update" ON public.chart_of_accounts;
CREATE POLICY "coa_update" ON public.chart_of_accounts FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "coa_delete" ON public.chart_of_accounts;
CREATE POLICY "coa_delete" ON public.chart_of_accounts FOR DELETE USING (get_owner_id() = user_id);

-- ─── 18. Update RLS: jurnal_memorial ────────────────────────────────────────
DROP POLICY IF EXISTS "jm_select" ON public.jurnal_memorial;
CREATE POLICY "jm_select" ON public.jurnal_memorial FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "jm_insert" ON public.jurnal_memorial;
CREATE POLICY "jm_insert" ON public.jurnal_memorial FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "jm_update" ON public.jurnal_memorial;
CREATE POLICY "jm_update" ON public.jurnal_memorial FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "jm_delete" ON public.jurnal_memorial;
CREATE POLICY "jm_delete" ON public.jurnal_memorial FOR DELETE USING (get_owner_id() = user_id);

-- ─── 19. Update RLS: jurnal_memorial_detail ─────────────────────────────────
DROP POLICY IF EXISTS "jmd_select" ON public.jurnal_memorial_detail;
CREATE POLICY "jmd_select" ON public.jurnal_memorial_detail FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "jmd_insert" ON public.jurnal_memorial_detail;
CREATE POLICY "jmd_insert" ON public.jurnal_memorial_detail FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "jmd_update" ON public.jurnal_memorial_detail;
CREATE POLICY "jmd_update" ON public.jurnal_memorial_detail FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "jmd_delete" ON public.jurnal_memorial_detail;
CREATE POLICY "jmd_delete" ON public.jurnal_memorial_detail FOR DELETE USING (get_owner_id() = user_id);

-- ─── 20. Update RLS: kategori_coa_mapping ───────────────────────────────────
DROP POLICY IF EXISTS "kcm_select" ON public.kategori_coa_mapping;
CREATE POLICY "kcm_select" ON public.kategori_coa_mapping FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "kcm_insert" ON public.kategori_coa_mapping;
CREATE POLICY "kcm_insert" ON public.kategori_coa_mapping FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "kcm_update" ON public.kategori_coa_mapping;
CREATE POLICY "kcm_update" ON public.kategori_coa_mapping FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "kcm_delete" ON public.kategori_coa_mapping;
CREATE POLICY "kcm_delete" ON public.kategori_coa_mapping FOR DELETE USING (get_owner_id() = user_id);

-- ─── 21. Update RLS: coa_embeddings ─────────────────────────────────────────
DROP POLICY IF EXISTS "emb_select" ON public.coa_embeddings;
CREATE POLICY "emb_select" ON public.coa_embeddings FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "emb_insert" ON public.coa_embeddings;
CREATE POLICY "emb_insert" ON public.coa_embeddings FOR INSERT WITH CHECK (get_owner_id() = user_id);

DROP POLICY IF EXISTS "emb_update" ON public.coa_embeddings;
CREATE POLICY "emb_update" ON public.coa_embeddings FOR UPDATE USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "emb_delete" ON public.coa_embeddings;
CREATE POLICY "emb_delete" ON public.coa_embeddings FOR DELETE USING (get_owner_id() = user_id);

-- ─── 22. Update RLS: audit_trail ────────────────────────────────────────────
DROP POLICY IF EXISTS "audit_select" ON public.audit_trail;
CREATE POLICY "audit_select" ON public.audit_trail FOR SELECT USING (get_owner_id() = user_id);

DROP POLICY IF EXISTS "audit_insert" ON public.audit_trail;
CREATE POLICY "audit_insert" ON public.audit_trail FOR INSERT WITH CHECK (get_owner_id() = user_id);

-- ─── 23. Update RLS: payroll (hanya jika tabel ada) ────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payroll') THEN
    ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "payroll_select" ON public.payroll;
    CREATE POLICY "payroll_select" ON public.payroll FOR SELECT USING (get_owner_id() = user_id);

    DROP POLICY IF EXISTS "payroll_insert" ON public.payroll;
    CREATE POLICY "payroll_insert" ON public.payroll FOR INSERT WITH CHECK (get_owner_id() = user_id);

    DROP POLICY IF EXISTS "payroll_update" ON public.payroll;
    CREATE POLICY "payroll_update" ON public.payroll FOR UPDATE USING (get_owner_id() = user_id);

    DROP POLICY IF EXISTS "payroll_delete" ON public.payroll;
    CREATE POLICY "payroll_delete" ON public.payroll FOR DELETE USING (get_owner_id() = user_id);
  END IF;
END $$;

-- ─── SELESAI ─────────────────────────────────────────────────────────────────
-- Selanjutnya:
-- 1. Tambahkan SUPABASE_SERVICE_ROLE_KEY ke .env.local
-- 2. Deploy kode terbaru (admin.ts + pengguna-tambahan.ts yang baru)
-- 3. Buat ulang pengguna tambahan yang sudah ada agar terdaftar ke Supabase Auth
