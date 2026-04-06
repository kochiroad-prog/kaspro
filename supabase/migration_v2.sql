-- ============================================================
-- KASPRO V2.0 - Migration Script
-- Double-Entry Accounting System with CoA & RAG
-- Jalankan di Supabase SQL Editor SETELAH schema.sql V1.0
-- ============================================================

-- ============================================================
-- 1. ENABLE EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for RAG

-- ============================================================
-- 2. CHART OF ACCOUNTS (CoA) - 7 Digit (X.X.XX.XXX)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kode          TEXT NOT NULL,             -- Format: X.X.XX.XXX (e.g. 1.1.11.001)
  nama          TEXT NOT NULL,             -- Nama akun
  tipe_akun     TEXT NOT NULL CHECK (tipe_akun IN (
    'header',        -- Header utama (e.g. 1.0.00.000 ASET)
    'sub_header',    -- Sub-header (e.g. 1.1.00.000 Aset Lancar)
    'detail'         -- Detail / leaf account (e.g. 1.1.11.001 Kas Utama)
  )),
  klasifikasi   INT NOT NULL CHECK (klasifikasi BETWEEN 1 AND 9),
  -- 1=Aset, 2=Kewajiban, 3=Ekuitas, 4=Pendapatan, 5=HPP, 6=Beban Operasional,
  -- 7=Pendapatan Lain, 8=Beban Lain, 9=Pajak
  saldo_normal  TEXT NOT NULL CHECK (saldo_normal IN ('debit', 'kredit')),
  parent_kode   TEXT,                      -- Kode parent (null for header)
  is_kas        BOOLEAN DEFAULT FALSE,     -- Apakah akun ini terkait kas/bank?
  kas_id        UUID REFERENCES public.kas(id) ON DELETE SET NULL, -- Link ke tabel kas V1
  aktif         BOOLEAN DEFAULT TRUE,
  deskripsi     TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, kode)
);

-- ============================================================
-- 3. JURNAL MEMORIAL (Double-Entry Journal)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jurnal_memorial (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nomor         TEXT NOT NULL,             -- Nomor jurnal auto-generated (JM-YYYYMM-XXX)
  tanggal       DATE NOT NULL DEFAULT CURRENT_DATE,
  keterangan    TEXT NOT NULL DEFAULT '',
  reff          TEXT DEFAULT '',           -- Referensi dokumen internal
  total_debit   BIGINT NOT NULL DEFAULT 0,
  total_kredit  BIGINT NOT NULL DEFAULT 0,
  is_balanced   BOOLEAN GENERATED ALWAYS AS (total_debit = total_kredit) STORED,
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'void')),
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. JURNAL MEMORIAL DETAIL (Line Items)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jurnal_memorial_detail (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jurnal_id       UUID NOT NULL REFERENCES public.jurnal_memorial(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coa_id          UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
  kode_akun       TEXT NOT NULL,           -- Denormalized for quick display
  nama_akun       TEXT NOT NULL,           -- Denormalized for quick display
  debit           BIGINT NOT NULL DEFAULT 0,
  kredit          BIGINT NOT NULL DEFAULT 0,
  keterangan      TEXT DEFAULT '',
  kode_kas        TEXT DEFAULT 'kosongan', -- 'kosongan' atau ID kas tertentu
  urutan          INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. MAPPING KATEGORI V1 -> COA V2
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kategori_coa_mapping (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kategori_id   UUID NOT NULL REFERENCES public.kategori(id) ON DELETE CASCADE,
  coa_id        UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, kategori_id)
);

-- ============================================================
-- 6. TRANSAKSI V2 (Enhanced - link ke CoA)
-- Tambah kolom coa_id ke tabel transaksi existing
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transaksi' AND column_name = 'coa_id'
  ) THEN
    ALTER TABLE public.transaksi
      ADD COLUMN coa_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transaksi' AND column_name = 'jurnal_id'
  ) THEN
    ALTER TABLE public.transaksi
      ADD COLUMN jurnal_id UUID REFERENCES public.jurnal_memorial(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 7. COA EMBEDDINGS (for RAG / Semantic Search)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coa_embeddings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coa_id        UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,             -- Combined: kode + nama + deskripsi
  embedding     vector(384),              -- Using all-MiniLM-L6-v2 (384 dimensions)
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, coa_id)
);

