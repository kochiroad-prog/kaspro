'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRekapGaji, bayarGajiKaryawan, bayarSemuaGajiPerusahaan, RekapGajiKaryawan } from '@/lib/actions/gaji-absen'
import { getKasList } from '@/lib/actions/kas'
import { getKategori } from '@/lib/actions/kategori'

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

type GrupPerusahaan = {
  perusahaan: string
  karyawan: RekapGajiKaryawan[]
  totalGaji: number
}

export default function GajiPage() {
  const now = new Date()
  const [bulan, setBulan] = useState(now.getMonth() + 1)
  const [tahun, setTahun] = useState(now.getFullYear())
  const [rekap, setRekap] = useState<RekapGajiKaryawan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [kasList, setKasList] = useState<any[]>([])
  const [kategoriList, setKategoriList] = useState<any[]>([])
  const [kasId, setKasId] = useState('')
  const [kategoriId, setKategoriId] = useState('')

  const [payingId, setPayingId] = useState<string | null>(null)
  const [payingGroup, setPayingGroup] = useState<string | null>(null)
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set())
  const [paidGroups, setPaidGroups] = useState<Set<string>>(new Set())
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getRekapGaji(bulan, tahun)
    setLoading(false)
    if (err) { setError(err); return }
    setRekap(data || [])
    setPaidIds(new Set())
    setPaidGroups(new Set())
  }, [bulan, tahun])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    getKasList().then(r => {
      const list = (r.data || []) as any[]
      setKasList(list)
      if (list.length > 0) setKasId(list[0].id)
    })
    getKategori().then(r => {
      const list = (r.data || []) as any[]
      setKategoriList(list)
      const gaji = list.find((k: any) => /gaji|payroll|upah/i.test(k.nama))
      if (gaji) setKategoriId(gaji.id)
      else if (list.length > 0) setKategoriId(list[0].id)
    })
  }, [])

  const grup: GrupPerusahaan[] = Object.values(
    rekap.reduce((acc, k) => {
      if (!acc[k.perusahaan]) acc[k.perusahaan] = { perusahaan: k.perusahaan, karyawan: [], totalGaji: 0 }
      acc[k.perusahaan].karyawan.push(k)
      acc[k.perusahaan].totalGaji += k.total_gaji
      return acc
    }, {} as Record<string, GrupPerusahaan>)
  ).sort((a, b) => a.perusahaan.localeCompare(b.perusahaan))

  const totalSemuaGaji = grup.reduce((s, g) => s + g.totalGaji, 0)
  const totalKaryawan = rekap.length

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const canPay = kasId && kategoriId

  async function handleBayarSatu(k: RekapGajiKaryawan) {
    if (!canPay) { showMsg('err', 'Pilih Kas dan Kategori terlebih dahulu'); return }
    setPayingId(k.payroll_id)
    const { error: err } = await bayarGajiKaryawan(k.nama, k.perusahaan, k.total_gaji, kasId, kategoriId, k.bulan, k.tahun)
    setPayingId(null)
    if (err) { showMsg('err', 'Gagal: ' + err); return }
    setPaidIds(prev => new Set([...prev, k.payroll_id]))
    showMsg('ok', 'Berhasil catat gaji ' + k.nama + ' ' + formatRp(k.total_gaji))
  }

  async function handleBayarGrup(g: GrupPerusahaan) {
    if (!canPay) { showMsg('err', 'Pilih Kas dan Kategori terlebih dahulu'); return }
    const belumBayar = g.karyawan.filter(k => !paidIds.has(k.payroll_id))
    if (belumBayar.length === 0) { showMsg('ok', 'Semua sudah dibayar'); return }
    setPayingGroup(g.perusahaan)
    const { berhasil, error: err } = await bayarSemuaGajiPerusahaan(
      belumBayar.map(k => ({ nama: k.nama, perusahaan: k.perusahaan, total_gaji: k.total_gaji })),
      kasId, kategoriId, bulan, tahun
    )
    setPayingGroup(null)
    if (err) { showMsg('err', 'Gagal: ' + err); return }
    const newPaid = new Set([...paidIds, ...belumBayar.map(k => k.payroll_id)])
    setPaidIds(newPaid)
    if (g.karyawan.every(k => newPaid.has(k.payroll_id))) {
      setPaidGroups(prev => new Set([...prev, g.perusahaan]))
    }
    showMsg('ok', 'Berhasil catat ' + berhasil + ' gaji untuk ' + g.perusahaan)
  }

  const statusBadge = (status: string) => {
    const s = status?.toLowerCase()
    if (s === 'final' || s === 'approved') return <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>✅ Final</span>
    if (s === 'paid') return <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>💸 Paid</span>
    return <span style={{ background: '#fef9c3', color: '#a16207', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>🕐 {status}</span>
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>👔 Rekap Gaji Karyawan</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Data dari aplikasi absen — bayar langsung ke transaksi pengeluaran VALTO
        </p>
      </div>

      {/* Period + Payment Settings */}
      <div className="card p-4 space-y-4">
        {/* Period selector */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Bulan</label>
            <select
              value={bulan}
              onChange={e => setBulan(Number(e.target.value))}
              className="input text-sm"
              style={{ minWidth: 130 }}
            >
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Tahun</label>
            <select
              value={tahun}
              onChange={e => setTahun(Number(e.target.value))}
              className="input text-sm"
              style={{ minWidth: 90 }}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={load} className="btn-secondary text-sm px-4 py-2">
            🔄 Refresh
          </button>
        </div>

        {/* Payment settings */}
        <div className="flex flex-wrap gap-3 items-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>💰 Bayar dari Kas</label>
            <select
              value={kasId}
              onChange={e => setKasId(e.target.value)}
              className="input text-sm"
              style={{ minWidth: 180 }}
            >
              <option value="">-- Pilih Kas --</option>
              {kasList.map((k: any) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>🏷️ Kategori</label>
            <select
              value={kategoriId}
              onChange={e => setKategoriId(e.target.value)}
              className="input text-sm"
              style={{ minWidth: 180 }}
            >
              <option value="">-- Pilih Kategori --</option>
              {kategoriList.map((k: any) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>
          {!canPay && (
            <p className="text-xs" style={{ color: 'var(--exp)' }}>⚠️ Pilih kas &amp; kategori untuk aktifkan tombol bayar</p>
          )}
        </div>
      </div>

      {/* Notification */}
      {msg && (
        <div
          className="px-4 py-3 rounded-xl text-sm font-medium"
          style={{
            background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
            color: msg.type === 'ok' ? '#15803d' : '#b91c1c',
          }}
        >
          {msg.type === 'ok' ? '✅ ' : '❌ '}{msg.text}
        </div>
      )}

      {/* Loading / Error */}
      {loading && (
        <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          <div className="text-3xl mb-2">⏳</div>
          <p>Memuat data gaji dari aplikasi absen...</p>
        </div>
      )}
      {error && (
        <div className="card p-6 text-center">
          <p className="text-2xl mb-2">⚠️</p>
          <p className="font-semibold" style={{ color: 'var(--exp)' }}>Gagal memuat data</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{error}</p>
          {error.includes('belum diset') && (
            <p className="text-sm mt-3 p-3 rounded-lg" style={{ background: 'var(--surface-alt)', color: 'var(--text)' }}>
              Tambahkan env var <code>ABSEN_SUPABASE_URL</code> dan <code>ABSEN_SUPABASE_SERVICE_KEY</code> di Vercel
            </p>
          )}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && rekap.length === 0 && (
        <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          <div className="text-3xl mb-2">📭</div>
          <p>Tidak ada data penggajian untuk {MONTHS[bulan - 1]} {tahun}</p>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && rekap.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Total Karyawan</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{totalKaryawan}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Total Gaji {MONTHS[bulan - 1]}</p>
              <p className="text-xl font-bold" style={{ color: 'var(--brand)' }}>{formatRp(totalSemuaGaji)}</p>
            </div>
            <div className="card p-4 col-span-2 md:col-span-1">
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Perusahaan</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{grup.length}</p>
            </div>
          </div>

          {/* Per perusahaan */}
          {grup.map(g => {
            const semudahBayar = g.karyawan.every(k => paidIds.has(k.payroll_id)) || paidGroups.has(g.perusahaan)
            const belumBayarCount = g.karyawan.filter(k => !paidIds.has(k.payroll_id)).length
            return (
              <div key={g.perusahaan} className="card overflow-hidden">
                {/* Grup header */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}
                >
                  <div>
                    <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>🏢 {g.perusahaan}</h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {g.karyawan.length} karyawan — Total: <strong>{formatRp(g.totalGaji)}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => handleBayarGrup(g)}
                    disabled={!canPay || payingGroup === g.perusahaan || semudahBayar}
                    className="btn-primary text-xs px-3 py-1.5"
                    style={semudahBayar ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    {payingGroup === g.perusahaan
                      ? '⏳ Mencatat...'
                      : semudahBayar
                        ? '✅ Sudah Dicatat'
                        : `💸 Bayar ${belumBayarCount} Karyawan`}
                  </button>
                </div>

                {/* Karyawan table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th className="text-left px-4 py-2 font-semibold text-xs" style={{ color: 'var(--text-muted)' }}>Nama</th>
                        <th className="text-center px-3 py-2 font-semibold text-xs" style={{ color: 'var(--text-muted)' }}>Hadir</th>
                        <th className="text-center px-3 py-2 font-semibold text-xs" style={{ color: 'var(--text-muted)' }}>Absen</th>
                        <th className="text-right px-3 py-2 font-semibold text-xs" style={{ color: 'var(--text-muted)' }}>Gaji Pokok</th>
                        <th className="text-right px-3 py-2 font-semibold text-xs" style={{ color: 'var(--text-muted)' }}>Total Gaji</th>
                        <th className="text-center px-3 py-2 font-semibold text-xs" style={{ color: 'var(--text-muted)' }}>Status</th>
                        <th className="text-center px-4 py-2 font-semibold text-xs" style={{ color: 'var(--text-muted)' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.karyawan.map(k => {
                        const sudahBayar = paidIds.has(k.payroll_id)
                        return (
                          <tr key={k.payroll_id} style={{ borderBottom: '1px solid var(--border)', opacity: sudahBayar ? 0.6 : 1 }}>
                            <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text)' }}>{k.nama}</td>
                            <td className="px-3 py-2.5 text-center" style={{ color: 'var(--text)' }}>{k.hari_efektif}</td>
                            <td className="px-3 py-2.5 text-center" style={{ color: k.hari_absen > 0 ? 'var(--exp)' : 'var(--text-muted)' }}>
                              {k.hari_absen > 0 ? k.hari_absen : '-'}
                            </td>
                            <td className="px-3 py-2.5 text-right" style={{ color: 'var(--text-muted)' }}>{formatRp(k.gaji_pokok)}</td>
                            <td className="px-3 py-2.5 text-right font-semibold" style={{ color: 'var(--brand)' }}>{formatRp(k.total_gaji)}</td>
                            <td className="px-3 py-2.5 text-center">{statusBadge(k.status)}</td>
                            <td className="px-4 py-2.5 text-center">
                              {sudahBayar ? (
                                <span className="text-xs font-medium" style={{ color: '#15803d' }}>✅ Dicatat</span>
                              ) : (
                                <button
                                  onClick={() => handleBayarSatu(k)}
                                  disabled={!canPay || payingId === k.payroll_id}
                                  className="text-xs px-3 py-1 rounded-lg font-medium transition-opacity hover:opacity-80"
                                  style={{
                                    background: canPay ? 'var(--brand)' : 'var(--border)',
                                    color: canPay ? 'white' : 'var(--text-muted)',
                                    cursor: canPay ? 'pointer' : 'not-allowed',
                                  }}
                                >
                                  {payingId === k.payroll_id ? '⏳' : '💸 Bayar'}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      {/* Subtotal row */}
                      <tr style={{ background: 'var(--surface-alt)' }}>
                        <td className="px-4 py-2 text-xs font-bold" style={{ color: 'var(--text)' }} colSpan={4}>Subtotal {g.perusahaan}</td>
                        <td className="px-3 py-2 text-right text-sm font-bold" style={{ color: 'var(--brand)' }}>{formatRp(g.totalGaji)}</td>
                        <td colSpan={2} />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}

          {/* Grand total */}
          <div
            className="card p-4 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #8b5cf6 100%)' }}
          >
            <div>
              <p className="text-sm font-semibold text-white/80">Total Pengeluaran Gaji</p>
              <p className="text-xs text-white/60">{MONTHS[bulan - 1]} {tahun} — {totalKaryawan} karyawan</p>
            </div>
            <p className="text-2xl font-extrabold text-white">{formatRp(totalSemuaGaji)}</p>
          </div>
        </>
      )}
    </div>
  )
}
