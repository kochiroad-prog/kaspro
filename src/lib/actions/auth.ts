'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// REGISTER
// ============================================================
export async function register(formData: FormData) {
  const supabase = await createClient()

  const nama = formData.get('nama') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nama_bisnis = formData.get('nama_bisnis') as string
  const no_whatsapp = formData.get('no_whatsapp') as string

  if (!nama || !email || !password || !no_whatsapp) {
    return { error: 'Semua field wajib diisi' }
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nama, nama_bisnis, no_whatsapp },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Email sudah terdaftar. Silakan login.' }
    }
    return { error: error.message }
  }

  // Seed kategori & kas default setelah register
  if (data.user) {
    await supabase.rpc('seed_kategori_default', { p_user_id: data.user.id })
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ============================================================
// LOGIN
// ============================================================
export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi', success: false }
  }

  try {
    // Add timeout untuk prevent infinite hang
    const signInPromise = supabase.auth.signInWithPassword({ email, password })
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Login timeout - terlalu lama')), 10000)
    )

    const result = await Promise.race([signInPromise, timeoutPromise]) as any

    if (result.error) {
      if (result.error.message?.includes('Invalid login')) {
        return { error: 'Email atau password salah', success: false }
      }
      return { error: result.error.message, success: false }
    }

    // Return success - client akan handle redirect
    return { success: true, error: null }
  } catch (err: any) {
    return { error: err.message || 'Login gagal, coba lagi', success: false }
  }
}

// ============================================================
// LOGOUT
// ============================================================
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// ============================================================
// LUPA PASSWORD
// ============================================================
export async function lupaPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) return { error: 'Masukkan email Anda' }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) return { error: error.message }
  return { success: 'Link reset password telah dikirim ke email Anda' }
}

// ============================================================
// GET USER (server)
// ============================================================
export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { ...user, profile }
}

// ============================================================
// UPDATE PROFILE
// ============================================================
export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const nama        = formData.get('nama') as string
  const nama_bisnis = formData.get('nama_bisnis') as string
  const no_whatsapp = formData.get('no_whatsapp') as string
  const telepon     = formData.get('telepon') as string
  const alamat      = formData.get('alamat') as string
  const provinsi    = formData.get('provinsi') as string
  const kota        = formData.get('kota') as string
  const pekerjaan   = formData.get('pekerjaan') as string
  const penggunaan  = formData.get('penggunaan') as string
  const zona_waktu  = formData.get('zona_waktu') as string
  const mata_uang   = formData.get('mata_uang') as string

  // Update auth metadata
  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      nama, nama_bisnis, no_whatsapp, telepon,
      alamat, provinsi, kota, pekerjaan,
      penggunaan, zona_waktu, mata_uang,
    }
  })
  if (metaError) return { error: metaError.message }

  // Update profiles table (termasuk no_whatsapp)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ nama, nama_bisnis, no_whatsapp, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  // Ganti password jika diisi
  const password     = formData.get('password') as string
  const passwordConf = formData.get('password_conf') as string
  if (password) {
    if (password !== passwordConf) return { error: 'Konfirmasi password tidak cocok' }
    if (password.length < 6) return { error: 'Password minimal 6 karakter' }
    const { error: passError } = await supabase.auth.updateUser({ password })
    if (passError) return { error: passError.message }
  }

  revalidatePath('/pengaturan/akun')
  return { success: true }
}
