import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Add timeout untuk prevent infinite hang
    const signInPromise = supabase.auth.signInWithPassword({ email, password })
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Login timeout - terlalu lama')), 10000)
    )

    const result = (await Promise.race([signInPromise, timeoutPromise])) as any

    if (result.error) {
      if (result.error.message?.includes('Invalid login')) {
        return NextResponse.json(
          { error: 'Email atau password salah' },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { error: result.error.message },
        { status: 401 }
      )
    }

    // Login berhasil
    return NextResponse.json(
      { success: true, error: null },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('Login API error:', err)
    return NextResponse.json(
      { error: err.message || 'Login gagal, coba lagi' },
      { status: 500 }
    )
  }
}
