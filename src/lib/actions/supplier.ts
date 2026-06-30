'use server'

import { getEffectiveUserId } from '@/lib/supabase/get-effective-user'
import { revalidatePath } from 'next/cache'

export interface Supplier {
  id: string
  user_id: string
  jenis: string
  nama: string
  alamat: string
  no_tlp: string
  email: string
  created_at: string
  updated_at: string
}

export interface SupplierInput {
  jenis: string
  nama: string
  alamat?: string
  no_tlp?: string
  email?: string
}

export async function getSupplier() {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('supplier')
    .select('*')
    .eq('user_id', userId)
    .order('nama', { ascending: true })

  return { data, error: error?.message ?? null }
}

export async function tambahSupplier(input: SupplierInput) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  if (!input.nama) return { data: null, error: 'Nama supplier wajib diisi' }
  if (!input.jenis) return { data: null, error: 'Jenis supplier wajib diisi' }

  const { data, error } = await supabase
    .from('supplier')
    .insert({
      user_id: userId,
      jenis: input.jenis,
      nama: input.nama,
      alamat: input.alamat ?? '',
      no_tlp: input.no_tlp ?? '',
      email: input.email ?? '',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/peralatan/supplier')
  return { data, error: null }
}

export async function updateSupplier(id: string, input: Partial<SupplierInput>) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('supplier')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/peralatan/supplier')
  return { data, error: null }
}

export async function hapusSupplier(id: string) {
  const { user, userId, supabase } = await getEffectiveUserId()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('supplier')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }
  revalidatePath('/peralatan/supplier')
  return { error: null }
}
