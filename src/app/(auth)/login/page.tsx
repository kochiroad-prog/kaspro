'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/actions/auth'
import { ValtoLogo } from '@/components/layout/Sidebar'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await login(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.refresh()
      router.push('/dashboard')
    }
  }

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <ValtoLogo size={56} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-widest valto-text">VALTO</h1>
          <p className="text-sm mt-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>
            Aplikasi Kas & Akuntansi Bisnis
          </p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>Masuk ke Akun</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'var(--exp-bg)', border: '1px solid var(--exp)', color: 'var(--exp)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="nama@email.com"
                className="input"
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Password</label>
                <Link href="/lupa-password" className="text-xs font-semibold hover:underline" style={{ color: 'var(--brand)' }}>
                  Lupa password?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="input"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2"
            >
              {loading ? '⏳ Memproses...' : '🚀 Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
          Belum punya akun?{' '}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: 'var(--brand)' }}>
            Daftar gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
