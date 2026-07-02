'use server'

import { getEffectiveUserId, getEffectiveAccess } from '@/lib/supabase/get-effective-user'
import { canWriteKas } from '@/lib/pengguna-tambahan-types'
import { revalidatePath } from 'next/cache'
import type { TransaksiInput } from '@/types'

// ============================================================
// GET TRANSAKSI (dengan filter)
// ============================================================
export async function getTransaksi(params?: {
  tipe?: 'pemasukan' | 'pengeluaran'
  kas_id?: string
  kategori_id?: string
  unit_bisnis_id?: string
  proyek_id?: string
  dari_tanggal?: string
  sampai_tanggal?: string
  limit?: number
  offset?: number
}) {
  const { user, userId, supabase, allowedKasIds } = await getEffectiveAccess()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  // Sub-user peran "Custom" tanpa satupun kas yg diaktifkan → tidak ada riwayat yg bisa dilihat
  if (allowedKasIds !== null && allowedKasIds.length === 0) {
    return { data: [], error: null }
  }

  let query = supabase
    .from('transaksi')
    .select(`
      *,
      kas:kas_id (id, nama, tipe),
      kategori:kategori_id (id, nama, ikon),
      unit_bisnis:unit_bisnis_id (id, nama),
      proyek:proyek_id (id, nama)
    `)
    .eq('user_id', userId)
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })

  // Batasi ke kas yang diizinkan untuk sub-user peran "Custom".
  // Tetap aman digabung dengan filter kas_id manual di bawah (AND) — kalau
  // pengguna memilih kas yang tidak diizinkan, hasilnya otomatis kosong.
  if (allowedKasIds !== null) query = query.in('kas_id', allowedKasIds)

  if (params?.tipe) query = query.eq('tipe', params.tipe)
  if (params?.kas_id) query = query.eq('kas_id', params.kas_id)
  if (params?.kategori_id) query = query.eq('kategori_id', params.kategori_id)
  if (params?.unit_bisnis_id) query = query.eq('unit_bisnis_id', params.unit_bisnis_id)
  if (params?.proyek_id) query = query.eq('proyek_id', params.proyek_id)
  if (params?.dari_tanggal) query = query.gte('tanggal', params.dari_tanggal)
  if (params?.sampai_tanggal) query = query.lte('tanggal', params.sampai_tanggal)
  if (params?.limit) query = query.limit(params.limit)
  if (params?.offset) query = query.range(params.offset, (params.offset + (params.limit || 20)) - 1)

  const { data, error } = await query
  return { data, error: error?.message ?? null }
}

// ============================================================
// SALDO AWAL KAS (all-time, sebelum transaksi/transfer pertama tercatat)
// ============================================================
/**
 * Kas.saldo adalah saldo BERJALAN yang sudah termasuk "Saldo Awal" yang diisi
 * saat kas dibuat (field saldo_awal di form Tambah Kas) — nilai itu tidak
 * punya baris tersendiri di tabel transaksi, jadi kalau dijumlah dari daftar
 * transaksi saja, hasilnya bisa "kurang" dibanding kartu saldo kas.
 * Transfer antar kas juga tersimpan di tabel terpisah dan ikut mempengaruhi
 * saldo tanpa muncul di daftar transaksi.
 *
 * Fungsi ini menghitung ulang "Saldo Awal" itu secara terbalik:
 *   saldo_awal = saldo_sekarang - (net semua transaksi) - (net semua transfer)
 * Hasilnya selalu konsisten dengan kartu saldo kas, walau nilai aslinya
 * tidak disimpan di kolom terpisah.
 */
export async function getSaldoAwalKas(kas_id: string) {
  const { user, userId, supabase, allowedKasIds } = await getEffectiveAccess()
  if (!user) return { saldo: 0, error: 'Tidak terautentikasi' }
  if (allowedKasIds !== null && !allowedKasIds.includes(kas_id)) {
    return { saldo: 0, error: 'Anda tidak memiliki akses ke kas ini' }
  }

  const [kasRes, txRes, trOutRes, trInRes] = await Promise.all([
    supabase.from('kas').select('saldo').eq('id', kas_id).eq('user_id', userId).single(),
    supabase.from('transaksi').select('tipe, jumlah').eq('kas_id', kas_id).eq('user_id', userId),
    supabase.from('transfer').select('jumlah').eq('dari_kas_id', kas_id).eq('user_id', userId),
    supabase.from('transfer').select('jumlah').eq('ke_kas_id', kas_id).eq('user_id', userId),
  ])

  const netTransaksi = (txRes.data ?? []).reduce(
    (s, t) => s + (t.tipe === 'pemasukan' ? t.jumlah : -t.jumlah), 0
  )
  const netTransferKeluar = (trOutRes.data ?? []).reduce((s, t) => s + t.jumlah, 0)
  const netTransferMasuk = (trInRes.data ?? []).reduce((s, t) => s + t.jumlah, 0)

  const saldoSekarang = kasRes.data?.saldo ?? 0
  const saldoAwal = saldoSekarang - netTransaksi - netTransferMasuk + netTransferKeluar

  return { saldo: saldoAwal, error: null }
}

