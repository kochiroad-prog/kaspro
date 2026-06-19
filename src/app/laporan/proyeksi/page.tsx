'use client'

import { useState, useEffect, useCallback } from 'react'
import { getUtang, getPiutang, type Utang, type Piutang } from '@/lib/actions/utang-piutang'
import { getKas } from '@/lib/actions'
import { getTagihanRutin, catatPembayaranTagihan, type TagihanRutin } from '@/lib/actions/tagihan-rutin'

interface KasStat { id: string; nama: string; saldo: number; tipe?: string }

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function daysDiff(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function tipeLabel(tipe: string) {
  const map: Record<string, string> = {
    hutang_usaha: 'Hutang Usaha', tagihan_berulang: 'Tagihan Berulang',
    cicilan: 'Cicilan', kasbon: 'Kasbon', piutang_usaha: 'Piutang Usaha',
  }
  return map[tipe] ?? tipe
}

// Hitung hari menuju tagihan rutin berikutnya (tanggal bulanan)
function hariMenujuTagihanBulanan(tanggal: number): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  for (let i = 0; i <= 31; i++) {
    const check = new Date(today); check.setDate(today.getDate() + i)
    if (check.getDate() === tanggal) return i
  }
  return 99
}

function tagihanDalam7Hari(tanggal: number): boolean {
  return hariMenujuTagihanBulanan(tanggal) <= 7
}