-- ============================================================
-- 8. AUDIT TRAIL
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_trail (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tabel         TEXT NOT NULL,
  record_id     UUID NOT NULL,
  aksi          TEXT NOT NULL CHECK (aksi IN ('create', 'update', 'delete', 'post', 'void')),
  data_lama     JSONB,
  data_baru     JSONB,
  keterangan    TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. INDEXES for V2.0
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_coa_user        ON public.chart_of_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_coa_kode        ON public.chart_of_accounts(kode);
CREATE INDEX IF NOT EXISTS idx_coa_klasifikasi ON public.chart_of_accounts(klasifikasi);
CREATE INDEX IF NOT EXISTS idx_coa_parent      ON public.chart_of_accounts(parent_kode);

CREATE INDEX IF NOT EXISTS idx_jurnal_user     ON public.jurnal_memorial(user_id);
CREATE INDEX IF NOT EXISTS idx_jurnal_tanggal  ON public.jurnal_memorial(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_jurnal_status   ON public.jurnal_memorial(status);

CREATE INDEX IF NOT EXISTS idx_jmd_jurnal      ON public.jurnal_memorial_detail(jurnal_id);
CREATE INDEX IF NOT EXISTS idx_jmd_coa         ON public.jurnal_memorial_detail(coa_id);
CREATE INDEX IF NOT EXISTS idx_jmd_user        ON public.jurnal_memorial_detail(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_user      ON public.audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_tabel     ON public.audit_trail(tabel);
CREATE INDEX IF NOT EXISTS idx_audit_record    ON public.audit_trail(record_id);

CREATE INDEX IF NOT EXISTS idx_transaksi_coa   ON public.transaksi(coa_id);

-- ============================================================
-- 10. ROW LEVEL SECURITY for V2.0 Tables
-- ============================================================
ALTER TABLE public.chart_of_accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurnal_memorial      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurnal_memorial_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kategori_coa_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coa_embeddings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail          ENABLE ROW LEVEL SECURITY;

-- COA Policies
CREATE POLICY "coa_select" ON public.chart_of_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "coa_insert" ON public.chart_of_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coa_update" ON public.chart_of_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "coa_delete" ON public.chart_of_accounts FOR DELETE USING (auth.uid() = user_id);

-- Jurnal Memorial Policies
CREATE POLICY "jm_select" ON public.jurnal_memorial FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "jm_insert" ON public.jurnal_memorial FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "jm_update" ON public.jurnal_memorial FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "jm_delete" ON public.jurnal_memorial FOR DELETE USING (auth.uid() = user_id);

-- Jurnal Detail Policies
CREATE POLICY "jmd_select" ON public.jurnal_memorial_detail FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "jmd_insert" ON public.jurnal_memorial_detail FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "jmd_update" ON public.jurnal_memorial_detail FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "jmd_delete" ON public.jurnal_memorial_detail FOR DELETE USING (auth.uid() = user_id);

-- Mapping Policies
CREATE POLICY "kcm_select" ON public.kategori_coa_mapping FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "kcm_insert" ON public.kategori_coa_mapping FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "kcm_update" ON public.kategori_coa_mapping FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "kcm_delete" ON public.kategori_coa_mapping FOR DELETE USING (auth.uid() = user_id);

-- Embeddings Policies
CREATE POLICY "emb_select" ON public.coa_embeddings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "emb_insert" ON public.coa_embeddings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "emb_update" ON public.coa_embeddings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "emb_delete" ON public.coa_embeddings FOR DELETE USING (auth.uid() = user_id);

-- Audit Policies
CREATE POLICY "audit_select" ON public.audit_trail FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "audit_insert" ON public.audit_trail FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 11. FUNCTIONS V2.0
-- ============================================================

-- Auto-generate nomor jurnal memorial
CREATE OR REPLACE FUNCTION public.generate_nomor_jurnal(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_count INT;
BEGIN
  v_prefix := 'JM-' || TO_CHAR(NOW(), 'YYYYMM') || '-';
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.jurnal_memorial
  WHERE user_id = p_user_id
    AND nomor LIKE v_prefix || '%';
  RETURN v_prefix || LPAD(v_count::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Post jurnal memorial (validate balanced & update status)
CREATE OR REPLACE FUNCTION public.post_jurnal_memorial(p_jurnal_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_jurnal RECORD;
  v_total_d BIGINT;
  v_total_k BIGINT;
BEGIN
  SELECT * INTO v_jurnal FROM public.jurnal_memorial
  WHERE id = p_jurnal_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Jurnal tidak ditemukan');
  END IF;

  IF v_jurnal.status = 'posted' THEN
    RETURN json_build_object('error', 'Jurnal sudah diposting');
  END IF;

  -- Hitung ulang total
  SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(kredit), 0)
  INTO v_total_d, v_total_k
  FROM public.jurnal_memorial_detail
  WHERE jurnal_id = p_jurnal_id;

  IF v_total_d != v_total_k THEN
    RETURN json_build_object('error', 'Jurnal tidak seimbang: Debit=' || v_total_d || ' Kredit=' || v_total_k);
  END IF;

  IF v_total_d = 0 THEN
    RETURN json_build_object('error', 'Jurnal tidak boleh kosong');
  END IF;

  -- Update jurnal
  UPDATE public.jurnal_memorial
  SET status = 'posted',
      total_debit = v_total_d,
      total_kredit = v_total_k,
      updated_at = NOW()
  WHERE id = p_jurnal_id AND user_id = p_user_id;

  -- Audit trail
  INSERT INTO public.audit_trail (user_id, tabel, record_id, aksi, data_baru, keterangan)
  VALUES (p_user_id, 'jurnal_memorial', p_jurnal_id, 'post',
    json_build_object('total_debit', v_total_d, 'total_kredit', v_total_k)::jsonb,
    'Jurnal memorial diposting');

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Void jurnal memorial
CREATE OR REPLACE FUNCTION public.void_jurnal_memorial(p_jurnal_id UUID, p_user_id UUID)
RETURNS JSON AS $$
BEGIN
  UPDATE public.jurnal_memorial
  SET status = 'void', updated_at = NOW()
  WHERE id = p_jurnal_id AND user_id = p_user_id AND status = 'posted';

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Jurnal tidak ditemukan atau belum diposting');
  END IF;

  INSERT INTO public.audit_trail (user_id, tabel, record_id, aksi, keterangan)
  VALUES (p_user_id, 'jurnal_memorial', p_jurnal_id, 'void', 'Jurnal memorial di-void');

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get saldo akun (sum debit - kredit for debit-normal, or kredit - debit for kredit-normal)
CREATE OR REPLACE FUNCTION public.get_saldo_akun(
  p_user_id UUID,
  p_coa_id UUID,
  p_sampai_tanggal DATE DEFAULT CURRENT_DATE
)
RETURNS BIGINT AS $$
DECLARE
  v_saldo_normal TEXT;
  v_total_debit BIGINT;
  v_total_kredit BIGINT;
BEGIN
  SELECT saldo_normal INTO v_saldo_normal
  FROM public.chart_of_accounts WHERE id = p_coa_id AND user_id = p_user_id;

  SELECT COALESCE(SUM(d.debit), 0), COALESCE(SUM(d.kredit), 0)
  INTO v_total_debit, v_total_kredit
  FROM public.jurnal_memorial_detail d
  JOIN public.jurnal_memorial j ON j.id = d.jurnal_id
  WHERE d.coa_id = p_coa_id
    AND d.user_id = p_user_id
    AND j.status = 'posted'
    AND j.tanggal <= p_sampai_tanggal;

  IF v_saldo_normal = 'debit' THEN
    RETURN v_total_debit - v_total_kredit;
  ELSE
    RETURN v_total_kredit - v_total_debit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get neraca (balance sheet)
CREATE OR REPLACE FUNCTION public.get_neraca(p_user_id UUID, p_tanggal DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  v_aset BIGINT;
  v_kewajiban BIGINT;
  v_ekuitas BIGINT;
BEGIN
  -- Total Aset (klasifikasi 1)
  SELECT COALESCE(SUM(
    CASE WHEN c.saldo_normal = 'debit' THEN d.debit - d.kredit ELSE d.kredit - d.debit END
  ), 0) INTO v_aset
  FROM public.jurnal_memorial_detail d
  JOIN public.jurnal_memorial j ON j.id = d.jurnal_id
  JOIN public.chart_of_accounts c ON c.id = d.coa_id
  WHERE d.user_id = p_user_id AND j.status = 'posted' AND j.tanggal <= p_tanggal
    AND c.klasifikasi = 1 AND c.tipe_akun = 'detail';

  -- Total Kewajiban (klasifikasi 2)
  SELECT COALESCE(SUM(d.kredit - d.debit), 0) INTO v_kewajiban
  FROM public.jurnal_memorial_detail d
  JOIN public.jurnal_memorial j ON j.id = d.jurnal_id
  JOIN public.chart_of_accounts c ON c.id = d.coa_id
  WHERE d.user_id = p_user_id AND j.status = 'posted' AND j.tanggal <= p_tanggal
    AND c.klasifikasi = 2 AND c.tipe_akun = 'detail';

  -- Total Ekuitas (klasifikasi 3)
  SELECT COALESCE(SUM(d.kredit - d.debit), 0) INTO v_ekuitas
  FROM public.jurnal_memorial_detail d
  JOIN public.jurnal_memorial j ON j.id = d.jurnal_id
  JOIN public.chart_of_accounts c ON c.id = d.coa_id
  WHERE d.user_id = p_user_id AND j.status = 'posted' AND j.tanggal <= p_tanggal
    AND c.klasifikasi = 3 AND c.tipe_akun = 'detail';

  RETURN json_build_object(
    'total_aset', v_aset,
    'total_kewajiban', v_kewajiban,
    'total_ekuitas', v_ekuitas,
    'balanced', (v_aset = v_kewajiban + v_ekuitas)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get laba rugi (profit & loss)
CREATE OR REPLACE FUNCTION public.get_laba_rugi(
  p_user_id UUID,
  p_dari DATE,
  p_sampai DATE
)
RETURNS JSON AS $$
DECLARE
  v_pendapatan BIGINT;
  v_hpp BIGINT;
  v_beban_ops BIGINT;
  v_pendapatan_lain BIGINT;
  v_beban_lain BIGINT;
BEGIN
  -- Pendapatan (klas 4)
  SELECT COALESCE(SUM(d.kredit - d.debit), 0) INTO v_pendapatan
  FROM public.jurnal_memorial_detail d
  JOIN public.jurnal_memorial j ON j.id = d.jurnal_id
  JOIN public.chart_of_accounts c ON c.id = d.coa_id
  WHERE d.user_id = p_user_id AND j.status = 'posted'
    AND j.tanggal BETWEEN p_dari AND p_sampai
    AND c.klasifikasi = 4 AND c.tipe_akun = 'detail';

  -- HPP (klas 5)
  SELECT COALESCE(SUM(d.debit - d.kredit), 0) INTO v_hpp
  FROM public.jurnal_memorial_detail d
  JOIN public.jurnal_memorial j ON j.id = d.jurnal_id
  JOIN public.chart_of_accounts c ON c.id = d.coa_id
  WHERE d.user_id = p_user_id AND j.status = 'posted'
    AND j.tanggal BETWEEN p_dari AND p_sampai
    AND c.klasifikasi = 5 AND c.tipe_akun = 'detail';

  -- Beban Operasional (klas 6)
  SELECT COALESCE(SUM(d.debit - d.kredit), 0) INTO v_beban_ops
  FROM public.jurnal_memorial_detail d
  JOIN public.jurnal_memorial j ON j.id = d.jurnal_id
  JOIN public.chart_of_accounts c ON c.id = d.coa_id
  WHERE d.user_id = p_user_id AND j.status = 'posted'
    AND j.tanggal BETWEEN p_dari AND p_sampai
    AND c.klasifikasi = 6 AND c.tipe_akun = 'detail';

  -- Pendapatan Lain (klas 7)
  SELECT COALESCE(SUM(d.kredit - d.debit), 0) INTO v_pendapatan_lain
  FROM public.jurnal_memorial_detail d
  JOIN public.jurnal_memorial j ON j.id = d.jurnal_id
  JOIN public.chart_of_accounts c ON c.id = d.coa_id
  WHERE d.user_id = p_user_id AND j.status = 'posted'
    AND j.tanggal BETWEEN p_dari AND p_sampai
    AND c.klasifikasi = 7 AND c.tipe_akun = 'detail';

  -- Beban Lain (klas 8)
  SELECT COALESCE(SUM(d.debit - d.kredit), 0) INTO v_beban_lain
  FROM public.jurnal_memorial_detail d
  JOIN public.jurnal_memorial j ON j.id = d.jurnal_id
  JOIN public.chart_of_accounts c ON c.id = d.coa_id
  WHERE d.user_id = p_user_id AND j.status = 'posted'
    AND j.tanggal BETWEEN p_dari AND p_sampai
    AND c.klasifikasi = 8 AND c.tipe_akun = 'detail';

  RETURN json_build_object(
    'pendapatan', v_pendapatan,
    'hpp', v_hpp,
    'laba_kotor', v_pendapatan - v_hpp,
    'beban_operasional', v_beban_ops,
    'laba_operasional', v_pendapatan - v_hpp - v_beban_ops,
    'pendapatan_lain', v_pendapatan_lain,
    'beban_lain', v_beban_lain,
    'laba_bersih', v_pendapatan - v_hpp - v_beban_ops + v_pendapatan_lain - v_beban_lain
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Semantic search for CoA (RAG)
CREATE OR REPLACE FUNCTION public.search_coa_semantic(
  p_user_id UUID,
  p_query_embedding vector(384),
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  coa_id UUID,
  kode TEXT,
  nama TEXT,
  deskripsi TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.coa_id,
    c.kode,
    c.nama,
    c.deskripsi,
    1 - (e.embedding <=> p_query_embedding) AS similarity
  FROM public.coa_embeddings e
  JOIN public.chart_of_accounts c ON c.id = e.coa_id
  WHERE e.user_id = p_user_id
    AND c.aktif = TRUE
    AND c.tipe_akun = 'detail'
  ORDER BY e.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 12. SEED DEFAULT COA for new user
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_coa_default(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- ==================== ASET (1) ====================
  INSERT INTO public.chart_of_accounts (user_id, kode, nama, tipe_akun, klasifikasi, saldo_normal, parent_kode, is_kas, deskripsi) VALUES
  -- Header
  (p_user_id, '1.0.00.000', 'ASET',                    'header',     1, 'debit', NULL,         FALSE, 'Seluruh harta perusahaan'),
  -- Sub-header: Aset Lancar
  (p_user_id, '1.1.00.000', 'Aset Lancar',             'sub_header', 1, 'debit', '1.0.00.000', FALSE, 'Aset yang mudah dicairkan < 1 tahun'),
  -- Detail: Kas & Bank
  (p_user_id, '1.1.11.001', 'Kas Utama (IDR)',         'detail',     1, 'debit', '1.1.00.000', TRUE,  'Kas tunai utama dalam Rupiah'),
  (p_user_id, '1.1.11.002', 'Bank BRI',                'detail',     1, 'debit', '1.1.00.000', TRUE,  'Rekening Bank BRI'),
  (p_user_id, '1.1.11.003', 'Bank BCA',                'detail',     1, 'debit', '1.1.00.000', TRUE,  'Rekening Bank BCA'),
  (p_user_id, '1.1.11.004', 'E-Wallet (GoPay/OVO)',    'detail',     1, 'debit', '1.1.00.000', TRUE,  'Saldo dompet digital'),
  -- Detail: Piutang
  (p_user_id, '1.1.21.001', 'Piutang Dagang Lokal',    'detail',     1, 'debit', '1.1.00.000', FALSE, 'Piutang dari pelanggan lokal'),
  (p_user_id, '1.1.21.002', 'Piutang Karyawan',        'detail',     1, 'debit', '1.1.00.000', FALSE, 'Piutang / kasbon karyawan'),
  -- Detail: Persediaan
  (p_user_id, '1.1.31.001', 'Persediaan Barang Dagang','detail',     1, 'debit', '1.1.00.000', FALSE, 'Stok barang untuk dijual'),
  -- Detail: Biaya Dibayar Dimuka
  (p_user_id, '1.1.41.001', 'Sewa Dibayar Dimuka',     'detail',     1, 'debit', '1.1.00.000', FALSE, 'Sewa yang belum jatuh tempo'),
  (p_user_id, '1.1.41.002', 'Asuransi Dibayar Dimuka', 'detail',     1, 'debit', '1.1.00.000', FALSE, 'Premi asuransi yang belum jatuh tempo'),
  -- Sub-header: Aset Tetap
  (p_user_id, '1.2.00.000', 'Aset Tetap',              'sub_header', 1, 'debit', '1.0.00.000', FALSE, 'Aset jangka panjang > 1 tahun'),
  (p_user_id, '1.2.11.001', 'Peralatan Kantor',        'detail',     1, 'debit', '1.2.00.000', FALSE, 'Meja, kursi, printer, laptop'),
  (p_user_id, '1.2.11.002', 'Kendaraan',               'detail',     1, 'debit', '1.2.00.000', FALSE, 'Kendaraan operasional'),
  (p_user_id, '1.2.11.003', 'Bangunan',                'detail',     1, 'debit', '1.2.00.000', FALSE, 'Bangunan milik perusahaan'),
  -- Kontra akun: Akumulasi Penyusutan
  (p_user_id, '1.2.21.101', 'Akum. Penyusutan Peralatan','detail',   1, 'kredit','1.2.00.000', FALSE, 'Kontra akun penyusutan peralatan'),
  (p_user_id, '1.2.21.102', 'Akum. Penyusutan Kendaraan','detail',   1, 'kredit','1.2.00.000', FALSE, 'Kontra akun penyusutan kendaraan'),
  (p_user_id, '1.2.21.103', 'Akum. Penyusutan Bangunan','detail',    1, 'kredit','1.2.00.000', FALSE, 'Kontra akun penyusutan bangunan'),

  -- ==================== KEWAJIBAN (2) ====================
  (p_user_id, '2.0.00.000', 'KEWAJIBAN',               'header',     2, 'kredit', NULL,         FALSE, 'Seluruh utang perusahaan'),
  (p_user_id, '2.1.00.000', 'Kewajiban Jangka Pendek', 'sub_header', 2, 'kredit', '2.0.00.000', FALSE, 'Utang jatuh tempo < 1 tahun'),
  (p_user_id, '2.1.11.001', 'Utang Usaha Lokal',       'detail',     2, 'kredit', '2.1.00.000', FALSE, 'Utang ke supplier lokal'),
  (p_user_id, '2.1.21.001', 'Utang Gaji',              'detail',     2, 'kredit', '2.1.00.000', FALSE, 'Gaji karyawan yang belum dibayar'),
  (p_user_id, '2.1.31.001', 'Utang Pajak',             'detail',     2, 'kredit', '2.1.00.000', FALSE, 'Pajak yang harus disetor'),
  (p_user_id, '2.1.41.001', 'Biaya Listrik & Air ymh Dibayar', 'detail', 2, 'kredit', '2.1.00.000', FALSE, 'Accrued utilities'),
  (p_user_id, '2.2.00.000', 'Kewajiban Jangka Panjang','sub_header', 2, 'kredit', '2.0.00.000', FALSE, 'Utang jatuh tempo > 1 tahun'),
  (p_user_id, '2.2.11.001', 'Utang Bank Jangka Panjang','detail',    2, 'kredit', '2.2.00.000', FALSE, 'Pinjaman bank > 1 tahun'),

  -- ==================== EKUITAS (3) ====================
  (p_user_id, '3.0.00.000', 'EKUITAS',                 'header',     3, 'kredit', NULL,         FALSE, 'Modal pemilik'),
  (p_user_id, '3.1.00.000', 'Modal & Laba Ditahan',    'sub_header', 3, 'kredit', '3.0.00.000', FALSE, ''),
  (p_user_id, '3.1.11.001', 'Modal Disetor',           'detail',     3, 'kredit', '3.1.00.000', FALSE, 'Modal awal pemilik'),
  (p_user_id, '3.1.21.001', 'Laba Ditahan',            'detail',     3, 'kredit', '3.1.00.000', FALSE, 'Akumulasi laba tahun lalu'),
  (p_user_id, '3.1.21.002', 'Laba Tahun Berjalan',     'detail',     3, 'kredit', '3.1.00.000', FALSE, 'Laba periode berjalan'),
  (p_user_id, '3.1.31.001', 'Prive / Drawing',         'detail',     3, 'debit',  '3.1.00.000', FALSE, 'Penarikan modal oleh pemilik'),

  -- ==================== PENDAPATAN (4) ====================
  (p_user_id, '4.0.00.000', 'PENDAPATAN',              'header',     4, 'kredit', NULL,         FALSE, 'Pendapatan operasional'),
  (p_user_id, '4.1.00.000', 'Pendapatan Usaha',        'sub_header', 4, 'kredit', '4.0.00.000', FALSE, ''),
  (p_user_id, '4.1.11.001', 'Penjualan Produk Lokal',  'detail',     4, 'kredit', '4.1.00.000', FALSE, 'Penjualan barang dagangan'),
  (p_user_id, '4.1.11.002', 'Pendapatan Jasa',         'detail',     4, 'kredit', '4.1.00.000', FALSE, 'Pendapatan dari layanan jasa'),
  (p_user_id, '4.1.21.001', 'Diskon Penjualan',        'detail',     4, 'debit',  '4.1.00.000', FALSE, 'Kontra pendapatan — potongan harga'),
  (p_user_id, '4.1.21.002', 'Retur Penjualan',         'detail',     4, 'debit',  '4.1.00.000', FALSE, 'Kontra pendapatan — barang dikembalikan'),

  -- ==================== HPP (5) ====================
  (p_user_id, '5.0.00.000', 'HARGA POKOK PENJUALAN',   'header',     5, 'debit', NULL,         FALSE, 'Cost of goods sold'),
  (p_user_id, '5.1.00.000', 'HPP',                     'sub_header', 5, 'debit', '5.0.00.000', FALSE, ''),
  (p_user_id, '5.1.11.001', 'HPP Barang Dagang',       'detail',     5, 'debit', '5.1.00.000', FALSE, 'Harga pokok barang yang terjual'),
  (p_user_id, '5.1.11.002', 'Biaya Bahan Baku',        'detail',     5, 'debit', '5.1.00.000', FALSE, 'Bahan baku produksi'),

  -- ==================== BEBAN OPERASIONAL (6) ====================
  (p_user_id, '6.0.00.000', 'BEBAN OPERASIONAL',       'header',     6, 'debit', NULL,         FALSE, 'Beban untuk kegiatan operasional'),
  (p_user_id, '6.1.00.000', 'Beban Penjualan',         'sub_header', 6, 'debit', '6.0.00.000', FALSE, ''),
  (p_user_id, '6.1.11.001', 'Beban Marketing & Iklan', 'detail',     6, 'debit', '6.1.00.000', FALSE, 'Biaya promosi dan periklanan'),
  (p_user_id, '6.1.11.002', 'Beban Pengiriman',        'detail',     6, 'debit', '6.1.00.000', FALSE, 'Biaya ekspedisi / kurir'),
  (p_user_id, '6.2.00.000', 'Beban Umum & Administrasi','sub_header',6, 'debit', '6.0.00.000', FALSE, ''),
  (p_user_id, '6.2.11.001', 'Beban Listrik, Air & Telepon','detail', 6, 'debit', '6.2.00.000', FALSE, 'Utilities bulanan'),
  (p_user_id, '6.2.11.002', 'Beban Sewa',              'detail',     6, 'debit', '6.2.00.000', FALSE, 'Sewa tempat usaha'),
  (p_user_id, '6.2.11.003', 'Beban Gaji & Tunjangan',  'detail',     6, 'debit', '6.2.00.000', FALSE, 'Gaji karyawan + tunjangan'),
  (p_user_id, '6.2.11.004', 'Beban Penyusutan Aset Tetap','detail',  6, 'debit', '6.2.00.000', FALSE, 'Depresiasi aset tetap'),
  (p_user_id, '6.2.11.005', 'Beban Operasional Lain',  'detail',     6, 'debit', '6.2.00.000', FALSE, 'Beban operasional tidak terkategori'),
  (p_user_id, '6.2.11.006', 'Beban Transport',         'detail',     6, 'debit', '6.2.00.000', FALSE, 'Biaya transportasi operasional'),
  (p_user_id, '6.2.11.007', 'Beban ATK & Perlengkapan','detail',     6, 'debit', '6.2.00.000', FALSE, 'Alat tulis kantor dan perlengkapan'),

  -- ==================== PENDAPATAN LAIN (7) ====================
  (p_user_id, '7.0.00.000', 'PENDAPATAN LAIN-LAIN',    'header',     7, 'kredit', NULL,         FALSE, 'Pendapatan di luar operasi utama'),
  (p_user_id, '7.1.00.000', 'Pendapatan Non-Operasional','sub_header',7, 'kredit', '7.0.00.000', FALSE, ''),
  (p_user_id, '7.1.11.001', 'Pendapatan Bunga Bank',   'detail',     7, 'kredit', '7.1.00.000', FALSE, 'Bunga deposito/tabungan'),
  (p_user_id, '7.1.11.002', 'Pendapatan Lain-lain',    'detail',     7, 'kredit', '7.1.00.000', FALSE, 'Pendapatan non-operasional lainnya'),

  -- ==================== BEBAN LAIN (8) ====================
  (p_user_id, '8.0.00.000', 'BEBAN LAIN-LAIN',         'header',     8, 'debit', NULL,         FALSE, 'Beban di luar operasi utama'),
  (p_user_id, '8.1.00.000', 'Beban Non-Operasional',   'sub_header', 8, 'debit', '8.0.00.000', FALSE, ''),
  (p_user_id, '8.1.11.001', 'Beban Bunga Pinjaman',    'detail',     8, 'debit', '8.1.00.000', FALSE, 'Bunga pinjaman bank'),
  (p_user_id, '8.1.11.002', 'Beban Administrasi Bank', 'detail',     8, 'debit', '8.1.00.000', FALSE, 'Biaya admin rekening bank'),
  (p_user_id, '8.1.11.003', 'Rugi Selisih Kurs',       'detail',     8, 'debit', '8.1.00.000', FALSE, 'Kerugian dari perbedaan kurs'),

  -- ==================== PAJAK (9) ====================
  (p_user_id, '9.0.00.000', 'PAJAK PENGHASILAN',       'header',     9, 'debit', NULL,         FALSE, 'Beban pajak penghasilan badan'),
  (p_user_id, '9.1.00.000', 'Pajak',                   'sub_header', 9, 'debit', '9.0.00.000', FALSE, ''),
  (p_user_id, '9.1.11.001', 'Beban Pajak Penghasilan', 'detail',     9, 'debit', '9.1.00.000', FALSE, 'PPh Badan');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 13. AUTO-CREATE JURNAL FROM KAS TRANSACTION
-- Creates double-entry journal from V1 style kas transactions
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_jurnal_from_transaksi()
RETURNS TRIGGER AS $$
DECLARE
  v_coa_kas_id UUID;
  v_coa_lawan_id UUID;
  v_jurnal_id UUID;
  v_nomor TEXT;
BEGIN
  -- Find kas-linked CoA account
  SELECT id INTO v_coa_kas_id
  FROM public.chart_of_accounts
  WHERE user_id = NEW.user_id AND kas_id = NEW.kas_id AND is_kas = TRUE
  LIMIT 1;

  -- Find counter CoA from mapping (if kategori exists)
  IF NEW.kategori_id IS NOT NULL THEN
    SELECT m.coa_id INTO v_coa_lawan_id
    FROM public.kategori_coa_mapping m
    WHERE m.user_id = NEW.user_id AND m.kategori_id = NEW.kategori_id;
  END IF;

  -- Use the coa_id from transaction if provided directly
  IF NEW.coa_id IS NOT NULL THEN
    v_coa_lawan_id := NEW.coa_id;
  END IF;

  -- Only auto-journal if both accounts are found
  IF v_coa_kas_id IS NOT NULL AND v_coa_lawan_id IS NOT NULL THEN
    v_nomor := public.generate_nomor_jurnal(NEW.user_id);

    INSERT INTO public.jurnal_memorial (user_id, nomor, tanggal, keterangan, reff, total_debit, total_kredit, status, created_by)
    VALUES (NEW.user_id, v_nomor, NEW.tanggal,
      COALESCE(NEW.catatan, 'Auto-jurnal dari transaksi kas'),
      'TX-' || LEFT(NEW.id::TEXT, 8),
      NEW.jumlah, NEW.jumlah, 'posted', NEW.user_id)
    RETURNING id INTO v_jurnal_id;

    IF NEW.tipe = 'pemasukan' THEN
      -- Debit Kas, Kredit Pendapatan
      INSERT INTO public.jurnal_memorial_detail (jurnal_id, user_id, coa_id, kode_akun, nama_akun, debit, kredit, kode_kas)
      SELECT v_jurnal_id, NEW.user_id, v_coa_kas_id, c.kode, c.nama, NEW.jumlah, 0, NEW.kas_id::TEXT
      FROM public.chart_of_accounts c WHERE c.id = v_coa_kas_id;

      INSERT INTO public.jurnal_memorial_detail (jurnal_id, user_id, coa_id, kode_akun, nama_akun, debit, kredit, kode_kas)
      SELECT v_jurnal_id, NEW.user_id, v_coa_lawan_id, c.kode, c.nama, 0, NEW.jumlah, 'kosongan'
      FROM public.chart_of_accounts c WHERE c.id = v_coa_lawan_id;
    ELSE
      -- Debit Beban, Kredit Kas
      INSERT INTO public.jurnal_memorial_detail (jurnal_id, user_id, coa_id, kode_akun, nama_akun, debit, kredit, kode_kas)
      SELECT v_jurnal_id, NEW.user_id, v_coa_lawan_id, c.kode, c.nama, NEW.jumlah, 0, 'kosongan'
      FROM public.chart_of_accounts c WHERE c.id = v_coa_lawan_id;

      INSERT INTO public.jurnal_memorial_detail (jurnal_id, user_id, coa_id, kode_akun, nama_akun, debit, kredit, kode_kas)
      SELECT v_jurnal_id, NEW.user_id, v_coa_kas_id, c.kode, c.nama, 0, NEW.jumlah, NEW.kas_id::TEXT
      FROM public.chart_of_accounts c WHERE c.id = v_coa_kas_id;
    END IF;

    -- Link jurnal back to transaksi
    UPDATE public.transaksi SET jurnal_id = v_jurnal_id WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto create journal on new transaction
CREATE OR REPLACE TRIGGER trg_auto_jurnal
  AFTER INSERT ON public.transaksi
  FOR EACH ROW EXECUTE FUNCTION public.auto_jurnal_from_transaksi();
