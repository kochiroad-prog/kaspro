'use server'

import { getEffectiveUserId } from '@/lib/supabase/get-effective-user'
import { revalidatePath } from 'next/cache'
import type {
  CoaInput, JurnalMemorialInput, ChartOfAccounts,
  JurnalMemorial, NeracaData, LabaRugiData, SaldoAkun
} from '@/types'

const REVALIDATE_PATHS = ['/akuntansi/coa', '/akuntansi/jurnal', '/akuntansi/neraca', '/akuntansi/laba-rugi', '/dashboard']

function revalidateAll() {
  REVALIDATE_PATHS.forEach(p => revalidatePath(p))
}

// ============================================================
// CHART OF ACCOUNTS (COA) ACTIONS
// ============================================================

export async function getCoa(opts?: { klasifikasi?: number; tipe_akun?: string; aktif?: boolean }) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  let query = supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('kode', { ascending: true })

  if (opts?.klasifikasi) query = query.eq('klasifikasi', opts.klasifikasi)
  if (opts?.tipe_akun) query = query.eq('tipe_akun', opts.tipe_akun)
  if (opts?.aktif !== undefined) query = query.eq('aktif', opts.aktif)

  const { data, error } = await query
  return { data: data as ChartOfAccounts[] | null, error: error?.message ?? null }
}

export async function getCoaDetail() {
  return getCoa({ tipe_akun: 'detail', aktif: true })
}

export async function tambahCoa(input: CoaInput) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  if (!input.kode || !input.nama) return { data: null, error: 'Kode dan Nama akun wajib diisi' }

  // Validate kode format X.X.XX.XXX
  const kodeRegex = /^\d\.\d\.\d{2}\.\d{3}$/
  if (!kodeRegex.test(input.kode)) {
    return { data: null, error: 'Format kode harus X.X.XX.XXX (contoh: 1.1.11.001)' }
  }

  const { data, error } = await supabase
    .from('chart_of_accounts')
    .insert({
      user_id: userId,
      kode: input.kode,
      nama: input.nama,
      tipe_akun: input.tipe_akun,
      klasifikasi: input.klasifikasi,
      saldo_normal: input.saldo_normal,
      parent_kode: input.parent_kode || null,
      is_kas: input.is_kas ?? false,
      kas_id: input.kas_id || null,
      deskripsi: input.deskripsi || '',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidateAll()
  return { data, error: null }
}

export async function updateCoa(id: string, input: Partial<CoaInput>) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('chart_of_accounts')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidateAll()
  return { data, error: null }
}

export async function hapusCoa(id: string) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { error: 'Tidak terautentikasi' }

  // Cek apakah ada jurnal detail yang merujuk akun ini
  const { count } = await supabase
    .from('jurnal_memorial_detail')
    .select('*', { count: 'exact', head: true })
    .eq('coa_id', id)

  if (count && count > 0) {
    return { error: 'Akun tidak bisa dihapus karena sudah digunakan dalam jurnal' }
  }

  const { error } = await supabase
    .from('chart_of_accounts')
    .update({ aktif: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }
  revalidateAll()
  return { error: null }
}

export async function seedCoaDefault() {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { error: 'Tidak terautentikasi' }

  // Cek apakah sudah punya CoA
  const { count } = await supabase
    .from('chart_of_accounts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (count && count > 0) {
    return { error: 'CoA default sudah ada. Hapus semua akun terlebih dahulu untuk reset.' }
  }

  const { error } = await supabase.rpc('seed_coa_default', { p_user_id: userId })
  if (error) return { error: error.message }

  revalidateAll()
  return { error: null }
}

// ============================================================
// JURNAL MEMORIAL ACTIONS
// ============================================================

export async function getJurnalMemorial(opts?: {
  status?: string
  dari_tanggal?: string
  sampai_tanggal?: string
  limit?: number
}) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  let query = supabase
    .from('jurnal_memorial')
    .select('*')
    .eq('user_id', userId)
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })

  if (opts?.status) query = query.eq('status', opts.status)
  if (opts?.dari_tanggal) query = query.gte('tanggal', opts.dari_tanggal)
  if (opts?.sampai_tanggal) query = query.lte('tanggal', opts.sampai_tanggal)
  if (opts?.limit) query = query.limit(opts.limit)

  const { data, error } = await query
  return { data: data as JurnalMemorial[] | null, error: error?.message ?? null }
}

