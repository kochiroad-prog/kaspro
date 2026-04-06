-- ============================================================
-- KasPro V2.0 — Data Migration Script
-- Migrasi data V1.0 ke V2.0 (Kategori → CoA Mapping + Jurnal otomatis)
-- ============================================================
-- CATATAN:
-- 1. Jalankan migration_v2.sql TERLEBIH DAHULU (DDL: tabel, fungsi, trigger)
-- 2. Jalankan seed_coa_default(user_id) untuk setiap user
-- 3. Baru jalankan script ini untuk mapping data lama
-- ============================================================

-- ============================================================
-- STEP 1: Auto-mapping Kategori V1 → CoA V2 berdasarkan pola nama
-- ============================================================

CREATE OR REPLACE FUNCTION migrate_kategori_to_coa(p_user_id UUID)
RETURNS TABLE(kategori_nama TEXT, coa_kode TEXT, coa_nama TEXT, mapped BOOLEAN) AS $$
DECLARE
  rec RECORD;
  target_coa RECORD;
  mapping_count INT := 0;
BEGIN
  -- Loop setiap kategori milik user
  FOR rec IN
    SELECT id, nama, tipe FROM kategori WHERE user_id = p_user_id
  LOOP
    target_coa := NULL;

    -- ===== PEMASUKAN → CoA Pendapatan (4.x) =====
    IF rec.tipe = 'pemasukan' THEN
      -- Cari akun pendapatan detail yang cocok
      SELECT * INTO target_coa
      FROM chart_of_accounts
      WHERE user_id = p_user_id
        AND klasifikasi = 4
        AND tipe_akun = 'detail'
        AND aktif = true
        AND (
          LOWER(nama) LIKE '%' || LOWER(rec.nama) || '%'
          OR LOWER(rec.nama) LIKE '%' || LOWER(nama) || '%'
        )
      ORDER BY kode ASC
      LIMIT 1;

      -- Fallback: gunakan akun pendapatan usaha generik
      IF target_coa IS NULL THEN
        SELECT * INTO target_coa
        FROM chart_of_accounts
        WHERE user_id = p_user_id
          AND klasifikasi = 4
          AND tipe_akun = 'detail'
          AND aktif = true
        ORDER BY kode ASC
        LIMIT 1;
      END IF;

    -- ===== PENGELUARAN → CoA Beban Operasional (6.x) =====
    ELSE
      -- Cari akun beban detail yang cocok via nama
      SELECT * INTO target_coa
      FROM chart_of_accounts
      WHERE user_id = p_user_id
        AND klasifikasi = 6
        AND tipe_akun = 'detail'
        AND aktif = true
        AND (
          LOWER(nama) LIKE '%' || LOWER(rec.nama) || '%'
          OR LOWER(rec.nama) LIKE '%' || LOWER(nama) || '%'
        )
      ORDER BY kode ASC
      LIMIT 1;

      -- Pattern-based matching untuk beban umum
      IF target_coa IS NULL THEN
        SELECT * INTO target_coa
        FROM chart_of_accounts
        WHERE user_id = p_user_id
          AND klasifikasi = 6
          AND tipe_akun = 'detail'
          AND aktif = true
          AND (
            (LOWER(rec.nama) LIKE '%gaji%' AND LOWER(nama) LIKE '%gaji%')
            OR (LOWER(rec.nama) LIKE '%sewa%' AND LOWER(nama) LIKE '%sewa%')
            OR (LOWER(rec.nama) LIKE '%listrik%' AND LOWER(nama) LIKE '%utilitas%')
            OR (LOWER(rec.nama) LIKE '%air%' AND LOWER(nama) LIKE '%utilitas%')
            OR (LOWER(rec.nama) LIKE '%internet%' AND LOWER(nama) LIKE '%utilitas%')
            OR (LOWER(rec.nama) LIKE '%telepon%' AND LOWER(nama) LIKE '%utilitas%')
            OR (LOWER(rec.nama) LIKE '%transport%' AND LOWER(nama) LIKE '%transport%')
            OR (LOWER(rec.nama) LIKE '%makan%' AND LOWER(nama) LIKE '%lain%')
            OR (LOWER(rec.nama) LIKE '%atk%' AND LOWER(nama) LIKE '%perlengkapan%')
            OR (LOWER(rec.nama) LIKE '%kantor%' AND LOWER(nama) LIKE '%perlengkapan%')
          )
        ORDER BY kode ASC
        LIMIT 1;
      END IF;

      -- Fallback: gunakan akun beban operasional generik
      IF target_coa IS NULL THEN
        SELECT * INTO target_coa
        FROM chart_of_accounts
        WHERE user_id = p_user_id
          AND klasifikasi = 6
          AND tipe_akun = 'detail'
          AND aktif = true
        ORDER BY kode ASC
        LIMIT 1;
      END IF;
    END IF;

    -- Insert mapping jika ada target CoA
    IF target_coa IS NOT NULL THEN
      INSERT INTO kategori_coa_mapping (user_id, kategori_id, coa_id)
      VALUES (p_user_id, rec.id, target_coa.id)
      ON CONFLICT (user_id, kategori_id) DO UPDATE SET coa_id = target_coa.id;

      mapping_count := mapping_count + 1;

      RETURN QUERY SELECT rec.nama::TEXT, target_coa.kode::TEXT, target_coa.nama::TEXT, true;
    ELSE
      RETURN QUERY SELECT rec.nama::TEXT, ''::TEXT, 'TIDAK DITEMUKAN'::TEXT, false;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- STEP 2: Migrasi transaksi historis → jurnal memorial
