'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTransaksiPeriode } from '@/lib/actions/laporan'
import { getKas } from '@/lib/actions/index'
import GrafikBar from '@/components/laporan/GrafikBar'
import GrafikDonut from '@/components/laporan/GrafikDonut'
import type { Kas } from '@/types'

function fmt(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

const DONUT_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#84cc16']

export default function LaporanBulananPage() {
  const now = new Date()
  const [bulan, setBulan] = useState(String(now.getMonth() + 1).padStart(2, '0'))
  const [tahun, setTahun] = useState(String(now.getFullYear()))
  const [kasId, setKasId] = useState('semua')
  const [kasList, setKasList] = useState<Kas[]>([])
  const [transaksi, setTransaksi] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getKas().then(r => setKasList(r.data ?? [])) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const dariDate = `${tahun}-${bulan}-01`
      const lastDay = new Date(Number(tahun), Number(bulan), 0).getDate()
      const sampaiDate = `${tahun}-${bulan}-${String(lastDay).padStart(2, '0')}`
      const res = await getTransaksiPeriode(dariDate, sampaiDate, kasId)
      setTransaksi(res.data ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [bulan, tahun, kasId])

  useEffect(() => { load() }, [load])

  const pemasukan = transaksi.filter(t => t.tipe === 'pemasukan').reduce((s, t) => s + t.jumlah, 0)
  const pengeluaran = transaksi.filter(t => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0)
  const selisih = pemasukan - pengeluaran

  const lastDay = new Date(Number(tahun), Number(bulan), 0).getDate()
  const weeks = [
    { label: 'M1', dari: 1, sampai: 7 },
    { label: 'M2', dari: 8, sampai: 14 },
    { label: 'M3', dari: 15, sampai: 21 },
    { label: 'M4', dari: 22, sampai: lastDay },
  ]
  const barData = weeks.map(w => {
    const txW = transaksi.filter(t => { const d = new Date(t.tanggal).getDate(); return d >= w.dari && d <= w.sampai })
    return { label: w.label, pemasukan: txW.filter(t => t.tipe === 'pemasukan').reduce((s, t) => s + t.jumlah, 0), pengeluaran: txW.filter(t => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0) }
  })

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
  const bulanLabel = new Date(Number(tahun), Number(bulan) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  const BULAN_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: new Date(2000, i, 1).toLocaleDateString('id-ID', { month: 'long' }),
  }))
  const tahunOptions = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i))

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'var(--nav-active-bg)' }}>📆</div>
            <div>
              <p className="text-base font-bold" style={{ color: 'var(--text)' }}>{kasAktif}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Laporan Bulanan</p>
            </div>
          </div>
          <p className="text-sm font-semibold px-3 py-1.5 rounded" style={{ background: 'var(--nav-active-bg)', color: 'var(--text)' }}>{bulanLabel}</p>
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
            <select value={bulan} onChange={e => setBulan(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}>
              {BULAN_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            <select value={tahun} onChange={e => setTahun(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}>
              {tahunOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
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
          {transaksi.length > 0 && (
            <div className="card p-5">
              <p className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Grafik per Minggu</p>
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
              <div className="text-3xl mb-3">📆</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Tidak ada transaksi pada bulan ini.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
