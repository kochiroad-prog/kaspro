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

  if (!nama || !email || !password) {
    return { error: 'Semua field wajib diisi' }
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nama, nama_bisnis },
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