-- Membuat jurnal double-entry dari transaksi kas yang sudah ada
-- ============================================================

CREATE OR REPLACE FUNCTION migrate_transaksi_to_jurnal(
  p_user_id UUID,
  p_dry_run BOOLEAN DEFAULT true  -- TRUE = hanya preview, FALSE = benar-benar insert
)
RETURNS TABLE(
  tanggal DATE,
  tipe TEXT,
  jumlah BIGINT,
  catatan TEXT,
  akun_debit TEXT,
  akun_kredit TEXT,
  status TEXT
) AS $$
DECLARE
  rec RECORD;
  kas_coa RECORD;
  counter_coa RECORD;
  nomor_jurnal TEXT;
  v_jurnal_id UUID;
  total_migrated INT := 0;
BEGIN
  -- Loop transaksi yang belum punya jurnal_id
  FOR rec IN
    SELECT t.*, k.nama AS kas_nama, k.tipe AS kas_tipe,
           kat.nama AS kategori_nama, kat.tipe AS kategori_tipe
    FROM transaksi t
    LEFT JOIN kas k ON t.kas_id = k.id
    LEFT JOIN kategori kat ON t.kategori_id = kat.id
    WHERE t.user_id = p_user_id
      AND (t.jurnal_id IS NULL)
    ORDER BY t.tanggal ASC, t.created_at ASC
  LOOP
    -- Cari akun kas (CoA) yang terhubung ke kas ini
    SELECT * INTO kas_coa
    FROM chart_of_accounts
    WHERE user_id = p_user_id
      AND is_kas = true
      AND kas_id = rec.kas_id
      AND aktif = true
    LIMIT 1;

    -- Fallback: ambil kas umum (1.1.xx.xxx)
    IF kas_coa IS NULL THEN
      SELECT * INTO kas_coa
      FROM chart_of_accounts
      WHERE user_id = p_user_id
        AND klasifikasi = 1
        AND is_kas = true
        AND aktif = true
      ORDER BY kode ASC
      LIMIT 1;
    END IF;

    -- Fallback lagi: ambil akun aset pertama
    IF kas_coa IS NULL THEN
      SELECT * INTO kas_coa
      FROM chart_of_accounts
      WHERE user_id = p_user_id
        AND klasifikasi = 1
        AND tipe_akun = 'detail'
        AND aktif = true
      ORDER BY kode ASC
      LIMIT 1;
    END IF;

    -- Cari akun lawan (counter) via kategori_coa_mapping
    IF rec.kategori_id IS NOT NULL THEN
      SELECT c.* INTO counter_coa
      FROM kategori_coa_mapping m
      JOIN chart_of_accounts c ON m.coa_id = c.id
      WHERE m.user_id = p_user_id
        AND m.kategori_id = rec.kategori_id;
    END IF;

    -- Fallback counter: pendapatan/beban generik
    IF counter_coa IS NULL THEN
      IF rec.tipe = 'pemasukan' THEN
        SELECT * INTO counter_coa
        FROM chart_of_accounts
        WHERE user_id = p_user_id AND klasifikasi = 4 AND tipe_akun = 'detail' AND aktif = true
        ORDER BY kode ASC LIMIT 1;
      ELSE
        SELECT * INTO counter_coa
        FROM chart_of_accounts
        WHERE user_id = p_user_id AND klasifikasi = 6 AND tipe_akun = 'detail' AND aktif = true
        ORDER BY kode ASC LIMIT 1;
      END IF;
    END IF;

    -- Skip jika tidak bisa resolve kedua akun
    IF kas_coa IS NULL OR counter_coa IS NULL THEN
      RETURN QUERY SELECT
        rec.tanggal::DATE,
        rec.tipe::TEXT,
        rec.jumlah::BIGINT,
        COALESCE(rec.catatan, '')::TEXT,
        COALESCE(kas_coa.kode, 'N/A')::TEXT,
        COALESCE(counter_coa.kode, 'N/A')::TEXT,
        'SKIPPED - akun tidak ditemukan'::TEXT;
      CONTINUE;
    END IF;

    IF p_dry_run THEN
      -- Preview mode
      IF rec.tipe = 'pemasukan' THEN
        RETURN QUERY SELECT
          rec.tanggal::DATE, rec.tipe::TEXT, rec.jumlah::BIGINT, COALESCE(rec.catatan, '')::TEXT,
          (kas_coa.kode || ' ' || kas_coa.nama)::TEXT,
          (counter_coa.kode || ' ' || counter_coa.nama)::TEXT,
          'PREVIEW'::TEXT;
      ELSE
        RETURN QUERY SELECT
          rec.tanggal::DATE, rec.tipe::TEXT, rec.jumlah::BIGINT, COALESCE(rec.catatan, '')::TEXT,
          (counter_coa.kode || ' ' || counter_coa.nama)::TEXT,
          (kas_coa.kode || ' ' || kas_coa.nama)::TEXT,
          'PREVIEW'::TEXT;
      END IF;
    ELSE
      -- Actual migration
      SELECT generate_nomor_jurnal(p_user_id) INTO nomor_jurnal;

      -- Insert jurnal header (is_balanced adalah GENERATED COLUMN, jangan insert)
      INSERT INTO jurnal_memorial (
        user_id, nomor, tanggal, keterangan, reff,
        total_debit, total_kredit, status, created_by
      ) VALUES (
        p_user_id, nomor_jurnal, rec.tanggal,
        'Migrasi V1: ' || COALESCE(rec.catatan, rec.tipe),
        'TX-' || rec.id::TEXT,
        rec.jumlah, rec.jumlah, 'posted', p_user_id
      ) RETURNING id INTO v_jurnal_id;

      -- Insert detail lines (double-entry)
      IF rec.tipe = 'pemasukan' THEN
        -- D: Kas, K: Pendapatan
        INSERT INTO jurnal_memorial_detail (jurnal_id, user_id, coa_id, kode_akun, nama_akun, debit, kredit, keterangan, kode_kas, urutan)
        VALUES
          (v_jurnal_id, p_user_id, kas_coa.id, kas_coa.kode, kas_coa.nama, rec.jumlah, 0, rec.catatan, rec.kas_id, 0),
          (v_jurnal_id, p_user_id, counter_coa.id, counter_coa.kode, counter_coa.nama, 0, rec.jumlah, rec.catatan, 'kosongan', 1);
      ELSE
        -- D: Beban, K: Kas
        INSERT INTO jurnal_memorial_detail (jurnal_id, user_id, coa_id, kode_akun, nama_akun, debit, kredit, keterangan, kode_kas, urutan)
        VALUES
          (v_jurnal_id, p_user_id, counter_coa.id, counter_coa.kode, counter_coa.nama, rec.jumlah, 0, rec.catatan, 'kosongan', 0),
          (v_jurnal_id, p_user_id, kas_coa.id, kas_coa.kode, kas_coa.nama, 0, rec.jumlah, rec.catatan, rec.kas_id, 1);
      END IF;

      -- Update transaksi with jurnal_id
      UPDATE public.transaksi SET jurnal_id = v_jurnal_id WHERE id = rec.id;

      total_migrated := total_migrated + 1;

      RETURN QUERY SELECT
        rec.tanggal::DATE, rec.tipe::TEXT, rec.jumlah::BIGINT, COALESCE(rec.catatan, '')::TEXT,
        kas_coa.kode::TEXT, counter_coa.kode::TEXT, 'MIGRATED'::TEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- STEP 3: Link akun kas → CoA
