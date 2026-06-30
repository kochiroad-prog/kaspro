'use server'

import { getEffectiveUserId } from '@/lib/supabase/get-effective-user'
import { revalidatePath } from 'next/cache'

export interface Catatan {
  id: string
  user_id: string
  teks: string
  warna: string
  created_at: string
  updated_at: string
}

export interface CatatanInput {
  teks: string
  warna?: string
}

export async function getCatatan() {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('catatan')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error: error?.message ?? null }
}

export async function tambahCatatan(input: CatatanInput) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('catatan')
    .insert({
      user_id: userId,
      teks: input.teks ?? '',
      warna: input.warna ?? '#FFF9C4',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/peralatan/catatan')
  return { data, error: null }
}

export async function updateCatatan(id: string, input: Partial<CatatanInput>) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('catatan')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/peralatan/catatan')
  return { data, error: null }
}

export async function hapusCatatan(id: string) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('catatan')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }
  revalidatePath('/peralatan/catatan')
  return { error: null }
}
