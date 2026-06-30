import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin client — gunakan service role key.
 * HANYA dipakai di server-side untuk operasi admin (create/delete user).
 * Jangan ekspos ke client.
 */
export function createAdminClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diset di .env.local'
    )
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