export async function getJurnalDetail(jurnalId: string) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('jurnal_memorial_detail')
    .select('*')
    .eq('jurnal_id', jurnalId)
    .eq('user_id', userId)
    .order('urutan', { ascending: true })

  return { data, error: error?.message ?? null }
}

export async function tambahJurnalMemorial(input: JurnalMemorialInput) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  if (!input.details || input.details.length === 0) {
    return { data: null, error: 'Jurnal harus memiliki minimal 1 baris detail' }
  }

  // Validate balanced
  const totalDebit = input.details.reduce((s, d) => s + d.debit, 0)
  const totalKredit = input.details.reduce((s, d) => s + d.kredit, 0)

  if (totalDebit !== totalKredit) {
    return { data: null, error: `Jurnal tidak seimbang: Debit ${totalDebit.toLocaleString()} != Kredit ${totalKredit.toLocaleString()}` }
  }

  if (totalDebit === 0) {
    return { data: null, error: 'Total debit/kredit tidak boleh 0' }
  }

  // Generate nomor jurnal
  const { data: nomor } = await supabase.rpc('generate_nomor_jurnal', { p_user_id: userId })

  // Insert jurnal header
  const { data: jurnal, error: jurnalErr } = await supabase
    .from('jurnal_memorial')
    .insert({
      user_id: userId,
      nomor: nomor || `JM-${new Date().getTime()}`,
      tanggal: input.tanggal,
      keterangan: input.keterangan,
      reff: input.reff || '',
      total_debit: totalDebit,
      total_kredit: totalKredit,
      status: 'draft',
      created_by: userId,
    })
    .select()
    .single()

  if (jurnalErr) return { data: null, error: jurnalErr.message }

  // Insert detail lines
  const detailRows = input.details.map((d, i) => ({
    jurnal_id: jurnal.id,
    user_id: userId,
    coa_id: d.coa_id,
    kode_akun: d.kode_akun,
    nama_akun: d.nama_akun,
    debit: d.debit,
    kredit: d.kredit,
    keterangan: d.keterangan || '',
    kode_kas: d.kode_kas || 'kosongan',
    urutan: i,
  }))

  const { error: detailErr } = await supabase
    .from('jurnal_memorial_detail')
    .insert(detailRows)

  if (detailErr) return { data: null, error: detailErr.message }

  revalidateAll()
  return { data: jurnal, error: null }
}

export async function postJurnal(jurnalId: string) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { data, error } = await supabase.rpc('post_jurnal_memorial', {
    p_jurnal_id: jurnalId,
    p_user_id: userId,
  })

  if (error) return { error: error.message }
  if (data?.error) return { error: data.error }

  revalidateAll()
  return { error: null }
}

export async function voidJurnal(jurnalId: string) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { data, error } = await supabase.rpc('void_jurnal_memorial', {
    p_jurnal_id: jurnalId,
    p_user_id: userId,
  })

  if (error) return { error: error.message }
  if (data?.error) return { error: data.error }

  revalidateAll()
  return { error: null }
}

// ============================================================
// NERACA & LABA RUGI
// ============================================================

export async function getNeraca(tanggal?: string): Promise<{ data: NeracaData | null; error: string | null }> {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase.rpc('get_neraca', {
    p_user_id: userId,
    p_tanggal: tanggal || new Date().toISOString().split('T')[0],
  })

  if (error) return { data: null, error: error.message }
  return { data: data as NeracaData, error: null }
}

export async function getLabaRugi(dari: string, sampai: string): Promise<{ data: LabaRugiData | null; error: string | null }> {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase.rpc('get_laba_rugi', {
    p_user_id: userId,
    p_dari: dari,
    p_sampai: sampai,
  })

  if (error) return { data: null, error: error.message }
  return { data: data as LabaRugiData, error: null }
}

