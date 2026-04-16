'use client'

import { useState } from 'react'
import Link from 'next/link'
import { register } from '@/lib/actions/auth'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    if (fd.get('password') !== fd.get('konfirmasi_password')) {
      setError('Password dan konfirmasi password tidak cocok')
      setLoading(false)
      return
    }
    const result = await register(fd)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 neon-glow" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(168,85,247,0.1))', border: '1px solid rgba(0,212,255,0.3)' }}>
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
              <defs>
                <radialGradient id="logo-grad2" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#a855f7" />
                </radialGradient>
              </defs>
              <circle cx="18" cy="18" r="15" stroke="url(#logo-grad2)" strokeWidth="1.2" fill="none" />
              <line x1="18" y1="3" x2="6" y2="12" stroke="url(#logo-grad2)" strokeWidth="0.8" opacity="0.7"/>
              <line x1="18" y1="3" x2="30" y2="12" stroke="url(#logo-grad2)" strokeWidth="0.8" opacity="0.7"/>
              <line x1="6" y1="12" x2="18" y2="18" stroke="url(#logo-grad2)" strokeWidth="0.8" opacity="0.7"/>
              <line x1="30" y1="12" x2="18" y2="18" stroke="url(#logo-grad2)" strokeWidth="0.8" opacity="0.7"/>
              <line x1="18" y1="18" x2="6" y2="26" stroke="url(#logo-grad2)" strokeWidth="0.8" opacity="0.7"/>
              <line x1="18" y1="18" x2="30" y2="26" stroke="url(#logo-grad2)" strokeWidth="0.8" opacity="0.7"/>
              <line x1="6" y1="12" x2="6" y2="26" stroke="url(#logo-grad2)" strokeWidth="0.8" opacity="0.5"/>
              <line x1="30" y1="12" x2="30" y2="26" stroke="url(#logo-grad2)" strokeWidth="0.8" opacity="0.5"/>
              <circle cx="18" cy="3" r="1.5" fill="#00d4ff" />
              <circle cx="6" cy="12" r="1.5" fill="#00d4ff" opacity="0.8"/>
              <circle cx="30" cy="12" r="1.5" fill="#a855f7" />
              <circle cx="18" cy="18" r="2" fill="url(#logo-grad2)" />
              <circle cx="6" cy="26" r="1.5" fill="#a855f7" opacity="0.8"/>
              <circle cx="30" cy="26" r="1.5" fill="#00d4ff" opacity="0.8"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-widest brand-glow" style={{
            background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            PRAECOX
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Daftar gratis — mulai dalam 1 menit</p>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold mb-5" style={{ color: '#e2e8f0' }}>Buat Akun Baru</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Nama Lengkap *</label>
              <input name="nama" type="text" required placeholder="Budi Santoso" className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Nama Usaha</label>
              <input name="nama_bisnis" type="text" placeholder="Nama bisnis (opsional)" className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Email *</label>
              <input name="email" type="email" required placeholder="nama@email.com" className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#94a3b8' }}>No WhatsApp *</label>
              <input
                name="no_whatsapp"
                type="tel"
                required
                placeholder="08xxxxxxxxxx"
                className="input"
                pattern="[0-9+\-\s]+"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Password *</label>
              <input name="password" type="password" required placeholder="Minimal 6 karakter" className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Konfirmasi Password *</label>
              <input name="konfirmasi_password" type="password" required placeholder="Ulangi password" className="input" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
            </button>
          </form>

          <p className="text-xs text-center mt-4" style={{ color: '#2d3f5a' }}>
            Dengan mendaftar, kamu setuju dengan Syarat & Ketentuan Praecox
          </p>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: '#64748b' }}>
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: '#00d4ff' }}>
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
