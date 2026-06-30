'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PeranPengguna, PermisiKas, PermisiMenu } from '@/lib/pengguna-tambahan-types'

export type { PeranPengguna, PermisiKas, PermisiMenu, PermisiMenuLaporan } from '@/lib/pengguna-tambahan-types'

export interface PenggunaTambahan {
  id: string
  user_id: string       // owner
  auth_user_id: string | null
  nama: string
  email: string
  peran: PeranPengguna
  permisi_custom: PermisiKas[] | null
  permisi_menu: PermisiMenu | null
  aktif: boolean
  created_at: string
}

// ─── Helper: pastikan yang memanggil adalah owner ────────────────────────────
async function requireOwner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, supabase, error: 'Tidak terautentikasi' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'owner') {
    return { user: null, supabase, error: 'Hanya SuperAdmin (owner) yang bisa mengelola pengguna tambahan' }
  }

  return { user, supabase, error: null }
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
  permisi_menu?: PermisiMenu
}) {
  const { user, supabase, error: authError } = await requireOwner()
  if (authError || !user) return { data: null, error: authError }

  if (!input.password || input.password.length < 6) {
    return { data: null, error: 'Password minimal 6 karakter' }
  }

  // 1. Cek apakah email sudah digunakan
  const { data: existing } = await supabase
    .from('pengguna_tambahan')
    .select('id')
    .eq('user_id', user.id)
    .eq('email', input.email)
    .single()

  if (existing) return { data: null, error: 'Email sudah digunakan sebagai pengguna tambahan' }

  // 2. Daftarkan ke Supabase Auth menggunakan admin API
  const admin = createAdminClient()
  const { data: authData, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,  // langsung aktif, tidak perlu konfirmasi email
    user_metadata: {
      nama: input.nama,
      is_sub_user: true,
      owner_id: user.id,
    },
  })

  if (createError) {
    if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
      return { data: null, error: 'Email sudah terdaftar di sistem. Gunakan email lain.' }
    }
    return { data: null, error: createError.message }
  }

  // 3. Simpan ke tabel pengguna_tambahan dengan auth_user_id
  const { data, error } = await supabase
    .from('pengguna_tambahan')
    .insert({
      user_id: user.id,
      auth_user_id: authData.user.id,
      nama: input.nama,
      email: input.email,
      password_hash: input.password,
      peran: input.peran,
      permisi_custom: input.permisi_custom ?? null,
      permisi_menu: input.permisi_menu ?? null,
      aktif: true,
    })
    .select()
    .single()

  if (error) {
    // Rollback: hapus user yang baru dibuat di Auth
    await admin.auth.admin.deleteUser(authData.user.id)
    return { data: null, error: error.message }
  }

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
  permisi_menu?: PermisiMenu
}) {
  const { user, supabase, error: authError } = await requireOwner()
  if (authError || !user) return { data: null, error: authError }

  // Ambil record lama untuk mendapatkan auth_user_id
  const { data: existing } = await supabase
    .from('pengguna_tambahan')
    .select('auth_user_id, email')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) return { data: null, error: 'Pengguna tidak ditemukan' }

  // Update di Supabase Auth jika ada perubahan email/password
  if (existing.auth_user_id && (input.email || input.password)) {
    const admin = createAdminClient()
    const authUpdate: { email?: string; password?: string } = {}
    if (input.email && input.email !== existing.email) authUpdate.email = input.email
    if (input.password && input.password.length >= 6) authUpdate.password = input.password

    if (Object.keys(authUpdate).length > 0) {
      const { error: updateAuthError } = await admin.auth.admin.updateUserById(
        existing.auth_user_id,
        authUpdate
      )
      if (updateAuthError) return { data: null, error: updateAuthError.message }
    }
  }

  // Update di tabel pengguna_tambahan
  const updateData: Record<string, unknown> = {}
  if (input.nama !== undefined)           updateData.nama = input.nama
  if (input.email !== undefined)          updateData.email = input.email
  if (input.password !== undefined && input.password) updateData.password_hash = input.password
  if (input.peran !== undefined)          updateData.peran = input.peran
  if (input.permisi_custom !== undefined) updateData.permisi_custom = input.permisi_custom
  if (input.permisi_menu !== undefined)   updateData.permisi_menu = input.permisi_menu

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
  const { user, supabase, error: authError } = await requireOwner()
  if (authError || !user) return { error: authError }

  // Ambil auth_user_id sebelum dihapus
  const { data: existing } = await supabase
    .from('pengguna_tambahan')
    .select('auth_user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  // Hapus dari tabel
  const { error } = await supabase
    .from('pengguna_tambahan')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Hapus dari Supabase Auth
  if (existing?.auth_user_id) {
    const admin = createAdminClient()
    await admin.auth.admin.deleteUser(existing.auth_user_id)
  }

  revalidatePath('/pengaturan/pengguna-tambahan')
  return { error: null }
}