// Get saldo per akun detail (for neraca detail view)
export async function getSaldoPerAkun(klasifikasi?: number): Promise<{ data: SaldoAkun[] | null; error: string | null }> {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  let query = supabase
    .from('chart_of_accounts')
    .select('id, kode, nama, klasifikasi, saldo_normal')
    .eq('user_id', userId)
    .eq('tipe_akun', 'detail')
    .eq('aktif', true)
    .order('kode', { ascending: true })

  if (klasifikasi) query = query.eq('klasifikasi', klasifikasi)

  const { data: accounts, error } = await query
  if (error) return { data: null, error: error.message }

  // Get all posted journal details for this user
  const { data: details } = await supabase
    .from('jurnal_memorial_detail')
    .select('coa_id, debit, kredit, jurnal_id')
    .eq('user_id', userId)

  // Get only posted journals
  const { data: journals } = await supabase
    .from('jurnal_memorial')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'posted')

  const postedIds = new Set((journals ?? []).map(j => j.id))

  const result: SaldoAkun[] = (accounts ?? []).map(acc => {
    const accDetails = (details ?? []).filter(d => d.coa_id === acc.id && postedIds.has(d.jurnal_id))
    const totalDebit = accDetails.reduce((s, d) => s + (d.debit || 0), 0)
    const totalKredit = accDetails.reduce((s, d) => s + (d.kredit || 0), 0)
    const saldo = acc.saldo_normal === 'debit' ? totalDebit - totalKredit : totalKredit - totalDebit

    return {
      coa_id: acc.id,
      kode: acc.kode,
      nama: acc.nama,
      klasifikasi: acc.klasifikasi,
      saldo,
    }
  })

  return { data: result.filter(r => r.saldo !== 0), error: null }
}

// ============================================================
// KATEGORI -> COA MAPPING
// ============================================================

export async function getKategoriCoaMapping() {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('kategori_coa_mapping')
    .select('*, kategori:kategori_id (id, nama, tipe, ikon), coa:coa_id (id, kode, nama)')
    .eq('user_id', userId)

  return { data, error: error?.message ?? null }
}

export async function setKategoriCoaMapping(kategoriId: string, coaId: string) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { error: 'Tidak terautentikasi' }

  // Upsert
  const { error } = await supabase
    .from('kategori_coa_mapping')
    .upsert({
      user_id: userId,
      kategori_id: kategoriId,
      coa_id: coaId,
    }, { onConflict: 'user_id,kategori_id' })

  if (error) return { error: error.message }
  revalidatePath('/akuntansi/coa')
  return { error: null }
}

// ============================================================
// DASHBOARD V2.0 STATS
// ============================================================

export async function getDashboardStatsV2() {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return null

  const hari_ini = new Date().toISOString().split('T')[0]
  const awal_bulan = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [kasResult, hariIniResult, bulanIniResult, neracaResult, plResult] = await Promise.all([
    supabase.from('kas').select('saldo').eq('user_id', userId).eq('aktif', true),
    supabase.from('transaksi').select('tipe, jumlah').eq('user_id', userId).eq('tanggal', hari_ini),
    supabase.from('transaksi').select('tipe, jumlah').eq('user_id', userId).gte('tanggal', awal_bulan),
    supabase.rpc('get_neraca', { p_user_id: userId, p_tanggal: hari_ini }),
    supabase.rpc('get_laba_rugi', { p_user_id: userId, p_dari: awal_bulan, p_sampai: hari_ini }),
  ])

  const total_saldo = (kasResult.data ?? []).reduce((s, k) => s + k.saldo, 0)

  const hitung = (rows: { tipe: string; jumlah: number }[]) => ({
    pemasukan: rows.filter(r => r.tipe === 'pemasukan').reduce((s, r) => s + r.jumlah, 0),
    pengeluaran: rows.filter(r => r.tipe === 'pengeluaran').reduce((s, r) => s + r.jumlah, 0),
  })

  const hari = hitung(hariIniResult.data ?? [])
  const bulan = hitung(bulanIniResult.data ?? [])

  const neraca = neracaResult.data as NeracaData | null
  const pl = plResult.data as LabaRugiData | null

  return {
    total_saldo,
    pemasukan_hari_ini: hari.pemasukan,
    pengeluaran_hari_ini: hari.pengeluaran,
    keuntungan_hari_ini: hari.pemasukan - hari.pengeluaran,
    pemasukan_bulan_ini: bulan.pemasukan,
    pengeluaran_bulan_ini: bulan.pengeluaran,
    keuntungan_bulan_ini: bulan.pemasukan - bulan.pengeluaran,
    // V2.0 fields
    total_aset: neraca?.total_aset ?? 0,
    total_kewajiban: neraca?.total_kewajiban ?? 0,
    total_ekuitas: neraca?.total_ekuitas ?? 0,
    laba_bersih_bulan_ini: pl?.laba_bersih ?? 0,
  }
}

// ============================================================
// AUDIT TRAIL
// ============================================================

export async function getAuditTrail(limit = 50) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('audit_trail')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data, error: error?.message ?? null }
}
