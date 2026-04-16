'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface Utang {
  id: string
  user_id: string
  tanggal_awal: string
  jatuh_tempo: string | null
  nominal: number
  klien: string
  deskripsi: string
  kas_id: string | null
  status: 'belum_lunas' | 'lunas'
  created_at: string
}

export interface UtangInput {
  tanggal_awal: string
  jatuh_tempo?: string | null
  nominal: number
  klien: string
  deskripsi: string
  kas_id?: string | null
}

export interface Piutang {
  id: string
  user_id: string
  tanggal_awal: string
  jatuh_tempo: string | null
  nominal: number
  klien: string
  deskripsi: string
  kas_id: string | null
  status: 'belum_lunas' | 'lunas'
  created_at: string
}

export interface PiutangInput {
  tanggal_awal: string
  jatuh_tempo?: string | null
  nominal: number
  klien: string
  deskripsi: string
  kas_id?: string | null
}

/* ── UTANG ──────────────────────────────────────── */

export async function getUtang() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('utang')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return { data, error: error?.message ?? null }
}

export async function tambahUtang(input: UtangInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  if (!input.klien) return { data: null, error: 'Nama klien wajib diisi' }
  if (!input.nominal || input.nominal <= 0) return { data: null, error: 'Nominal harus lebih dari 0' }

  const { data, error } = await supabase
    .from('utang')
    .insert({
      user_id: user.id,
      tanggal_awal: input.tanggal_awal,
      jatuh_tempo: input.jatuh_tempo ?? null,
      nominal: input.nominal,
      klien: input.klien,
      deskripsi: input.deskripsi ?? '',
      kas_id: input.kas_id ?? null,
      status: 'belum_lunas',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/utang-piutang/utang')
  return { data, error: null }
}

export async function updateStatusUtang(id: string, status: 'belum_lunas' | 'lunas') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('utang')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/utang-piutang/utang')
  return { error: null }
}

export async function hapusUtang(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('utang')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/utang-piutang/utang')
  return { error: null }
}

/* ── PIUTANG ────────────────────────────────────── */

export async function getPiutang() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('piutang')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return { data, error: error?.message ?? null }
}

export async function tambahPiutang(input: PiutangInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  if (!input.klien) return { data: null, error: 'Nama klien wajib diisi' }
  if (!input.nominal || input.nominal <= 0) return { data: null, error: 'Nominal harus lebih dari 0' }

  const { data, error } = await supabase
    .from('piutang')
    .insert({
      user_id: user.id,
      tanggal_awal: input.tanggal_awal,
      jatuh_tempo: input.jatuh_tempo ?? null,
      nominal: input.nominal,
      klien: input.klien,
      deskripsi: input.deskripsi ?? '',
      kas_id: input.kas_id ?? null,
      status: 'belum_lunas',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/utang-piutang/piutang')
  return { data, error: null }
}

export async function updateStatusPiutang(id: string, status: 'belum_lunas' | 'lunas') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('piutang')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/utang-piutang/piutang')
  return { error: null }
}

export async function hapusPiutang(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('piutang')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/utang-piutang/piutang')
  return { error: null }
}
