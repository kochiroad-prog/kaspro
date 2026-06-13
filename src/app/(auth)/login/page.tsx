'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/actions/auth'

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
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 neon-glow" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(168,85,247,0.1))', border: '1px solid rgba(0,212,255,0.3)' }}>
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
              <defs>
                <radialGradient id="logo-grad" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#a855f7" />
                </radialGradient>
              </defs>
              <circle cx="18" cy="18" r="15" stroke="url(#logo-grad)" strokeWidth="1.2" fill="none" />
              <line x1="18" y1="3" x2="6" y2="12" stroke="url(#logo-grad)" strokeWidth="0.8" opacity="0.7"/>
              <line x1="18" y1="3" x2="30" y2="12" stroke="url(#logo-grad)" strokeWidth="0.8" opacity="0.7"/>
              <line x1="6" y1="12" x2="18" y2="18" stroke="url(#logo-grad)" strokeWidth="0.8" opacity="0.7"/>
              <line x1="30" y1="12" x2="18" y2="18" stroke="url(#logo-grad)" strokeWidth="0.8" opacity="0.7"/>
              <line x1="18" y1="18" x2="6" y2="26" stroke="url(#logo-grad)" strokeWidth="0.8" opacity="0.7"/>
              <line x1="18" y1="18" x2="30" y2="26" stroke="url(#logo-grad)" strokeWidth="0.8" opacity="0.7"/>
              <line x1="6" y1="26" x2="18" y2="33" stroke="url(#logo-grad)" strokeWidth="0.8" opacity="0.7"/>
              <line x1="30" y1="26" x2="18" y2="33" stroke="url(#logo-grad)" strokeWidth="0.8" opacity="0.7"/>
              <line x1="6" y1="12" x2="6" y2="26" stroke="url(#logo-grad)" strokeWidth="0.8" opacity="0.5"/>
              <line x1="30" y1="12" x2="30" y2="26" stroke="url(#logo-grad)" strokeWidth="0.8" opacity="0.5"/>
              <circle cx="18" cy="3" r="1.5" fill="#00d4ff" />
              <circle cx="6" cy="12" r="1.5" fill="#00d4ff" opacity="0.8"/>
              <circle cx="30" cy="12" r="1.5" fill="#a855f7" />
              <circle cx="18" cy="18" r="2" fill="url(#logo-grad)" />
              <circle cx="6" cy="26" r="1.5" fill="#a855f7" opacity="0.8"/>
              <circle cx="30" cy="26" r="1.5" fill="#00d4ff" opacity="0.8"/>
              <circle cx="18" cy="33" r="1.5" fill="#a855f7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-widest brand-glow" style={{
            background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            PRAECOX
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Business Automation Ecosystem</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-5" style={{ color: '#e2e8f0' }}>Masuk ke Akun</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Email</label>
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
                <label className="text-sm font-semibold" style={{ color: '#94a3b8' }}>Password</label>
                <Link href="/lupa-password" className="text-xs font-medium hover:underline" style={{ color: '#00d4ff' }}>
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
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: '#64748b' }}>
          Belum punya akun?{' '}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: '#00d4ff' }}>
            Daftar gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
