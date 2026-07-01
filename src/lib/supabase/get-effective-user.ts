'use server'

import { createClient } from '@/lib/supabase/server'
import type { PermisiKas } from '@/lib/pengguna-tambahan-types'

/**
 * Mengembalikan:
 * - user      : objek User dari Supabase Auth (atau null jika belum login)
 * - userId    : user_id owner yang efektif.
 *               Jika yang login adalah pengguna tambahan (sub-user),
 *               userId = user_id owner mereka.
 *               Jika yang login adalah owner biasa, userId = auth.uid().
 * - supabase  : Supabase client (agar tidak perlu createClient() lagi di action)
 *
 * Gunakan ini sebagai pengganti:
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 */
export async function getEffectiveUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, userId: null as string | null, supabase }
  }

  // Panggil fungsi SQL get_owner_id() yang sudah dibuat di migration_subuser.sql
  const { data: ownerId } = await supabase.rpc('get_owner_id')

  return {
    user,
    userId: (ownerId as string | null) ?? user.id,
    supabase,
  }
}

/**
 * Sama seperti getEffectiveUserId(), tapi juga mengembalikan:
 * - allowedKasIds : null (tidak ada pembatasan — owner / peran selain "Custom")
 *                   atau string[] (sub-user peran "Custom": hanya kas_id ini yg boleh dilihat,
 *                   bisa array kosong jika tidak ada satupun kas yg diaktifkan)
 * - permisiCustom : null (tidak ada pembatasan) atau daftar PermisiKas mentah milik sub-user
 *                   "Custom" — dipakai untuk cek izin tulis (mencatat/mengedit) per kas via
 *                   canWriteKas() di '@/lib/pengguna-tambahan-types'.
 *
 * Gunakan ini untuk semua query yang menampilkan saldo kas / riwayat transaksi,
 * supaya sub-user "Custom" hanya melihat Buku Kas yang diizinkan untuknya.
 */
export async function getEffectiveAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      userId: null as string | null,
      supabase,
      allowedKasIds: null as string[] | null,
      permisiCustom: null as PermisiKas[] | null,
    }
  }

  // Cek apakah yang login adalah sub-user aktif
  const { data: subUser } = await supabase
    .from('pengguna_tambahan')
    .select('user_id, peran, permisi_custom')
    .eq('auth_user_id', user.id)
    .eq('aktif', true)
    .maybeSingle()

  if (!subUser) {
    // Owner biasa → tidak ada pembatasan
    return {
      user,
      userId: user.id,
      supabase,
      allowedKasIds: null as string[] | null,
      permisiCustom: null as PermisiKas[] | null,
    }
  }

  const isCustom = subUser.peran === 'Custom'
  const permisiCustom = isCustom ? ((subUser.permisi_custom ?? []) as PermisiKas[]) : null
  const allowedKasIds = isCustom
    ? (permisiCustom ?? []).filter(p => p.aktif).map(p => p.kas_id)
    : null // peran lain (Read Only/Writer/Supervisor/Manager) → akses semua kas seperti sekarang

  return {
    user,
    userId: subUser.user_id as string,
    supabase,
    allowedKasIds,
    permisiCustom,
  }
}
