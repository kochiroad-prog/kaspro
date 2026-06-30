'use server'

import { getEffectiveUserId } from '@/lib/supabase/get-effective-user'
import { revalidatePath } from 'next/cache'
import type { KasInput, KategoriInput, TransferInput, UnitBisnisInput, ProyekInput } from '@/types'

// ============================================================
// KAS ACTIONS
// ============================================================

export async function getKas() {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('kas')
    .select('*')
    .eq('user_id', userId)
    .eq('aktif', true)
    .order('created_at', { ascending: true })

  return { data, error: error?.message ?? null }
}

export async function tambahKas(input: KasInput) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  if (!input.nama) return { data: null, error: 'Nama kas wajib diisi' }

  const { data, error } = await supabase
    .from('kas')
    .insert({
      user_id: userId,
      nama: input.nama,
      tipe: input.tipe,
      saldo: input.saldo_awal ?? 0,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/kas')
  revalidatePath('/dashboard')
  revalidatePath('/pengaturan/buku-kas')
  return { data, error: null }
}

export async function updateKas(id: string, input: Partial<KasInput>) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('kas')
    .update({ nama: input.nama, tipe: input.tipe, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/kas')
  return { data, error: null }
}

export async function hapusKas(id: string) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { error: 'Tidak terautentikasi' }

  // Cek apakah ada transaksi di kas ini
  const { count } = await supabase
    .from('transaksi')
    .select('*', { count: 'exact', head: true })
    .eq('kas_id', id)

  if (count && count > 0) {
    return { error: 'Kas tidak bisa dihapus karena masih memiliki transaksi' }
  }

  const { error } = await supabase
    .from('kas').update({ aktif: false }).eq('id', id).eq('user_id', userId)

  if (error) return { error: error.message }
  revalidatePath('/kas')
  revalidatePath('/dashboard')
  revalidatePath('/pengaturan/buku-kas')
  return { error: null }
}

// ============================================================
// KATEGORI ACTIONS
// ============================================================

export async function getKategori(tipe?: 'pemasukan' | 'pengeluaran') {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  let query = supabase
    .from('kategori')
    .select('*')
    .eq('user_id', userId)
    .order('nama', { ascending: true })

  if (tipe) query = query.eq('tipe', tipe)

  const { data, error } = await query
  return { data, error: error?.message ?? null }
}

export async function tambahKategori(input: KategoriInput) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  if (!input.nama) return { data: null, error: 'Nama kategori wajib diisi' }

  const { data, error } = await supabase
    .from('kategori')
    .insert({ user_id: userId, ...input })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/kategori')
  return { data, error: null }
}

export async function hapusKategori(id: string) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('kategori').delete().eq('id', id).eq('user_id', userId)

  if (error) return { error: error.message }
  revalidatePath('/kategori')
  return { error: null }
}

// ============================================================
// TRANSFER ACTIONS
// ============================================================

export async function getTransfer() {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('transfer')
    .select(`*, dari_kas:dari_kas_id (id, nama), ke_kas:ke_kas_id (id, nama)`)
    .eq('user_id', userId)
    .order('tanggal', { ascending: false })
    .limit(50)

  return { data, error: error?.message ?? null }
}

export async function prosesTransfer(input: TransferInput) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  if (input.dari_kas_id === input.ke_kas_id) {
    return { data: null, error: 'Kas asal dan tujuan tidak boleh sama' }
  }
  if (!input.jumlah || input.jumlah <= 0) {
    return { data: null, error: 'Jumlah transfer harus lebih dari 0' }
  }

  // Gunakan RPC function untuk atomic transfer
  const { data, error } = await supabase.rpc('proses_transfer', {
    p_user_id: userId,
    p_dari_kas: input.dari_kas_id,
    p_ke_kas: input.ke_kas_id,
    p_jumlah: input.jumlah,
    p_catatan: input.catatan ?? '',
    p_tanggal: input.tanggal,
  })

  if (error) return { data: null, error: error.message }
  if (data?.error) return { data: null, error: data.error }

  revalidatePath('/kas')
  revalidatePath('/transfer')
  revalidatePath('/dashboard')
  return { data, error: null }
}

// ============================================================
// UNIT BISNIS ACTIONS
// ============================================================

export async function getUnitBisnis() {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('unit_bisnis')
    .select('*')
    .eq('user_id', userId)
    .eq('aktif', true)
    .order('created_at', { ascending: true })

  return { data, error: error?.message ?? null }
}