-- Untuk setiap kas, cari/buat akun CoA kas yang sesuai
-- ============================================================

CREATE OR REPLACE FUNCTION link_kas_to_coa(p_user_id UUID)
RETURNS TABLE(kas_nama TEXT, coa_kode TEXT, linked BOOLEAN) AS $$
DECLARE
  rec RECORD;
  coa_rec RECORD;
  new_kode TEXT;
  kas_counter INT := 0;
BEGIN
  FOR rec IN
    SELECT id, nama, tipe FROM kas WHERE user_id = p_user_id AND aktif = true
  LOOP
    -- Cari akun CoA kas yang sudah ada untuk kas ini
    SELECT * INTO coa_rec
    FROM chart_of_accounts
    WHERE user_id = p_user_id AND kas_id = rec.id AND aktif = true
    LIMIT 1;

    IF coa_rec IS NOT NULL THEN
      RETURN QUERY SELECT rec.nama::TEXT, coa_rec.kode::TEXT, true;
      CONTINUE;
    END IF;

    -- Cari akun CoA kas yang cocok nama
    SELECT * INTO coa_rec
    FROM chart_of_accounts
    WHERE user_id = p_user_id
      AND klasifikasi = 1
      AND is_kas = true
      AND kas_id IS NULL
      AND aktif = true
      AND LOWER(nama) LIKE '%' || LOWER(rec.tipe) || '%'
    ORDER BY kode ASC
    LIMIT 1;

    IF coa_rec IS NOT NULL THEN
      -- Link existing CoA to this kas
      UPDATE chart_of_accounts SET kas_id = rec.id WHERE id = coa_rec.id;
      RETURN QUERY SELECT rec.nama::TEXT, coa_rec.kode::TEXT, true;
      CONTINUE;
    END IF;

    -- Buat akun baru di bawah 1.1.11.xxx
    kas_counter := kas_counter + 1;
    new_kode := '1.1.11.' || LPAD(kas_counter::TEXT, 3, '0');

    -- Cek apakah kode sudah ada
    IF EXISTS (SELECT 1 FROM chart_of_accounts WHERE user_id = p_user_id AND kode = new_kode) THEN
      new_kode := '1.1.12.' || LPAD(kas_counter::TEXT, 3, '0');
    END IF;

    INSERT INTO chart_of_accounts (
      user_id, kode, nama, tipe_akun, klasifikasi, saldo_normal,
      parent_kode, is_kas, kas_id, aktif, deskripsi
    ) VALUES (
      p_user_id, new_kode, 'Kas - ' || rec.nama, 'detail', 1, 'debit',
      '1.1.11', true, rec.id, true, 'Auto-linked dari kas: ' || rec.nama
    );

    RETURN QUERY SELECT rec.nama::TEXT, new_kode::TEXT, true;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- STEP 4: Master migration runner
