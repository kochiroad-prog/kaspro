'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type PeranPengguna = 'Read Only' | 'Writer' | 'Supervisor' | 'Manager' | 'Custom'

export interface PermisiKas {
  kas_id: string
  nama_kas: string
  aktif: boolean
  melihat_saldo: boolean
  mencatat_transaksi: boolean
  mengedit_transaksi: boolean
  unduh_excel: boolean
  unduh_pdf: boolean
  kirim_excel_email: boolean
  kirim_pdf_email: boolean
}

export interface PenggunaTambahan {
  id: string
  user_id: string       // owner
  nama: string
  email: string
  peran: PeranPengguna
  permisi_custom: PermisiKas[] | null
  aktif: boolean
  created_at: string
}

// ─── GET ────────────────────────────────────────────────────────────────────
export async function getPenggunaTambahan() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('pengguna_tambahan')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return { data, error: error?.message ?? null }
}

// ─── CREATE ──────────────────────────────────────────────────────────────────
export async function tambahPenggunaTambahan(input: {
  nama: string
  email: string
  password: string
  peran: PeranPengguna
  permisi_custom?: PermisiKas[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  // Cek apakah user adalah owner
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'owner') {
    return { data: null, error: 'Hanya SuperAdmin (owner) yang bisa membuat pengguna tambahan' }
  }

  const { data, error } = await supabase
    .from('pengguna_tambahan')
    .insert({
      user_id: user.id,
      nama: input.nama,
      email: input.email,
      password_hash: input.password, // simpan sebagai plain untuk mock; idealnya hash di server
      peran: input.peran,
      permisi_custom: input.permisi_custom ?? null,
      aktif: true,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/pengaturan/pengguna-tambahan')
  return { data, error: null }
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────
export async function updatePenggunaTambahan(id: string, input: {
  nama?: string
  email?: string
  password?: string
  peran?: PeranPengguna
  permisi_custom?: PermisiKas[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'owner') {
    return { data: null, error: 'Hanya SuperAdmin (owner) yang bisa mengedit pengguna tambahan' }
  }

  const updateData: any = {}
  if (input.nama)           updateData.nama = input.nama
  if (input.email)          updateData.email = input.email
  if (input.password)       updateData.password_hash = input.password
  if (input.peran)          updateData.peran = input.peran
  if (input.permisi_custom) updateData.permisi_custom = input.permisi_custom

  const { data, error } = await supabase
    .from('pengguna_tambahan')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/pengaturan/pengguna-tambahan')
  return { data, error: null }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
export async function hapusPenggunaTambahan(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'owner') {
    return { error: 'Hanya SuperAdmin (owner) yang bisa menghapus pengguna tambahan' }
  }

  const { error } = await supabase
    .from('pengguna_tambahan')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/pengaturan/pengguna-tambahan')
  return { error: null }
}
