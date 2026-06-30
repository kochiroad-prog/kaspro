'use server'

import { createClient } from '@/lib/supabase/server'

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