export async function tambahUnitBisnis(input: UnitBisnisInput) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('unit_bisnis')
    .insert({ user_id: userId, ...input })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/unit-bisnis')
  return { data, error: null }
}

export async function updateUnitBisnis(id: string, input: UnitBisnisInput) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('unit_bisnis')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/unit-bisnis')
  return { data, error: null }
}

export async function hapusUnitBisnis(id: string) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('unit_bisnis')
    .update({ aktif: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }
  revalidatePath('/unit-bisnis')
  return { error: null }
}

// ============================================================
// PROYEK ACTIONS
// ============================================================

export async function getProyek() {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('proyek')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error: error?.message ?? null }
}

export async function tambahProyek(input: ProyekInput) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('proyek')
    .insert({ user_id: userId, ...input })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/proyek')
  return { data, error: null }
}

export async function updateProyek(id: string, input: ProyekInput & { status?: string }) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('proyek')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/proyek')
  return { data, error: null }
}

export async function hapusProyek(id: string) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('proyek')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }
  revalidatePath('/proyek')
  return { error: null }
}

// ============================================================
// LAPORAN ACTIONS
// ============================================================

export async function getLaporanBulanan(tahun: number) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('transaksi')
    .select('tipe, jumlah, tanggal')
    .eq('user_id', userId)
    .gte('tanggal', `${tahun}-01-01`)
    .lte('tanggal', `${tahun}-12-31`)

  if (error) return { data: null, error: error.message }

  const bulanLabels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
  const result = Array.from({ length: 12 }, (_, i) => ({
    bulan: `${tahun}-${String(i + 1).padStart(2, '0')}`,
    label: `${bulanLabels[i]} ${tahun}`,
    pemasukan: 0,
    pengeluaran: 0,
    keuntungan: 0,
  }))

  for (const tx of data ?? []) {
    const bulan = new Date(tx.tanggal).getMonth()
    if (tx.tipe === 'pemasukan') result[bulan].pemasukan += tx.jumlah
    else result[bulan].pengeluaran += tx.jumlah
    result[bulan].keuntungan = result[bulan].pemasukan - result[bulan].pengeluaran
  }

  return { data: result, error: null }
}

export async function getLaporanKategori(dari: string, sampai: string) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('transaksi')
    .select('jumlah, kategori:kategori_id (id, nama, ikon)')
    .eq('user_id', userId)
    .eq('tipe', 'pengeluaran')
    .gte('tanggal', dari)
    .lte('tanggal', sampai)

  if (error) return { data: null, error: error.message }

  const map = new Map<string, { nama: string; ikon: string; total: number }>()
  let totalAll = 0

  for (const tx of data ?? []) {
    const kat = tx.kategori as { id: string; nama: string; ikon: string } | null
    const key = kat?.id ?? 'lainnya'
    const existing = map.get(key)
    if (existing) {
      existing.total += tx.jumlah
    } else {
      map.set(key, { nama: kat?.nama ?? 'Lainnya', ikon: kat?.ikon ?? '📦', total: tx.jumlah })
    }
    totalAll += tx.jumlah
  }

  const result = Array.from(map.entries())
    .map(([id, v]) => ({ kategori_id: id, ...v, persentase: totalAll > 0 ? Math.round((v.total / totalAll) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)

  return { data: result, error: null }
}

export async function getLaporanUnitBisnis(dari: string, sampai: string) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const [unitList, txList] = await Promise.all([
    supabase.from('unit_bisnis').select('id, nama').eq('user_id', userId),
    supabase.from('transaksi')
      .select('unit_bisnis_id, tipe, jumlah')
      .eq('user_id', userId)
      .gte('tanggal', dari)
      .lte('tanggal', sampai),
  ])

  const result = (unitList.data ?? []).map(u => {
    const txs = (txList.data ?? []).filter(t => t.unit_bisnis_id === u.id)
    const pemasukan = txs.filter(t => t.tipe === 'pemasukan').reduce((s, t) => s + t.jumlah, 0)
    const pengeluaran = txs.filter(t => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0)
    const keuntungan = pemasukan - pengeluaran
    const margin = pemasukan > 0 ? Math.round((keuntungan / pemasukan) * 100) : 0
    return { unit_bisnis_id: u.id, nama: u.nama, pemasukan, pengeluaran, keuntungan, margin }
  })

  return { data: result, error: null }
}
