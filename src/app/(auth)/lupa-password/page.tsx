'use client'

import { useState } from 'react'
import Link from 'next/link'
import { lupaPassword } from '@/lib/actions/auth'

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[var(--brand)] rounded-2xl mb-4">
            <span className="text-2xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Lupa Password</h1>
          <p className="text-sm text-gray-500 mt-1">
            {sent ? 'Cek email Anda' : 'Masukkan email untuk reset password'}
          </p>
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <p className="text-sm text-green-700 font-semibold">{msg}</p>
              <p className="text-xs text-gray-400 mt-2">Cek folder spam jika tidak ada di inbox</p>
              <Link href="/login" className="btn-primary mt-6 justify-center">
                Kembali ke Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-bold mb-1 text-gray-800">Reset Password</h2>
              {msg && isErr && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{msg}</div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Terdaftar</label>
                <input name="email" type="email" required placeholder="nama@email.com" className="input" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>
            </form>
          )}
        </div>

        {!sent && (
          <p className="text-center text-sm text-gray-500 mt-4">
            <Link href="/login" className="text-[var(--brand)] font-semibold hover:underline">
              ← Kembali ke Login
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
