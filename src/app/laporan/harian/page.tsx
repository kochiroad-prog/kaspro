'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTransaksiPeriode } from '@/lib/actions/laporan'
import { getKas } from '@/lib/actions/index'
import type { Kas } from '@/types'

function fmt(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0 })
}

export default function LaporanHarianPage() {
  const today = new Date().toISOString().split('T')[0]
  const [tanggal, setTanggal] = useState(today)
  const [kasId, setKasId] = useState('semua')
  const [kasList, setKasList] = useState<Kas[]>([])
  const [transaksi, setTransaksi] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getKas().then(r => setKasList(r.data ?? [])) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getTransaksiPeriode(tanggal, tanggal, kasId)
      setTransaksi(res.data ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [tanggal, kasId])

  useEffect(() => { load() }, [load])

  const pemasukan = transaksi.filter(t => t.tipe === 'pemasukan').reduce((s, t) => s + t.jumlah, 0)
  const pengeluaran = transaksi.filter(t => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0)
  const selisih = pemasukan - pengeluaran

  const kasAktif = kasId === 'semua' ? 'Semua Buku Kas' : kasList.find(k => k.id === kasId)?.nama ?? ''
  const tglLabel = new Date(tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ background: 'var(--nav-active-bg)' }}>📅</div>
            <div>
              <p className="text-base font-bold" style={{ color: 'var(--text)' }}>{kasAktif}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Laporan Harian</p>
            </div>
          </div>
          <p className="text-sm font-semibold px-3 py-1.5 rounded" style={{ background: 'var(--nav-active-bg)', color: 'var(--text)' }}>{tglLabel}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Pilih Buku Kas</label>
            <select value={kasId} onChange={e => setKasId(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)', minWidth: 160 }}>
              <option value="semua">Semua Buku Kas</option>
              {kasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Tanggal</label>
            <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Memuat data...</div>
      ) : transaksi.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-3xl mb-3">📋</div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Anda tidak memiliki aktivitas pada hari ini.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pemasukan', value: pemasukan, color: 'var(--inc)' },
              { label: 'Pengeluaran', value: pengeluaran, color: 'var(--exp)' },
              { label: 'Selisih', value: selisih, color: selisih >= 0 ? 'var(--inc)' : 'var(--exp)' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                <p className="text-sm font-bold font-mono" style={{ color: s.color }}>{fmt(s.value)}</p>
              </div>
            ))}
          </div>

          {/* Aktivitas */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 font-bold text-sm" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
              Aktivitas ({transaksi.length} transaksi)
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {transaksi.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-lg">{tx.kategori?.ikon ?? (tx.tipe === 'pemasukan' ? '📈' : '📉')}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {tx.catatan || tx.kategori?.nama || (tx.tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran')}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {tx.kategori?.nama}{tx.kas?.nama ? ` · ${tx.kas.nama}` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-bold font-mono" style={{ color: tx.tipe === 'pemasukan' ? 'var(--inc)' : 'var(--exp)' }}>
                    {tx.tipe === 'pemasukan' ? '+' : '-'}{fmt(tx.jumlah)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