export default function ProyeksiPage() {
  const [utangs, setUtangs] = useState<Utang[]>([])
  const [piutangs, setPiutangs] = useState<Piutang[]>([])
  const [kasList, setKasList] = useState<KasStat[]>([])
  const [tagihanRutin, setTagihanRutin] = useState<TagihanRutin[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [laporan, setLaporan] = useState('')
  const [error, setError] = useState('')
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payMsg, setPayMsg] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [utangRes, piutangRes, kasRes, tagihanRes] = await Promise.all([
        getUtang(), getPiutang(), getKas(), getTagihanRutin(),
      ])
      setUtangs((utangRes.data as Utang[]) ?? [])
      setPiutangs((piutangRes.data as Piutang[]) ?? [])
      setKasList((kasRes.data as KasStat[]) ?? [])
      setTagihanRutin((tagihanRes.data as TagihanRutin[]) ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Filter data
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const in7days = new Date(today); in7days.setDate(today.getDate() + 7)

  const utangBelumLunas = utangs.filter(u => u.status === 'belum_lunas')
  const utangJatuhTempo = utangBelumLunas.filter(u => {
    if (!u.jatuh_tempo) return false
    const jt = new Date(u.jatuh_tempo); jt.setHours(0, 0, 0, 0)
    return jt >= today && jt <= in7days
  })
  const utangTerlambat = utangBelumLunas.filter(u => {
    if (!u.jatuh_tempo) return false
    const jt = new Date(u.jatuh_tempo); jt.setHours(0, 0, 0, 0)
    return jt < today
  })
  const piutangOutstanding = piutangs.filter(p => p.status === 'belum_lunas')
  const tagihanSegera = tagihanRutin.filter(t => t.aktif && tagihanDalam7Hari(t.tanggal_tiap_bulan))

  const totalSaldo = kasList.reduce((s, k) => s + k.saldo, 0)
  const totalUtangJT = utangJatuhTempo.reduce((s, u) => s + u.nominal, 0)
  const totalUtangTerlambat = utangTerlambat.reduce((s, u) => s + u.nominal, 0)
  const totalPiutang = piutangOutstanding.reduce((s, p) => s + p.nominal, 0)
  const totalTagihanSegera = tagihanSegera.reduce((s, t) => s + t.nominal, 0)
  const sisaSaldo = totalSaldo - totalUtangJT - totalUtangTerlambat - totalTagihanSegera

  async function handleCatatBayar(tagihan: TagihanRutin) {
    setPayingId(tagihan.id)
    setPayMsg(prev => ({ ...prev, [tagihan.id]: '' }))
    const res = await catatPembayaranTagihan(tagihan.id)
    if (res.error) {
      setPayMsg(prev => ({ ...prev, [tagihan.id]: '❌ ' + res.error }))
    } else {
      setPayMsg(prev => ({ ...prev, [tagihan.id]: '✅ Pembayaran dicatat ke Kas!' }))
      await load()
    }
    setPayingId(null)
  }

  async function handleGenerate() {
    setGenerating(true); setError(''); setLaporan('')
    try {
      const res = await fetch('/api/ai/proyeksi-arus-kas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utangJatuhTempo: utangJatuhTempo.map(u => ({
            klien: u.klien, nominal: u.nominal,
            jatuh_tempo: u.jatuh_tempo, tipe: u.tipe, deskripsi: u.deskripsi,
          })),
          utangTerlambat: utangTerlambat.map(u => ({
            klien: u.klien, nominal: u.nominal,
            jatuh_tempo: u.jatuh_tempo, tipe: u.tipe, deskripsi: u.deskripsi,
          })),
          piutangOutstanding: piutangOutstanding.map(p => ({
            klien: p.klien, nominal: p.nominal,
            jatuh_tempo: p.jatuh_tempo, tipe: p.tipe, deskripsi: p.deskripsi,
          })),
          tagihanRutinSegera: tagihanSegera.map(t => ({
            nama: t.nama, nominal: t.nominal,
            tanggal_tiap_bulan: t.tanggal_tiap_bulan, jenis: t.jenis,
            hari_lagi: hariMenujuTagihanBulanan(t.tanggal_tiap_bulan),
          })),
          kasList,
          tanggalHariIni: today.toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          }),
        }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setLaporan(data.laporan)
    } catch {
      setError('Gagal menghubungi AI. Periksa koneksi internet.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🤖</div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Memuat data keuangan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>🤖 AI Proyeksi Arus Kas</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Analisis real-time — utang jatuh tempo, tagihan rutin, piutang outstanding, dan proyeksi saldo 7 hari ke depan
        </p>
      </div>

      {/* Kartu Ringkasan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>💰 Total Saldo</p>
          <p className="text-base font-bold" style={{ color: 'var(--inc)' }}>{formatRp(totalSaldo)}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>⏰ Utang Jatuh Tempo</p>
          <p className="text-base font-bold" style={{ color: totalUtangJT > 0 ? 'var(--exp)' : 'var(--text-muted)' }}>
            {formatRp(totalUtangJT)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{utangJatuhTempo.length} tagihan</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>📋 Tagihan Rutin 7 Hari</p>
          <p className="text-base font-bold" style={{ color: totalTagihanSegera > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
            {formatRp(totalTagihanSegera)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{tagihanSegera.length} tagihan</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>📥 Piutang Belum Masuk</p>
          <p className="text-base font-bold" style={{ color: 'var(--brand)' }}>{formatRp(totalPiutang)}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{piutangOutstanding.length} tagihan</p>
        </div>
      </div>

      {/* Posisi Kas Proyeksi */}
      <div
        className="card p-4"
        style={{
          background: sisaSaldo < 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
          borderColor: sisaSaldo < 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)',
          border: '1px solid',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>
              Proyeksi Saldo Setelah Semua Kewajiban 7 Hari
            </p>
            <p className="text-2xl font-bold" style={{ color: sisaSaldo < 0 ? '#ef4444' : '#22c55e' }}>
              {formatRp(sisaSaldo)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {formatRp(totalSaldo)} saldo
              {totalUtangJT + totalUtangTerlambat > 0 && ` − ${formatRp(totalUtangJT + totalUtangTerlambat)} utang`}
              {totalTagihanSegera > 0 && ` − ${formatRp(totalTagihanSegera)} tagihan rutin`}
            </p>
          </div>
          <div className="text-4xl">
            {sisaSaldo < 0 ? '⚠️' : sisaSaldo < totalSaldo * 0.3 ? '🟡' : '✅'}
          </div>
        </div>
      </div>

      {/* Tagihan Rutin Segera */}
      {tagihanSegera.length > 0 && (
        <div className="card p-5" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: '#f59e0b' }}>
              📋 Tagihan Rutin — Jatuh dalam 7 Hari
            </h3>
            <a href="/tagihan-rutin" className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>
              Kelola →
            </a>
          </div>
          <div className="space-y-2">
            {tagihanSegera.map(t => {
              const hari = hariMenujuTagihanBulanan(t.tanggal_tiap_bulan)
              const msg = payMsg[t.id]
              const siapBayar = !!t.kas_id && !!t.kategori_id
              return (
                <div key={t.id} className="p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t.nama}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                          {t.jenis === 'tetap' ? 'Tetap' : 'Estimasi'}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        📅 Tiap tgl {t.tanggal_tiap_bulan}
                        {t.kas?.nama && ` · 💰 ${t.kas.nama}`}
                        {t.kategori?.nama && ` · 🏷️ ${t.kategori.nama}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: 'var(--exp)' }}>{formatRp(t.nominal)}</p>
                      <p className="text-xs font-semibold" style={{ color: hari === 0 ? '#ef4444' : hari <= 2 ? '#f59e0b' : 'var(--text-muted)' }}>
                        {hari === 0 ? 'HARI INI!' : hari === 1 ? 'Besok' : `${hari} hari lagi`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCatatBayar(t)}
                      disabled={payingId === t.id}
                      title={!siapBayar ? 'Lengkapi Kas & Kategori di halaman Tagihan Rutin' : 'Catat pembayaran ke buku kas'}
                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-semibold text-white disabled:opacity-60"
                      style={{ background: siapBayar ? 'var(--brand)' : 'var(--text-muted)', cursor: siapBayar ? 'pointer' : 'not-allowed' }}
                    >
                      {payingId === t.id ? '...' : 'Catat Bayar'}
                    </button>
                  </div>
                  {msg && (
                    <p className="text-xs mt-2 font-medium" style={{ color: msg.startsWith('✅') ? '#22c55e' : '#ef4444' }}>{msg}</p>
                  )}
                  {!siapBayar && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      ⚠️ Lengkapi Kas & Kategori di <a href="/tagihan-rutin" className="underline">Tagihan Rutin</a> agar bisa dicatat otomatis
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Utang Jatuh Tempo */}
      {utangJatuhTempo.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>
            ⏰ Utang Jatuh Tempo 7 Hari ke Depan
          </h3>
          <div className="space-y-2">
            {utangJatuhTempo.map(u => {
              const hari = daysDiff(u.jatuh_tempo!)
              return (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{u.klien}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.deskripsi}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                      {tipeLabel(u.tipe)}
                    </span>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: 'var(--exp)' }}>{formatRp(u.nominal)}</p>
                    <p className="text-xs font-semibold" style={{ color: hari <= 2 ? '#ef4444' : hari <= 4 ? '#f59e0b' : 'var(--text-muted)' }}>
                      {hari === 0 ? 'HARI INI!' : hari === 1 ? 'Besok' : `${hari} hari lagi`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Utang Terlambat */}
      {utangTerlambat.length > 0 && (
        <div className="card p-5" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#ef4444' }}>
            🔴 Utang Sudah Melewati Jatuh Tempo
          </h3>
          <div className="space-y-2">
            {utangTerlambat.map(u => {
              const hari = Math.abs(daysDiff(u.jatuh_tempo!))
              return (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{u.klien}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.deskripsi}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                      {tipeLabel(u.tipe)}
                    </span>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: '#ef4444' }}>{formatRp(u.nominal)}</p>
                    <p className="text-xs font-semibold" style={{ color: '#ef4444' }}>Terlambat {hari} hari</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Piutang Outstanding */}
      {piutangOutstanding.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>
            📥 Piutang Belum Tertagih
          </h3>
          <div className="space-y-2">
            {piutangOutstanding.map(p => {
              const hari = p.jatuh_tempo ? daysDiff(p.jatuh_tempo) : null
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{p.klien}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{p.deskripsi}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                      {tipeLabel(p.tipe)}
                    </span>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: 'var(--inc)' }}>{formatRp(p.nominal)}</p>
                    {hari !== null && (
                      <p className="text-xs" style={{ color: hari < 0 ? '#ef4444' : 'var(--text-muted)' }}>
                        {hari < 0 ? `Terlambat ${Math.abs(hari)} hari` : hari === 0 ? 'Jatuh tempo hari ini' : `${hari} hari lagi`}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Generate AI Report */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🤖</div>
          <div className="flex-1">
            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>Analisis AI CFO</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              AI menganalisis utang, tagihan rutin, piutang, dan saldo — lalu memberikan proyeksi & rekomendasi tindakan.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all active:scale-95"
              style={{ background: generating ? 'var(--text-muted)' : 'var(--brand)' }}
            >
              {generating ? '⏳ AI sedang menganalisis...' : '✨ Generate Laporan AI'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
            {error}
          </div>
        )}

        {laporan && (
          <div
            className="mt-5 p-5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
            style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', fontFamily: 'inherit' }}
          >
            {laporan}
          </div>
        )}
      </div>

      {/* Empty state */}
      {utangJatuhTempo.length === 0 && utangTerlambat.length === 0 && piutangOutstanding.length === 0 && tagihanSegera.length === 0 && (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>Semua Bersih!</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Tidak ada kewajiban mendesak dalam 7 hari ke depan.
            <br />Tambahkan <a href="/tagihan-rutin" className="underline" style={{ color: 'var(--brand)' }}>Tagihan Rutin</a> untuk proyeksi lebih akurat.
          </p>
        </div>
      )}
    </div>
  )
}
