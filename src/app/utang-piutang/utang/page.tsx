'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getUtang, tambahUtang, hapusUtang, updateStatusUtang,
  type Utang,
} from '@/lib/actions/utang-piutang'
import { getKas } from '@/lib/actions'

interface KasItem { id: string; nama: string }

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}

export default function UtangPage() {
  const [utangs, setUtangs] = useState<Utang[]>([])
  const [kasList, setKasList] = useState<KasItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Form state
  const [tanggalAwal, setTanggalAwal] = useState(new Date().toISOString().split('T')[0])
  const [jatuhTempo, setJatuhTempo] = useState('')
  const [pakeJatuhTempo, setPakeJatuhTempo] = useState(false)
  const [nominal, setNominal] = useState('')
  const [klien, setKlien] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [kasId, setKasId] = useState('tidak')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [utangRes, kasRes] = await Promise.all([getUtang(), getKas()])
      setUtangs((utangRes.data as Utang[]) ?? [])
      setKasList((kasRes.data as KasItem[]) ?? [])
    } catch (e) {
      console.error('Gagal memuat data utang:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function resetForm() {
    setTanggalAwal(new Date().toISOString().split('T')[0])
    setJatuhTempo(''); setPakeJatuhTempo(false)
    setNominal(''); setKlien(''); setDeskripsi(''); setKasId('tidak')
    setShowForm(false); setMsg('')
  }

  async function handleSimpan() {
    if (!klien.trim()) { setMsg('Nama klien wajib diisi'); setIsErr(true); return }
    if (!nominal || Number(nominal) <= 0) { setMsg('Nominal harus lebih dari 0'); setIsErr(true); return }
    if (!deskripsi.trim()) { setMsg('Deskripsi wajib diisi'); setIsErr(true); return }

    setSaving(true); setMsg('')
    const res = await tambahUtang({
      tanggal_awal: tanggalAwal,
      jatuh_tempo: pakeJatuhTempo && jatuhTempo ? jatuhTempo : null,
      nominal: Number(nominal),
      klien,
      deskripsi,
      kas_id: kasId !== 'tidak' ? kasId : null,
    })

    setIsErr(!!res.error)
    if (res.error) {
      setMsg(res.error)
    } else {
      await load()
      resetForm()
    }
    setSaving(false)
  }

  async function handleHapus(id: string) {
    if (!confirm('Hapus utang ini?')) return
    const res = await hapusUtang(id)
    if (res.error) { alert(res.error); return }
    setUtangs(prev => prev.filter(u => u.id !== id))
  }

  async function handleToggleStatus(u: Utang) {
    const newStatus = u.status === 'lunas' ? 'belum_lunas' : 'lunas'
    await updateStatusUtang(u.id, newStatus)
    setUtangs(prev => prev.map(item => item.id === u.id ? { ...item, status: newStatus } : item))
  }

  const filtered = utangs.filter(u =>
    u.klien.toLowerCase().includes(search.toLowerCase()) ||
    u.deskripsi.toLowerCase().includes(search.toLowerCase())
  )

  const totalBelumLunas = utangs.filter(u => u.status === 'belum_lunas').reduce((s, u) => s + u.nominal, 0)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Buku Utang</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Kelola catatan utang Anda</p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Belum Lunas</p>
          <p className="text-xl font-bold" style={{ color: 'var(--exp)' }}>{formatRupiah(totalBelumLunas)}</p>
        </div>
      </div>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded text-sm font-semibold text-white"
          style={{ background: 'var(--brand)' }}
        >
          + Utang Baru
        </button>
      )}

      {/* Form Panel */}
      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Catat Utang Baru</h2>
            <button onClick={resetForm} className="text-sm" style={{ color: 'var(--text-muted)' }}>✕ Tutup</button>
          </div>

          {msg && (
            <div className={`mb-4 p-3 rounded text-sm ${isErr ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {msg}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Tanggal Awal *</label>
                <input
                  type="date" value={tanggalAwal} onChange={e => setTanggalAwal(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox" id="pakai-jatuh-tempo" checked={pakeJatuhTempo}
                    onChange={e => setPakeJatuhTempo(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: 'var(--brand)' }}
                  />
                  <label htmlFor="pakai-jatuh-tempo" className="text-sm font-medium" style={{ color: 'var(--text)' }}>Ada Jatuh Tempo</label>
                </div>
                {pakeJatuhTempo && (
                  <input
                    type="date" value={jatuhTempo} onChange={e => setJatuhTempo(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Nominal *</label>
                <input
                  type="number" min="0" value={nominal} onChange={e => setNominal(e.target.value)}
                  placeholder="0"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Klien / Nama *</label>
                <input
                  type="text" value={klien} onChange={e => setKlien(e.target.value)}
                  placeholder="Nama klien atau perusahaan"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Deskripsi *</label>
              <textarea
                value={deskripsi} onChange={e => setDeskripsi(e.target.value)}
                placeholder="Keterangan utang..."
                rows={2}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none resize-none"
                style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Catat sebagai Pemasukan di Buku Kas?</label>
              <select
                value={kasId} onChange={e => setKasId(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
              >
                <option value="tidak">Tidak</option>
                {kasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={resetForm}
                className="px-4 py-2 rounded text-sm font-semibold border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >Batal</button>
              <button
                onClick={handleSimpan} disabled={saving}
                className="px-5 py-2 rounded text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--brand)' }}
              >{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            Daftar Utang ({filtered.length})
          </h2>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari klien atau deskripsi..."
            className="border rounded px-3 py-1.5 text-sm w-52 focus:outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
          />
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Memuat data...</div>
        ) : paginated.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-4xl mb-2">💸</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {search ? 'Tidak ada utang yang cocok' : 'Belum ada utang. Klik "+ Utang Baru" untuk mencatat.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                    <th className="pb-2 text-left font-semibold pr-3">Status</th>
                    <th className="pb-2 text-left font-semibold pr-3">Tanggal</th>
                    <th className="pb-2 text-left font-semibold pr-3">Klien</th>
                    <th className="pb-2 text-left font-semibold pr-3">Deskripsi</th>
                    <th className="pb-2 text-right font-semibold pr-3">Nominal</th>
                    <th className="pb-2 text-center font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 pr-3">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer"
                          style={{
                            background: u.status === 'lunas' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                            color: u.status === 'lunas' ? '#22c55e' : '#ef4444'
                          }}
                        >
                          {u.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                        </button>
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap" style={{ color: 'var(--text)' }}>
                        {new Date(u.tanggal_awal).toLocaleDateString('id-ID')}
                        {u.jatuh_tempo && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            JT: {new Date(u.jatuh_tempo).toLocaleDateString('id-ID')}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-3 font-medium" style={{ color: 'var(--text)' }}>{u.klien}</td>
                      <td className="py-3 pr-3 max-w-[200px] truncate" style={{ color: 'var(--text-muted)' }}>{u.deskripsi}</td>
                      <td className="py-3 pr-3 text-right font-bold" style={{ color: 'var(--exp)' }}>{formatRupiah(u.nominal)}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleHapus(u.id)}
                          className="text-xs px-3 py-1 rounded border font-semibold"
                          style={{ borderColor: 'rgba(220,38,38,0.4)', color: '#dc2626' }}
                        >Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded text-sm border disabled:opacity-50"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >← Sebelumnya</button>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Halaman {currentPage} dari {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded text-sm border disabled:opacity-50"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >Selanjutnya →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
