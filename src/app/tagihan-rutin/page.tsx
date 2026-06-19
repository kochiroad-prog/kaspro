'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getTagihanRutin, tambahTagihanRutin, hapusTagihanRutin, toggleAktifTagihanRutin,
  type TagihanRutin,
} from '@/lib/actions/tagihan-rutin'
import { getKategori } from '@/lib/actions'
import { getKas } from '@/lib/actions'

interface KategoriItem { id: string; nama: string; tipe: string }
interface KasItem { id: string; nama: string }

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}

function namaHari(tgl: number): string {
  const suffix = tgl === 1 ? 'st' : tgl === 2 ? 'nd' : tgl === 3 ? 'rd' : 'th'
  return `Tiap tgl ${tgl}`
}

function hariMenujuTanggal(tanggal: number): number {
  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), tanggal)
  if (thisMonth < today) {
    thisMonth.setMonth(thisMonth.getMonth() + 1)
  }
  const diff = Math.ceil((thisMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function TagihanRutinPage() {
  const [items, setItems] = useState<TagihanRutin[]>([])
  const [kategoriList, setKategoriList] = useState<KategoriItem[]>([])
  const [kasList, setKasList] = useState<KasItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)

  const [nama, setNama] = useState('')
  const [nominal, setNominal] = useState('')
  const [tanggal, setTanggal] = useState('1')
  const [jenis, setJenis] = useState<'tetap' | 'estimasi'>('tetap')
  const [kategoriId, setKategoriId] = useState('')
  const [kasId, setKasId] = useState('')
  const [catatan, setCatatan] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tagRes, katRes, kasRes] = await Promise.all([
        getTagihanRutin(),
        getKategori(),
        getKas(),
      ])
      setItems((tagRes.data as TagihanRutin[]) ?? [])
      setKategoriList(((katRes.data as KategoriItem[]) ?? []).filter(k => k.tipe === 'pengeluaran'))
      setKasList((kasRes.data as KasItem[]) ?? [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function resetForm() {
    setNama(''); setNominal(''); setTanggal('1'); setJenis('tetap')
    setKategoriId(''); setKasId(''); setCatatan('')
    setShowForm(false); setMsg('')
  }

  async function handleSimpan() {
    if (!nama.trim()) { setMsg('Nama tagihan wajib diisi'); setIsErr(true); return }
    if (!nominal || Number(nominal) <= 0) { setMsg('Nominal harus > 0'); setIsErr(true); return }
    const tgl = Number(tanggal)
    if (!tgl || tgl < 1 || tgl > 31) { setMsg('Tanggal harus 1-31'); setIsErr(true); return }
    setSaving(true); setMsg('')
    const res = await tambahTagihanRutin({
      nama, nominal: Number(nominal),
      tanggal_tiap_bulan: tgl,
      jenis,
      kategori_id: kategoriId || null,
      kas_id: kasId || null,
      catatan: catatan || null,
    })
    setIsErr(!!res.error)
    if (res.error) { setMsg(res.error) } else { await load(); resetForm() }
    setSaving(false)
  }

  async function handleHapus(id: string) {
    if (!confirm('Hapus tagihan rutin ini?')) return
    const res = await hapusTagihanRutin(id)
    if (res.error) { alert(res.error); return }
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function handleToggle(item: TagihanRutin) {
    const newAktif = !item.aktif
    await toggleAktifTagihanRutin(item.id, newAktif)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, aktif: newAktif } : i))
  }

  const totalBulanan = items.filter(i => i.aktif).reduce((s, i) => s + i.nominal, 0)
  const aktifCount = items.filter(i => i.aktif).length

  const inp = {
    className: "w-full border rounded px-3 py-2 text-sm focus:outline-none",
    style: { borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Tagihan Rutin</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Pengeluaran tetap & estimasi bulanan — otomatis masuk ke proyeksi arus kas
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Aktif / Bulan</p>
          <p className="text-xl font-bold" style={{ color: 'var(--exp)' }}>{formatRupiah(totalBulanan)}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{aktifCount} tagihan aktif</p>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-xl p-4 text-sm" style={{ background: 'var(--brand-light)', border: '1px solid var(--brand)', color: 'var(--brand)' }}>
        <p className="font-semibold mb-1">💡 Cara Pakai</p>
        <p style={{ color: 'var(--text)' }}>
          Daftarkan pengeluaran yang sudah pasti setiap bulan: cicilan, gaji estimasi, internet, dll.
          Data ini akan muncul otomatis di <strong>AI Proyeksi</strong> sehingga saldo 7 hari ke depan lebih akurat.
        </p>
      </div>

      {!showForm && (
        <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded text-sm font-semibold text-white" style={{ background: 'var(--brand)' }}>
          + Tambah Tagihan Rutin
        </button>
      )}

      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Tagihan Rutin Baru</h2>
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Nama Tagihan *</label>
                <input type="text" value={nama} onChange={e => setNama(e.target.value)} placeholder="Cicilan BRI, Gaji Tim, Internet..." {...inp} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Nominal *</label>
                <input type="number" min="0" value={nominal} onChange={e => setNominal(e.target.value)} placeholder="0" {...inp} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Tanggal Jatuh Tiap Bulan *</label>
                <input type="number" min="1" max="31" value={tanggal} onChange={e => setTanggal(e.target.value)} placeholder="1-31" {...inp} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Misal: 5 → jatuh tiap tgl 5</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Jenis</label>
                <select value={jenis} onChange={e => setJenis(e.target.value as 'tetap' | 'estimasi')} {...inp}>
                  <option value="tetap">Tetap (nominal pasti)</option>
                  <option value="estimasi">Estimasi (nominal perkiraan)</option>
                </select>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {jenis === 'estimasi' ? 'Contoh: gaji (berubah tiap bulan), listrik prabayar' : 'Contoh: cicilan, internet (nominal sama tiap bulan)'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Kategori Pengeluaran</label>
                <select value={kategoriId} onChange={e => setKategoriId(e.target.value)} {...inp}>
                  <option value="">— Pilih kategori —</option>
                  {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Bayar dari Kas</label>
                <select value={kasId} onChange={e => setKasId(e.target.value)} {...inp}>
                  <option value="">— Pilih kas —</option>
                  {kasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Catatan</label>
              <input type="text" value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Opsional..." {...inp} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={resetForm} className="px-4 py-2 rounded text-sm font-semibold border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Batal</button>
              <button onClick={handleSimpan} disabled={saving} className="px-5 py-2 rounded text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'var(--brand)' }}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text)' }}>Daftar Tagihan Rutin ({items.length})</h2>
        {loading ? (
          <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Memuat data...</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Belum ada tagihan rutin. Tambahkan pengeluaran tetap bulanan Anda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const hariLagi = hariMenujuTanggal(item.tanggal_tiap_bulan)
              const isSegera = hariLagi <= 7 && item.aktif
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{
                    background: item.aktif ? 'var(--card-bg)' : 'var(--surface)',
                    border: `1px solid ${isSegera ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
                    opacity: item.aktif ? 1 : 0.6,
                  }}
                >
                  {/* Toggle aktif */}
                  <button
                    onClick={() => handleToggle(item)}
                    className="flex-shrink-0 w-10 h-6 rounded-full transition-colors relative"
                    style={{ background: item.aktif ? 'var(--brand)' : 'var(--border)' }}
                    title={item.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    <span
                      className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: item.aktif ? '22px' : '2px' }}
                    />
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{item.nama}</p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: item.jenis === 'tetap' ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)',
                          color: item.jenis === 'tetap' ? 'var(--brand)' : '#f59e0b',
                        }}
                      >
                        {item.jenis === 'tetap' ? 'Tetap' : 'Estimasi'}
                      </span>
                      {isSegera && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">
                          ⏰ {hariLagi === 0 ? 'Hari ini!' : `${hariLagi} hari lagi`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>📅 {namaHari(item.tanggal_tiap_bulan)}</span>
                      {item.kategori && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>🏷️ {item.kategori.nama}</span>}
                      {item.kas && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>💰 {item.kas.nama}</span>}
                      {item.catatan && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>📝 {item.catatan}</span>}
                    </div>
                  </div>

                  {/* Nominal */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: 'var(--exp)' }}>{formatRupiah(item.nominal)}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>/bulan</p>
                  </div>

                  {/* Hapus */}
                  <button
                    onClick={() => handleHapus(item.id)}
                    className="flex-shrink-0 text-xs px-2 py-1 rounded border font-semibold"
                    style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}
                  >
                    Hapus
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