// ============================================================
// TAMBAH TRANSAKSI
// ============================================================
export async function tambahTransaksi(input: TransaksiInput) {
  const { user, userId, supabase, permisiCustom } = await getEffectiveAccess()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  // Validasi
  if (!input.kas_id) return { data: null, error: 'Pilih kas terlebih dahulu' }
  if (!input.jumlah || input.jumlah <= 0) return { data: null, error: 'Jumlah harus lebih dari 0' }
  if (!input.tipe) return { data: null, error: 'Pilih tipe transaksi' }

  // Sub-user peran "Custom" harus punya izin "mencatat_transaksi" utk kas yg dipilih
  if (!canWriteKas(permisiCustom, input.kas_id, 'mencatat_transaksi')) {
    return { data: null, error: 'Anda tidak memiliki izin mencatat transaksi di kas ini' }
  }

  // Cek saldo jika pengeluaran
  if (input.tipe === 'pengeluaran') {
    const { data: kas } = await supabase
      .from('kas')
      .select('saldo, nama')
      .eq('id', input.kas_id)
      .single()

    if (kas && kas.saldo < input.jumlah) {
      return { data: null, error: `Saldo ${kas.nama} tidak mencukupi (Saldo: Rp ${kas.saldo.toLocaleString('id-ID')})` }
    }
  }

  const { data, error } = await supabase
    .from('transaksi')
    .insert({
      user_id: userId,
      kas_id: input.kas_id,
      kategori_id: input.kategori_id || null,
      unit_bisnis_id: input.unit_bisnis_id || null,
      proyek_id: input.proyek_id || null,
      tipe: input.tipe,
      jumlah: input.jumlah,
      catatan: input.catatan,
      tanggal: input.tanggal,
      waktu: input.waktu ?? null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/transaksi')
  revalidatePath('/kas')
  revalidatePath('/laporan')

  return { data, error: null }
}

// ============================================================
// UPDATE TRANSAKSI
// ============================================================
export async function updateTransaksi(id: string, input: Partial<TransaksiInput>) {
  const { user, userId, supabase, permisiCustom } = await getEffectiveAccess()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  // Sub-user peran "Custom" harus punya izin "mengedit_transaksi" di kas transaksi ini berada
  if (permisiCustom !== null) {
    const { data: existing } = await supabase
      .from('transaksi')
      .select('kas_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!canWriteKas(permisiCustom, existing?.kas_id, 'mengedit_transaksi')) {
      return { data: null, error: 'Anda tidak memiliki izin mengedit transaksi di kas ini' }
    }
    // Kalau kas_id diganti ke kas lain, kas tujuan juga harus punya izin mencatat_transaksi
    if (input.kas_id && input.kas_id !== existing?.kas_id &&
        !canWriteKas(permisiCustom, input.kas_id, 'mencatat_transaksi')) {
      return { data: null, error: 'Anda tidak memiliki izin mencatat transaksi di kas tujuan' }
    }
  }

  const { data, error } = await supabase
    .from('transaksi')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/transaksi')
  revalidatePath('/kas')

  return { data, error: null }
}

// ============================================================
// HAPUS TRANSAKSI
// ============================================================
export async function hapusTransaksi(id: string) {
  const { user, userId, supabase, permisiCustom } = await getEffectiveAccess()
  if (!user) return { error: 'Tidak terautentikasi' }

  // Sub-user peran "Custom" harus punya izin "mengedit_transaksi" (mencakup hapus) di kas ini
  if (permisiCustom !== null) {
    const { data: existing } = await supabase
      .from('transaksi')
      .select('kas_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!canWriteKas(permisiCustom, existing?.kas_id, 'mengedit_transaksi')) {
      return { error: 'Anda tidak memiliki izin menghapus transaksi di kas ini' }
    }
  }

  const { error } = await supabase
    .from('transaksi')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/transaksi')
  revalidatePath('/kas')

  return { error: null }
}

// ============================================================
// DASHBOARD STATS
// ============================================================
export async function getDashboardStats() {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return null

  const hari_ini = new Date().toISOString().split('T')[0]
  const awal_bulan = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0]

  const [kasResult, hariIniResult, bulanIniResult] = await Promise.all([
    // Total semua kas
    supabase.from('kas').select('saldo').eq('user_id', userId).eq('aktif', true),

    // Transaksi hari ini
    supabase.from('transaksi')
      .select('tipe, jumlah')
      .eq('user_id', userId)
      .eq('tanggal', hari_ini),

    // Transaksi bulan ini
    supabase.from('transaksi')
      .select('tipe, jumlah')
      .eq('user_id', userId)
      .gte('tanggal', awal_bulan),
  ])

  const total_saldo = (kasResult.data ?? []).reduce((s, k) => s + k.saldo, 0)

  const hitung = (rows: { tipe: string; jumlah: number }[]) => ({
    pemasukan: rows.filter(r => r.tipe === 'pemasukan').reduce((s, r) => s + r.jumlah, 0),
    pengeluaran: rows.filter(r => r.tipe === 'pengeluaran').reduce((s, r) => s + r.jumlah, 0),
  })

  const hari = hitung(hariIniResult.data ?? [])
  const bulan = hitung(bulanIniResult.data ?? [])

  return {
    total_saldo,
    pemasukan_hari_ini: hari.pemasukan,
    pengeluaran_hari_ini: hari.pengeluaran,
    keuntungan_hari_ini: hari.pemasukan - hari.pengeluaran,
    pemasukan_bulan_ini: bulan.pemasukan,
    pengeluaran_bulan_ini: bulan.pengeluaran,
    keuntungan_bulan_ini: bulan.pemasukan - bulan.pengeluaran,
  }
}
