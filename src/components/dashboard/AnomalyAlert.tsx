'use client'

import { useState, useEffect } from 'react'
import { formatRupiah } from '@/lib/utils'
import type { Anomaly } from '@/app/api/ai/anomaly/route'

export default function AnomalyAlert({ transaksi }: { transaksi: any[] }) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (transaksi.length < 5) { setChecked(true); return }
    setLoading(true)
    fetch('/api/ai/anomaly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaksi }),
    })
      .then(r => r.json())
      .then(d => { setAnomalies(d.anomalies ?? []); setChecked(true) })
      .catch(() => setChecked(true))
      .finally(() => setLoading(false))
  }, [])

  if (!checked || dismissed || (checked && anomalies.length === 0 && !loading)) return null

  if (loading) {
    return (
      <div className="card p-4 flex items-center gap-3" style={{ borderLeft: '3px solid var(--brand)' }}>
        <span className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin flex-shrink-0" style={{ borderColor: 'var(--brand-light)', borderTopColor: 'var(--brand)' }} />
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>AI sedang menganalisis transaksi...</span>
      </div>
    )
  }

  return (
    <div className="card p-4 space-y-3" style={{ borderLeft: '3px solid #f59e0b' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            Terdeteksi {anomalies.length} transaksi tidak wajar
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>AI</span>
        </div>
        <button onClick={() => setDismissed(true)} className="text-sm opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }}>✕</button>
      </div>

      <div className="space-y-2">
        {anomalies.map(a => (
          <div
            key={a.id}
            className="flex items-start gap-3 p-3 rounded-xl text-sm"
            style={{
              background: a.severity === 'high' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)',
              border: `1px solid ${a.severity === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
            }}
          >
            <span className="flex-shrink-0 mt-0.5">{a.severity === 'high' ? '🔴' : '🟡'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold" style={{ color: 'var(--text)' }}>{formatRupiah(a.jumlah)}</span>
                <span className="text-xs opacity-60">{a.kategori} · {a.tanggal}</span>
              </div>
              {a.catatan && a.catatan !== '-' && (
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{a.catatan}</p>
              )}
              <p className="text-xs mt-1" style={{ color: a.severity === 'high' ? '#dc2626' : '#d97706' }}>{a.alasan}</p>
            </div>
          </div>
        ))}
      </div>

      <a href="/transaksi" className="text-xs font-semibold underline" style={{ color: 'var(--brand)' }}>
        Lihat semua transaksi →
      </a>
    </div>
  )
}
