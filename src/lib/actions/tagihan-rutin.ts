'use server'

import { getEffectiveUserId } from '@/lib/supabase/get-effective-user'

export interface TagihanRutin {
  id: string
  user_id: string
  nama: string
  nominal: number
  tanggal_tiap_bulan: number
  jenis: 'tetap' | 'estimasi'
  kategori_id: string | null
  kas_id: string | null
  aktif: boolean
  catatan: string | null
  created_at: string
  kategori?: { nama: string } | null
  kas?: { nama: string } | null
}

export interface TambahTagihanRutinInput {
  nama: string
  nominal: number
  tanggal_tiap_bulan: number
  jenis: 'tetap' | 'estimasi'
  kategori_id?: string | null
  kas_id?: string | null
  catatan?: string | null
}

export async function getTagihanRutin() {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('tagihan_rutin')
    .select('*, kategori(nama), kas(nama)')
    .eq('user_id', userId)
    .order('tanggal_tiap_bulan', { ascending: true })

  return { data, error: error?.message ?? null }
}

export async function tambahTagihanRutin(input: TambahTagihanRutinInput) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('tagihan_rutin')
    .insert({
      user_id: userId,
      nama: input.nama.trim(),
      nominal: input.nominal,
      tanggal_tiap_bulan: input.tanggal_tiap_bulan,
      jenis: input.jenis,
      kategori_id: input.kategori_id ?? null,
      kas_id: input.kas_id ?? null,
      catatan: input.catatan ?? null,
      aktif: true,
    })
    .select()
    .single()

  return { data, error: error?.message ?? null }
}

export async function hapusTagihanRutin(id: string) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tagihan_rutin')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  return { error: error?.message ?? null }
}

export async function toggleAktifTagihanRutin(id: string, aktif: boolean) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tagihan_rutin')
    .update({ aktif })
    .eq('id', id)
    .eq('user_id', userId)

  return { error: error?.message ?? null }
}

export async function catatPembayaranTagihan(tagihanId: string) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { error: 'Unauthorized' }

  const { data: tagihan, error: fetchErr } = await supabase
    .from('tagihan_rutin')
    .select('*')
    .eq('id', tagihanId)
    .eq('user_id', userId)
    .single()

  if (fetchErr || !tagihan) return { error: 'Tagihan tidak ditemukan' }
  if (!tagihan.kas_id) return { error: 'Tagihan belum diset Kas. Edit tagihan rutin terlebih dahulu.' }
  if (!tagihan.kategori_id) return { error: 'Tagihan belum diset Kategori. Edit tagihan rutin terlebih dahulu.' }

  const today = new Date().toISOString().split('T')[0]

  const { error: trxErr } = await supabase
    .from('transaksi')
    .insert({
      user_id: userId,
      kas_id: tagihan.kas_id,
      kategori_id: tagihan.kategori_id,
      tipe: 'pengeluaran',
      jumlah: tagihan.nominal,
      catatan: `[Tagihan Rutin] ${tagihan.nama}`,
      tanggal: today,
    })

  if (trxErr) return { error: trxErr.message }
  return { error: null }
}

export async function updateTagihanRutin(id: string, input: Partial<TambahTagihanRutinInput>) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tagihan_rutin')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)

  return { error: error?.message ?? null }
}
