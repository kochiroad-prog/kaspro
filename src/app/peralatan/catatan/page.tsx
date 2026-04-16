'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getCatatan, tambahCatatan, updateCatatan, hapusCatatan,
  type Catatan,
} from '@/lib/actions/catatan'

const WARNA_OPTIONS = [
  { nama: 'Kuning', hex: '#FFF9C4' },
  { nama: 'Merah', hex: '#FFCDD2' },
  { nama: 'Hijau', hex: '#C8E6C9' },
  { nama: 'Biru', hex: '#BBDEFB' },
  { nama: 'Abu-Abu', hex: '#ECEFF1' },
  { nama: 'Putih', hex: '#FFFFFF' },
]

export default function CatatanPage() {
  const [catatanList, setCatatanList] = useState<Catatan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTeks, setEditingTeks] = useState('')
  const [editingWarna, setEditingWarna] = useState('#FFF9C4')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCatatan()
      setCatatanList((res.data as Catatan[]) ?? [])
    } catch (e) {
      console.error('Gagal memuat catatan:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleTambah() {
    try {
      const res = await tambahCatatan({ teks: '', warna: '#FFF9C4' })
      if (res.data) {
        setCatatanList(prev => [res.data as Catatan, ...prev])
        bukaEdit(res.data as Catatan)
      }
    } catch (e) {
      console.error('Gagal tambah catatan:', e)
    }
  }

  async function handleHapus(id: string) {
    try {
      const res = await hapusCatatan(id)
      if (!res.error) {
        setCatatanList(prev => prev.filter(c => c.id !== id))
      }
    } catch (e) {
      console.error('Gagal hapus catatan:', e)
    }
  }

  async function handleSimpan() {
    if (!editingId) return
    setSaving(true)
    try {
      await updateCatatan(editingId, { teks: editingTeks, warna: editingWarna })
      setCatatanList(prev => prev.map(c =>
        c.id === editingId ? { ...c, teks: editingTeks, warna: editingWarna } : c
      ))
      setEditingId(null)
    } catch (e) {
      console.error('Gagal simpan catatan:', e)
    } finally {
      setSaving(false)
    }
  }

  async function handleUbahWarna(id: string, warna: string) {
    try {
      await updateCatatan(id, { warna })
      setCatatanList(prev => prev.map(c => c.id === id ? { ...c, warna } : c))
    } catch (e) {
      console.error('Gagal ubah warna:', e)
    }
  }

  function bukaEdit(c: Catatan) {
    setEditingId(c.id)
    setEditingTeks(c.teks)
    setEditingWarna(c.warna)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Catatan</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pengingat dan Tulisan Ringkas</p>
          </div>
        </div>
        <button
          onClick={handleTambah}
          className="px-4 py-2 rounded text-sm font-semibold text-white"
          style={{ background: 'var(--brand)' }}
        >
          + Catatan Baru
        </button>
      </div>

      {/* Grid Catatan */}
      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Memuat catatan...</div>
      ) : catatanList.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Belum ada catatan. Klik "+ Catatan Baru" untuk membuat.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catatanList.map(catatan => (
            <div
              key={catatan.id}
              className="rounded-lg p-4 shadow-sm border cursor-pointer transition-transform hover:scale-[1.02]"
              style={{ background: catatan.warna, borderColor: 'var(--border)' }}
              onClick={() => bukaEdit(catatan)}
            >
              <div className="h-32 overflow-hidden text-sm" style={{ color: catatan.warna === '#FFFFFF' ? 'var(--text)' : '#333' }}>
                <p className="whitespace-pre-wrap break-words">{catatan.teks || <span className="italic opacity-50">(kosong)</span>}</p>
              </div>

              <div className="mt-3 flex items-end justify-between">
                {/* Warna Selector */}
                <div className="flex gap-1">
                  {WARNA_OPTIONS.map(w => (
                    <button
                      key={w.hex}
                      onClick={e => {
                        e.stopPropagation()
                        handleUbahWarna(catatan.id, w.hex)
                      }}
                      className="w-4 h-4 rounded-full border-2"
                      style={{
                        background: w.hex,
                        borderColor: catatan.warna === w.hex ? '#555' : 'transparent',
                      }}
                      title={w.nama}
                    />
                  ))}
                </div>

                {/* Delete */}
                <button
                  onClick={e => {
                    e.stopPropagation()
                    handleHapus(catatan.id)
                  }}
                  className="text-lg hover:opacity-70"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edit */}
      {editingId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setEditingId(null)}
        >
          <div
            className="w-full max-w-md rounded-lg p-6 shadow-lg"
            style={{ background: 'var(--card-bg)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>Edit Catatan</h2>

            {/* Pilih warna */}
            <div className="flex gap-2 mb-3">
              {WARNA_OPTIONS.map(w => (
                <button
                  key={w.hex}
                  onClick={() => setEditingWarna(w.hex)}
                  className="w-6 h-6 rounded-full border-2"
                  style={{
                    background: w.hex,
                    borderColor: editingWarna === w.hex ? '#555' : 'var(--border)',
                  }}
                  title={w.nama}
                />
              ))}
            </div>

            <textarea
              value={editingTeks}
              onChange={e => setEditingTeks(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none resize-none"
              rows={8}
              style={{ borderColor: 'var(--border)', background: editingWarna, color: '#333' }}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 px-4 py-2 rounded text-sm font-semibold border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                Batal
              </button>
              <button
                onClick={handleSimpan} disabled={saving}
                className="flex-1 px-4 py-2 rounded text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--brand)' }}
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
