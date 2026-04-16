'use client'

import { useState, useEffect } from 'react'
import { getTransaksiPeriode, getTransferPeriode } from '@/lib/actions/laporan'
import { getKas } from '@/lib/actions/index'
import type { Kas } from '@/types'

interface Props {
  dari: string
  sampai: string
  judulPeriode: string
}

type TabType = 'umum' | 'aktivitas' | 'transfer'

export default function LaporanView({ dari: initDari, sampai: initSampai, judulPeriode }: Props) {
  const [tab, setTab] = useState<TabType>('umum')
  const [dari, setDari] = useState(initDari)
  const [sampai, setSampai] = useState(initSampai)
  const [kasId, setKasId] = useState('semua')
  const [kasList, setKasList] = useState<Kas[]>([])
  const [transaksi, setTransaksi] = useState<any[]>([])
  const [transfer, setTransfer] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load kas list once
  useEffect(() => {
    getKas().then(r => setKasList(r.data ?? []))
  }, [])

  // Load data whenever filter changes
  useEffect(() => {
    setLoading(true)
    Promise.all([
      getTransaksiPeriode(dari, sampai, kasId),
      getTransferPeriode(dari, sampai, kasId),
    ]).then(([txRes, trRes]) => {
      setTransaksi(txRes.data ?? [])
      setTransfer(trRes.data ?? [])
      setLoading(false)
    })
  }, [dari, sampai, kasId])

  // ── Computed stats ────────────────────────────────────────
  const pemasukan = transaksi.filter(t => t.tipe === 'pemasukan').reduce((s: number, t: any) => s + t.jumlah, 0)
  const pengeluaran = transaksi.filter(t => t.tipe === 'pengeluaran').reduce((s: number, t: any) => s + t.jumlah, 0)
  const selisih = pemasukan - pengeluaran

  // Group aktivitas by kategori
  const byKategori = transaksi.reduce((acc: any, tx: any) => {
    const kat = tx.kategori?.nama ?? (tx.tipe === 'pemasukan' ? '📈 Pemasukan Lainnya' : '📉 Pengeluaran Lainnya')
    const ikon = tx.kategori?.ikon ?? (tx.tipe === 'pemasukan' ? '📈' : '📉')
    if (!acc[kat]) acc[kat] = { nama: kat, ikon, total: 0, tipe: tx.tipe, items: [] }
    acc[kat].total += tx.jumlah
    acc[kat].items.push(tx)
    return acc
  }, {} as Record<string, any>)

  // Group transfer by kas
  const byKas = transfer.reduce((acc: any, tr: any) => {
    const kasNama = tr.dari_kas?.nama ?? 'Tidak diketahui'
    if (!acc[kasNama]) acc[kasNama] = { nama: kasNama, masuk: 0, keluar: 0, items: [] }
    acc[kasNama].keluar += tr.jumlah  // dari_kas = keluar
    // ke_kas = masuk
    const keKasNama = tr.ke_kas?.nama ?? 'Tidak diketahui'
    if (!acc[keKasNama]) acc[keKasNama] = { nama: keKasNama, masuk: 0, keluar: 0, items: [] }
    acc[keKasNama].masuk += tr.jumlah
    acc[kasNama].items.push(tr)
    return acc
  }, {} as Record<string, any>)

  function fmt(n: number) {
    return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 2 })
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const TABS: { key: TabType; label: string }[] = [
    { key: 'umum', label: 'Umum' },
    { key: 'aktivitas', label: 'Aktivitas' },
    { key: 'transfer', label: 'Transfer' },
  ]

  return (
    <div className="space-y-4">
      {/* ── Filter bar ─────────────────────────────────── */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Pilih Buku Kas */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Pilih Buku Kas</label>
            <select
              value={kasId}
              onChange={e => setKasId(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)', minWidth: '160px' }}
            >
              <option value="semua">Semua Buku Kas</option>
              {kasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>

          {/* Range tanggal */}
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date" value={dari} onChange={e => setDari(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
            />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>ke</span>
            <input
              type="date" value={sampai} onChange={e => setSampai(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
            />
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="flex gap-0 card overflow-hidden">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-6 py-3 text-sm font-semibold transition-all"
            style={{
              background: tab === t.key ? 'var(--brand)' : 'transparent',
              color: tab === t.key ? 'white' : 'var(--text-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-12 text-center" style={{ color: 'var(--text-muted)' }}>
          <div className="text-3xl animate-spin inline-block mb-3">⟳</div>
          <p className="text-sm">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* ── TAB UMUM ─────────────────────────────── */}
          {tab === 'umum' && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>
                  {kasId === 'semua' ? 'Semua Buku Kas' : kasList.find(k => k.id === kasId)?.nama}
                </h3>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{judulPeriode}</span>
              </div>

              {/* Summary */}
              <div className="space-y-3">
                <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Semua Pemasukan</span>
                  <span className="text-sm font-semibold font-mono" style={{ color: 'var(--inc)' }}>{fmt(pemasukan)}</span>
                </div>
                <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Semua Pengeluaran</span>
                  <span className="text-sm font-semibold font-mono" style={{ color: 'var(--exp)' }}>({fmt(pengeluaran)})</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-base font-bold" style={{ color: 'var(--text)' }}>Selisih</span>
                  <span className="text-base font-bold font-mono" style={{ color: selisih >= 0 ? 'var(--inc)' : 'var(--exp)' }}>
                    {fmt(selisih)}
                  </span>
                </div>
              </div>

              {/* Per Buku Kas breakdown */}
              {kasId === 'semua' && kasList.length > 0 && (
                <div className="pt-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Ringkasan per Buku Kas</p>
                  {kasList.map(k => {
                    const txKas = transaksi.filter((t: any) => t.kas?.id === k.id)
                    const masuk = txKas.filter((t: any) => t.tipe === 'pemasukan').reduce((s: number, t: any) => s + t.jumlah, 0)
                    const keluar = txKas.filter((t: any) => t.tipe === 'pengeluaran').reduce((s: number, t: any) => s + t.jumlah, 0)
                    if (masuk === 0 && keluar === 0) return null
                    return (
                      <div key={k.id} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'var(--nav-active-bg)' }}>
                        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{k.nama}</span>
                        <div className="flex gap-4 text-sm">
                          <span style={{ color: 'var(--inc)' }}>+{fmt(masuk)}</span>
                          <span style={{ color: 'var(--exp)' }}>-{fmt(keluar)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {transaksi.length === 0 && (
                <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  <p className="text-sm">Tidak ada transaksi pada periode ini</p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB AKTIVITAS ────────────────────────── */}
          {tab === 'aktivitas' && (
            <div className="space-y-4">
              {/* Pengeluaran */}
              <div className="card overflow-hidden">
                <div className="px-5 py-3 flex items-center gap-2" style={{ background: 'rgba(220,38,38,0.07)', borderBottom: '1px solid var(--border)' }}>
                  <span className="text-sm font-bold" style={{ color: 'var(--exp)' }}>
                    {kasId === 'semua' ? 'Semua Buku Kas' : kasList.find(k => k.id === kasId)?.nama} — Pengeluaran
                  </span>
                </div>
                {Object.values(byKategori).filter((g: any) => g.tipe === 'pengeluaran').length === 0 ? (
                  <p className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>Tidak ada pengeluaran</p>
                ) : (
                  Object.values(byKategori)
                    .filter((g: any) => g.tipe === 'pengeluaran')
                    .map((grp: any) => (
                      <KategoriGroup key={grp.nama} grp={grp} fmtDate={fmtDate} fmt={fmt} tipe="pengeluaran" />
                    ))
                )}
              </div>

              {/* Pemasukan */}
              <div className="card overflow-hidden">
                <div className="px-5 py-3 flex items-center gap-2" style={{ background: 'rgba(22,163,74,0.07)', borderBottom: '1px solid var(--border)' }}>
                  <span className="text-sm font-bold" style={{ color: 'var(--inc)' }}>
                    {kasId === 'semua' ? 'Semua Buku Kas' : kasList.find(k => k.id === kasId)?.nama} — Pemasukan
                  </span>
                </div>
                {Object.values(byKategori).filter((g: any) => g.tipe === 'pemasukan').length === 0 ? (
                  <p className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>Tidak ada pemasukan</p>
                ) : (
                  Object.values(byKategori)
                    .filter((g: any) => g.tipe === 'pemasukan')
                    .map((grp: any) => (
                      <KategoriGroup key={grp.nama} grp={grp} fmtDate={fmtDate} fmt={fmt} tipe="pemasukan" />
                    ))
                )}
              </div>
            </div>
          )}

          {/* ── TAB TRANSFER ─────────────────────────── */}
          {tab === 'transfer' && (
            <div className="space-y-3">
              {Object.values(byKas).length === 0 ? (
                <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  <p className="text-sm">Tidak ada transfer pada periode ini</p>
                </div>
              ) : (
                Object.values(byKas).map((grp: any) => (
                  <div key={grp.nama} className="card overflow-hidden">
                    <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'var(--nav-active-bg)' }}>
                      <span className="text-sm font-bold" style={{ color: 'var(--brand)' }}>⟳ {grp.nama}</span>
                    </div>
                    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {grp.items.map((tr: any) => (
                        <div key={tr.id} className="flex items-center gap-3 px-5 py-2.5">
                          <div className="flex-1">
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {fmtDate(tr.tanggal ?? tr.created_at)}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text)' }}>
                              Transfer dari {tr.dari_kas?.nama} → {tr.ke_kas?.nama}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold font-mono" style={{ color: 'var(--inc)' }}>
                              (+) {fmt(tr.jumlah)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-2 flex justify-between text-xs" style={{ borderTop: '1px solid var(--border)', background: 'var(--nav-active-bg)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Transfer ke {grp.nama}</span>
                      <span className="font-bold font-mono" style={{ color: 'var(--inc)' }}>{fmt(grp.masuk)}</span>
                    </div>
                    <div className="px-5 py-2 flex justify-between text-xs">
                      <span style={{ color: 'var(--text-muted)' }}>Transfer dari {grp.nama}</span>
                      <span className="font-bold font-mono" style={{ color: 'var(--exp)' }}>{fmt(grp.keluar)}</span>
                    </div>
                    <div className="px-5 py-2 flex justify-between text-xs font-bold" style={{ borderTop: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text)' }}>TOTAL</span>
                      <span className="font-mono" style={{ color: grp.masuk - grp.keluar >= 0 ? 'var(--inc)' : 'var(--exp)' }}>
                        {fmt(grp.masuk - grp.keluar)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Sub component: Kategori Group ──────────────────────────
function KategoriGroup({ grp, fmtDate, fmt, tipe }: any) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left"
        style={{ background: tipe === 'pengeluaran' ? 'rgba(220,38,38,0.04)' : 'rgba(22,163,74,0.04)' }}
      >
        <div className="flex items-center gap-2">
          <span>{grp.ikon}</span>
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{grp.nama}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold font-mono" style={{ color: tipe === 'pengeluaran' ? 'var(--exp)' : 'var(--inc)' }}>
            {fmt(grp.total)}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {grp.items.map((tx: any) => (
            <div key={tx.id} className="flex items-center gap-3 px-8 py-2">
              <div className="flex-1">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {fmtDate(tx.tanggal)} {tx.kas?.nama ? `· ${tx.kas.nama}` : ''}
                </p>
                <p className="text-sm" style={{ color: 'var(--text)' }}>{tx.catatan || grp.nama}</p>
              </div>
              <span className="text-sm font-mono" style={{ color: tipe === 'pengeluaran' ? 'var(--exp)' : 'var(--inc)' }}>
                Rp {tx.jumlah.toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
