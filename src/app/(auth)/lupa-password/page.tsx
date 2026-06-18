'use client'

import { useState } from 'react'
import Link from 'next/link'
import { lupaPassword } from '@/lib/actions/auth'
import { ValtoLogo } from '@/components/layout/Sidebar'

export default function LupaPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const result = await lupaPassword(new FormData(e.currentTarget))
    setIsErr(!!result.error)
    setMsg(result.error ?? result.success ?? '')
    if (!result.error) setSent(true)
    setLoading(false)
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
            {sent ? 'Cek email kamu' : 'Reset password akun kamu'}
          </p>
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <p className="text-sm font-semibold" style={{ color: 'var(--inc)' }}>{msg}</p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Cek folder spam jika tidak ada di inbox</p>
              <Link href="/login" className="btn-primary mt-6 justify-center w-full">
                Kembali ke Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Reset Password</h2>
              {msg && isErr && (
                <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--exp-bg)', border: '1px solid var(--exp)', color: 'var(--exp)' }}>
                  ⚠️ {msg}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Email Terdaftar</label>
                <input name="email" type="email" required placeholder="nama@email.com" className="input" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? '⏳ Mengirim...' : '📨 Kirim Link Reset'}
              </button>
            </form>
          )}
        </div>

        {!sent && (
          <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            <Link href="/login" className="font-semibold hover:underline" style={{ color: 'var(--brand)' }}>
              ← Kembali ke Login
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
