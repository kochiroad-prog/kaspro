'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const CONTOH = [
  'pengeluaran terbesar bulan ini',
  'uang masuk minggu lalu',
  '10 transaksi terbaru',
  'pengeluaran bulan lalu',
]

export default function SmartSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSearch(q = query) {
    if (!q.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const { filters, error: err } = await res.json()
      if (err) throw new Error(err)

      // Bangun URL params dari filters
      const params = new URLSearchParams()
      if (filters.tipe) params.set('tipe', filters.tipe)
      if (filters.dari) params.set('dari', filters.dari)
      if (filters.sampai) params.set('sampai', filters.sampai)
      if (filters.sort) params.set('sort', filters.sort)
      if (filters.limit) params.set('limit', String(filters.limit))
      params.set('q', q)

      router.push(`/transaksi?${params.toString()}`)
    } catch (e: any) {
      setError('Gagal memproses query. Coba lagi.')
    }
    setLoading(false)
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🤖</span>
        <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Smart Search</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>AI</span>
      </div>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder='Coba: "pengeluaran terbesar bulan ini"'
          className="input flex-1 text-sm"
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="btn-primary px-4 text-sm flex-shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Proses...
            </span>
          ) : 'Cari'}
        </button>
      </div>

      {error && <p className="text-xs" style={{ color: 'var(--exp)' }}>{error}</p>}

      {/* Contoh query */}
      <div className="flex flex-wrap gap-1.5">
        {CONTOH.map(c => (
          <button
            key={c}
            onClick={() => { setQuery(c); handleSearch(c) }}
            className="text-[11px] px-2.5 py-1 rounded-full border transition-all hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--card-bg)' }}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}
