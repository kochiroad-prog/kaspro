'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Get transaksi untuk periode laporan ─────────────────────
export async function getTransaksiPeriode(dari: string, sampai: string, kas_id?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  let query = supabase
    .from('transaksi')
    .select(`
      id, tipe, jumlah, catatan, tanggal, created_at,
      kas:kas_id (id, nama, tipe),
      kategori:kategori_id (id, nama, ikon)
    `)
    .eq('user_id', user.id)
    .gte('tanggal', dari)
    .lte('tanggal', sampai)
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })

  if (kas_id && kas_id !== 'semua') query = query.eq('kas_id', kas_id)

  const { data, error } = await query
  return { data, error: error?.message ?? null }
}

// ─── Get transfer untuk periode laporan ──────────────────────
export async function getTransferPeriode(dari: string, sampai: string, kas_id?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  let query = supabase
    .from('transfer')
    .select(`
      id, jumlah, catatan, tanggal, created_at,
      dari_kas:dari_kas_id (id, nama),
      ke_kas:ke_kas_id (id, nama)
    `)
    .eq('user_id', user.id)
    .gte('tanggal', dari)
    .lte('tanggal', sampai)
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })

  if (kas_id && kas_id !== 'semua') {
    query = query.or(`dari_kas_id.eq.${kas_id},ke_kas_id.eq.${kas_id}`)
  }

  const { data, error } = await query
  return { data, error: error?.message ?? null }
}

// ─── Get saldo awal sebelum periode ──────────────────────────
export async function getSaldoAwalPeriode(dari: string, kas_id?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { saldo: 0 }

  // Hitung dari saldo current kas dikurangi selisih transaksi setelah tanggal dari
  let kasQuery = supabase.from('kas').select('id, saldo').eq('user_id', user.id).eq('aktif', true)
  if (kas_id && kas_id !== 'semua') kasQuery = kasQuery.eq('id', kas_id)
  const { data: kasData } = await kasQuery

  const totalSaldoNow = (kasData ?? []).reduce((s, k) => s + k.saldo, 0)

  // Transaksi setelah periode
  let txAfter = supabase.from('transaksi').select('tipe, jumlah').eq('user_id', user.id).gte('tanggal', dari)
  if (kas_id && kas_id !== 'semua') txAfter = txAfter.eq('kas_id', kas_id)
  const { data: txAfterData } = await txAfter

  const selisihSetelah = (txAfterData ?? []).reduce((s, t) =>
    t.tipe === 'pemasukan' ? s - t.jumlah : s + t.jumlah, 0)

  return { saldo: totalSaldoNow + selisihSetelah }
}
