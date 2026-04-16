'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface InvoiceItem {
  id: string
  deskripsi: string
  qty: number
  hargaSatuan: number
}

export interface Invoice {
  id: string
  user_id: string
  nomor: string
  tanggal: string
  pelanggan: string
  items: InvoiceItem[]
  total: number
  catatan: string
  status: 'lunas' | 'belum_lunas'
  created_at: string
}

export interface InvoiceInput {
  nomor: string
  tanggal: string
  pelanggan: string
  items: InvoiceItem[]
  total: number
  catatan?: string
}

export async function getInvoice() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  const { data, error } = await supabase
    .from('invoice')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return { data, error: error?.message ?? null }
}

export async function tambahInvoice(input: InvoiceInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Tidak terautentikasi' }

  if (!input.pelanggan) return { data: null, error: 'Nama pelanggan wajib diisi' }
  if (!input.items || input.items.length === 0) return { data: null, error: 'Minimal 1 item wajib diisi' }

  const { data, error } = await supabase
    .from('invoice')
    .insert({
      user_id: user.id,
      nomor: input.nomor,
      tanggal: input.tanggal,
      pelanggan: input.pelanggan,
      items: input.items,
      total: input.total,
      catatan: input.catatan ?? '',
      status: 'belum_lunas',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/peralatan/e-invoice')
  return { data, error: null }
}

export async function updateStatusInvoice(id: string, status: 'lunas' | 'belum_lunas') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('invoice')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/peralatan/e-invoice')
  return { error: null }
}

export async function hapusInvoice(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('invoice')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/peralatan/e-invoice')
  return { error: null }
}
