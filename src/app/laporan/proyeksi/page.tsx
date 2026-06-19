'use client'

import { useState, useEffect, useCallback } from 'react'
import { getUtang, getPiutang, type Utang, type Piutang } from '@/lib/actions/utang-piutang'
import { getKas } from '@/lib/actions'

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
    hutang_usaha: 'Hutang Usaha',
    tagihan_berulang: 'Tagihan Berulang',
    cicilan: 'Cicilan',
    kasbon: 'Kasbon',
    piutang_usaha: 'Piutang Usaha',
  }
  return map[tipe] ?? tipe
}

export default function ProyeksiPage() {
  const [utangs, setUtangs] = useState<Utang[]>([])
  const [piutangs, setPiutangs] = useState<Piutang[]>([])
  const [kasList, setKasList] = useState<KasStat[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [laporan, setLaporan] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [utangRes, piutangRes, kasRes] = await Promise.all([
        getUtang(),
        getPiutang(),
        getKas(),
      ])
      setUtangs((utangRes.data as Utang[]) ?? [])
      setPiutangs((piutangRes.data as Piutang[]) ?? [])
      setKasList((kasRes.data as KasStat[]) ?? [])
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

  const totalSaldo = kasList.reduce((s, k) => s + k.saldo, 0)
  const totalUtangJT = utangJatuhTempo.reduce((s, u) => s + u.nominal, 0)
  const totalUtangTerlambat = utangTerlambat.reduce((s, u) => s + u.nominal, 0)
  const totalPiutang = piutangOutstanding.reduce((s, p) => s + p.nominal, 0)
  const sisaSaldoSetelahJT = totalSaldo - totalUtangJT - totalUtangTerlambat

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    setLaporan('')
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
          Analisis real-time oleh AI CFO — utang jatuh tempo, piutang outstanding, dan kesehatan kas
        </p>
      </div>

      {/* Kartu Ringkasan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>💰 Total Saldo</p>
          <p className="text-base font-bold" style={{ color: 'var(--inc)' }}>{formatRp(totalSaldo)}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>⏰ Jatuh Tempo 7 Hari</p>
          <p className="text-base font-bold" style={{ color: totalUtangJT > 0 ? 'var(--exp)' : 'var(--text-muted)' }}>
            {formatRp(totalUtangJT)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{utangJatuhTempo.length} tagihan</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>🔴 Terlambat</p>
          <p className="text-base font-bold" style={{ color: totalUtangTerlambat > 0 ? '#ef4444' : 'var(--text-muted)' }}>
            {formatRp(totalUtangTerlambat)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{utangTerlambat.length} tagihan</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>📥 Piutang Belum Masuk</p>
          <p className="text-base font-bold" style={{ color: 'var(--brand)' }}>{formatRp(totalPiutang)}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{piutangOutstanding.length} tagihan</p>
        </div>
      </div>

      {/* Posisi Kas Setelah Kewajiban */}
      <div
        className="card p-4 flex items-center justify-between"
        style={{
          background: sisaSaldoSetelahJT < 0
            ? 'rgba(239,68,68,0.08)'
            : 'rgba(34,197,94,0.08)',
          borderColor: sisaSaldoSetelahJT < 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)',
          border: '1px solid',
        }}
      >
        <div>
          <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>
            Sisa Kas Setelah Semua Kewajiban Mendesak
          </p>
          <p className="text-2xl font-bold" style={{ color: sisaSaldoSetelahJT < 0 ? '#ef4444' : '#22c55e' }}>
            {formatRp(sisaSaldoSetelahJT)}
          </p>
        </div>
        <div className="text-4xl">
          {sisaSaldoSetelahJT < 0 ? '⚠️' : sisaSaldoSetelahJT < totalSaldo * 0.3 ? '🟡' : '✅'}
        </div>
      </div>

      {/* Tabel Utang Jatuh Tempo */}
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

      {/* Tabel Utang Terlambat */}
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

      {/* Tabel Piutang Outstanding */}
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
              AI akan menganalisis data di atas dan memberikan laporan proyeksi arus kas, prioritas pembayaran, dan rekomendasi tindakan.
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
            style={{
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              fontFamily: 'inherit',
            }}
          >
            {laporan}
          </div>
        )}
      </div>

      {/* Empty state jika semua bersih */}
      {utangJatuhTempo.length === 0 && utangTerlambat.length === 0 && piutangOutstanding.length === 0 && (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>Semua Bersih!</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Tidak ada utang jatuh tempo atau piutang outstanding saat ini.
            <br />Catat utang & piutang di menu Utang Piutang untuk melihat proyeksi.
          </p>
        </div>
      )}
    </div>
  )
}