-- Jalankan semua step migrasi secara berurutan
-- ============================================================

CREATE OR REPLACE FUNCTION run_full_v2_migration(
  p_user_id UUID,
  p_dry_run BOOLEAN DEFAULT true
)
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  count_mapping INT;
  count_linked INT;
  count_jurnal INT;
BEGIN
  -- Step 1: Seed CoA default jika belum ada
  IF NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE user_id = p_user_id LIMIT 1) THEN
    PERFORM seed_coa_default(p_user_id);
    result := result || 'CoA default berhasil dibuat. ';
  ELSE
    result := result || 'CoA sudah ada, skip seed. ';
  END IF;

  -- Step 2: Link kas → CoA
  SELECT COUNT(*) INTO count_linked FROM link_kas_to_coa(p_user_id);
  result := result || count_linked || ' kas di-link ke CoA. ';

  -- Step 3: Mapping kategori → CoA
  SELECT COUNT(*) INTO count_mapping FROM migrate_kategori_to_coa(p_user_id);
  result := result || count_mapping || ' kategori di-mapping. ';

  -- Step 4: Migrasi transaksi → jurnal
  IF p_dry_run THEN
    SELECT COUNT(*) INTO count_jurnal FROM migrate_transaksi_to_jurnal(p_user_id, true);
    result := result || count_jurnal || ' transaksi siap dimigrasi (DRY RUN). ';
  ELSE
    SELECT COUNT(*) INTO count_jurnal FROM migrate_transaksi_to_jurnal(p_user_id, false);
    result := result || count_jurnal || ' transaksi berhasil dimigrasi ke jurnal. ';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- USAGE:
-- ============================================================
--
-- DRY RUN (preview tanpa insert):
--   SELECT run_full_v2_migration('USER_UUID_HERE', true);
--
-- ACTUAL MIGRATION:
--   SELECT run_full_v2_migration('USER_UUID_HERE', false);
--
-- Atau step-by-step:
--   SELECT * FROM link_kas_to_coa('USER_UUID_HERE');
--   SELECT * FROM migrate_kategori_to_coa('USER_UUID_HERE');
--   SELECT * FROM migrate_transaksi_to_jurnal('USER_UUID_HERE', true);  -- preview
--   SELECT * FROM migrate_transaksi_to_jurnal('USER_UUID_HERE', false); -- actual
-- ============================================================
