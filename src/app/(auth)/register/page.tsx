'use client'

import { useState } from 'react'
import Link from 'next/link'
import { register } from '@/lib/actions/auth'
import { ValtoLogo } from '@/components/layout/Sidebar'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const pwd = fd.get('password') as string
    const kpwd = fd.get('konfirmasi_password') as string
    if (pwd !== kpwd) {
      setError('Password dan konfirmasi password tidak cocok')
      setLoading(false)
      return
    }
    if (pwd.length < 6) {
      setError('Password minimal 6 karakter')
      setLoading(false)
      return
    }
    const result = await register(fd)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-sm w-full fade-in">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Pendaftaran Berhasil!</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Cek email kamu untuk konfirmasi, lalu masuk ke VALTO.
          </p>
          <Link href="/login" className="btn-primary w-full justify-center">
            Masuk Sekarang
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <ValtoLogo size={52} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-widest valto-text">VALTO</h1>
          <p className="text-sm mt-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>
            Daftar gratis — mulai dalam 1 menit
          </p>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>Buat Akun Baru</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'var(--exp-bg)', border: '1px solid var(--exp)', color: 'var(--exp)' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Nama Lengkap *</label>
              <input name="nama" type="text" required placeholder="Budi Santoso" className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Nama Usaha</label>
              <input name="nama_bisnis" type="text" placeholder="Nama bisnis (opsional)" className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Email *</label>
              <input name="email" type="email" required placeholder="nama@email.com" className="input" autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>No WhatsApp *</label>
              <input name="no_whatsapp" type="tel" required placeholder="08xxxxxxxxxx" className="input" pattern="[0-9+\-\s]+" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Password *</label>
              <input name="password" type="password" required placeholder="Minimal 6 karakter" className="input" autoComplete="new-password" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Konfirmasi Password *</label>
              <input name="konfirmasi_password" type="password" required placeholder="Ulangi password" className="input" autoComplete="new-password" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? '⏳ Mendaftarkan...' : '✅ Daftar Sekarang'}
            </button>
          </form>

          <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
            Dengan mendaftar, kamu setuju dengan Syarat & Ketentuan VALTO
          </p>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: 'var(--brand)' }}>
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
