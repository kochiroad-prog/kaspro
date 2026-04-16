'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTransaksiPeriode } from '@/lib/actions/laporan'
import { getKas } from '@/lib/actions/index'
import GrafikBar from '@/components/laporan/GrafikBar'
import GrafikDonut from '@/components/laporan/GrafikDonut'
import type { Kas } from '@/types'

function fmt(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

const DONUT_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#84cc16']

export default function LaporanCustomPage() {
  const now = new Date()
  const defaultDari = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const defaultSampai = now.toISOString().split('T')[0]

  const [dari, setDari] = useState(defaultDari)
  const [sampai, setSampai] = useState(defaultSampai)
  const [kasId, setKasId] = useState('semua')
  const [kasList, setKasList] = useState<Kas[]>([])
  const [transaksi, setTransaksi] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getKas().then(r => setKasList(r.data ?? [])) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getTransaksiPeriode(dari, sampai, kasId)
      setTransaksi(res.data ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [dari, sampai, kasId])

  useEffect(() => { load() }, [load])

  const pemasukan = transaksi.filter(t => t.tipe === 'pemasukan').reduce((s, t) => s + t.jumlah, 0)
  const pengeluaran = transaksi.filter(t => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0)
  const selisih = pemasukan - pengeluaran

  // Grafik bar per hari (max 31 titik), atau per minggu jika range > 31 hari
  const diffDays = Math.ceil((new Date(sampai).getTime() - new Date(dari).getTime()) / 86400000) + 1
  let barData: { label: string; pemasukan: number; pengeluaran: number }[] = []

  if (diffDays <= 31) {
    // Per hari
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(dari)
      d.setDate(d.getDate() + i)
      const ds = d.toISOString().split('T')[0]
      const txD = transaksi.filter(t => t.tanggal === ds)
      barData.push({
        label: String(d.getDate()),
        pemasukan: txD.filter(t => t.tipe === 'pemasukan').reduce((s, t) => s + t.jumlah, 0),
        pengeluaran: txD.filter(t => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0),
      })
    }
  } else {
    // Per bulan
    const months: Record<string, { pemasukan: number; pengeluaran: number }> = {}
    transaksi.forEach(t => {
      const m = t.tanggal.slice(0, 7)
      if (!months[m]) months[m] = { pemasukan: 0, pengeluaran: 0 }
      if (t.tipe === 'pemasukan') months[m].pemasukan += t.jumlah
      else months[m].pengeluaran += t.jumlah
    })
    barData = Object.entries(months).sort().map(([m, v]) => ({
      label: m.slice(5), // MM
      ...v,
    }))
  }

  const buildDonut = (tipe: string) => Object.values(
    transaksi.filter(t => t.tipe === tipe).reduce((acc: any, t: any) => {
      const k = t.kategori?.nama ?? 'Lainnya'
      if (!acc[k]) acc[k] = { label: k, value: 0 }
      acc[k].value += t.jumlah
      return acc
    }, {})
  ).map((d: any, i) => ({ ...d, color: DONUT_COLORS[i % DONUT_COLORS.length] })) as any[]

  const byKatPemasukan = buildDonut('pemasukan')
  const byKatPengeluaran = buildDonut('pengeluaran')

  const kasAktif = kasId === 'semua' ? 'Semua Buku Kas' : kasList.find(k => k.id === kasId)?.nama ?? ''

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Laporan Custom</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Pilih rentang tanggal sesuka Anda</p>
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
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <input type="date" value={dari} onChange={e => setDari(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ke</span>
            <input type="date" value={sampai} onChange={e => setSampai(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Memuat data...</div>
      ) : (
        <>
          {/* Summary */}
          <div className="card p-5">
            <p className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>{kasAktif}</p>
            <div className="space-y-1">
              {[
                { label: 'Total Pemasukan', value: pemasukan, color: 'var(--inc)', sign: '+' },
                { label: 'Total Pengeluaran', value: pengeluaran, color: 'var(--exp)', sign: '-' },
              ].map(r => (
                <div key={r.label} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                  <span className="font-bold font-mono text-sm" style={{ color: r.color }}>{r.sign} {fmt(r.value)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Selisih</span>
                <span className="font-bold font-mono text-sm" style={{ color: selisih >= 0 ? 'var(--inc)' : 'var(--exp)' }}>{fmt(selisih)}</span>
              </div>
            </div>
          </div>

          {/* Grafik Bar */}
          {transaksi.length > 0 && barData.length > 0 && (
            <div className="card p-5">
              <p className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>
                Grafik {diffDays <= 31 ? 'per Hari' : 'per Bulan'}
              </p>
              <GrafikBar data={barData} height={180} />
            </div>
          )}

          {/* Donut Charts */}
          {(byKatPengeluaran.length > 0 || byKatPemasukan.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {byKatPengeluaran.length > 0 && (
                <div className="card p-5">
                  <p className="text-sm font-bold mb-3" style={{ color: 'var(--exp)' }}>📉 Pengeluaran</p>
                  <GrafikDonut data={byKatPengeluaran} size={120} />
                  <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
                    {byKatPengeluaran.sort((a,b)=>b.value-a.value).map((d:any) => (
                      <div key={d.label} className="flex justify-between text-xs">
                        <span className="truncate" style={{ color: 'var(--text-muted)' }}>{d.label}</span>
                        <span className="font-mono font-semibold ml-2" style={{ color: 'var(--exp)' }}>{fmt(d.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-bold pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text)' }}>Total</span>
                      <span className="font-mono" style={{ color: 'var(--exp)' }}>{fmt(pengeluaran)}</span>
                    </div>
                  </div>
                </div>
              )}
              {byKatPemasukan.length > 0 && (
                <div className="card p-5">
                  <p className="text-sm font-bold mb-3" style={{ color: 'var(--inc)' }}>📈 Pemasukan</p>
                  <GrafikDonut data={byKatPemasukan} size={120} />
                  <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
                    {byKatPemasukan.sort((a,b)=>b.value-a.value).map((d:any) => (
                      <div key={d.label} className="flex justify-between text-xs">
                        <span className="truncate" style={{ color: 'var(--text-muted)' }}>{d.label}</span>
                        <span className="font-mono font-semibold ml-2" style={{ color: 'var(--inc)' }}>{fmt(d.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-bold pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text)' }}>Total</span>
                      <span className="font-mono" style={{ color: 'var(--inc)' }}>{fmt(pemasukan)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {transaksi.length === 0 && (
            <div className="card p-12 text-center">
              <div className="text-3xl mb-3">📋</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Tidak ada transaksi pada periode ini.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
