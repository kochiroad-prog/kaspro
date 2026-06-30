'use client'

import { useState, useEffect } from 'react'
import { getUnitBisnis, tambahUnitBisnis, updateUnitBisnis, hapusUnitBisnis } from '@/lib/actions/index'
import type { UnitBisnis } from '@/types'

const tipeBorder = ['border-t-[var(--brand)]', 'border-t-blue-500', 'border-t-purple-500', 'border-t-amber-500']
const emptyForm = { nama: '', alamat: '', deskripsi: '' }

export default function UnitBisnisPage() {
  const [list, setList]         = useState<UnitBisnis[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [form, setForm]         = useState({ ...emptyForm })
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')
  const [isErr, setIsErr]       = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await getUnitBisnis()
    setList((data as UnitBisnis[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startAdd() {
    setEditId(null)
    setForm({ ...emptyForm })
    setMsg('')
    setShowForm(true)
  }

  function startEdit(u: UnitBisnis) {
    setEditId(u.id)
    setForm({ nama: u.nama, alamat: u.alamat ?? '', deskripsi: u.deskripsi ?? '' })
    setMsg('')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
    setMsg('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const payload = {
      nama: form.nama,
      alamat: form.alamat || undefined,
      deskripsi: form.deskripsi || undefined,
    }
    const result = editId
      ? await updateUnitBisnis(editId, payload)
      : await tambahUnitBisnis(payload)

    setIsErr(!!result.error)
    if (result.error) {
      setMsg(result.error)
    } else {
      setMsg(editId ? 'Unit bisnis berhasil diperbarui!' : 'Unit bisnis berhasil ditambahkan!')
      await load()
      if (!editId) setForm({ ...emptyForm })
      else closeForm()
    }
    setSaving(false)
  }

  async function handleDelete(u: UnitBisnis) {
    if (!confirm(`Hapus unit bisnis "${u.nama}"?`)) return
    const result = await hapusUnitBisnis(u.id)
    if (result.error) { alert(result.error); return }
    await load()
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Unit Bisnis</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Kelola cabang, booth, atau outlet usaha Anda</p>
        </div>
        {!showForm && (
          <button onClick={startAdd} className="btn-primary text-sm px-4 py-2">
            + Tambah Unit
          </button>
        )}
      </div>

      {/* ── FORM TAMBAH / EDIT ─────────────────────────────── */}
      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
              {editId ? 'Edit Unit Bisnis' : 'Tambah Unit Bisnis / Cabang'}
            </h2>
            <button onClick={closeForm} className="text-sm" style={{ color: 'var(--text-muted)' }}>✕ Tutup</button>
          </div>
          {msg && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${isErr ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700 font-semibold'}`}>{msg}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Nama Unit / Cabang *</label>
                <input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} required placeholder="contoh: Booth Alun-Alun" className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Alamat (opsional)</label>
                <input value={form.alamat} onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))} placeholder="Jl. Contoh No. 1, Kota" className="input" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Deskripsi (opsional)</label>
              <input value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))} placeholder="Keterangan singkat tentang unit ini" className="input" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={closeForm} className="px-4 py-2 rounded text-sm font-semibold border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Batal</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Menyimpan...' : editId ? '💾 Simpan Perubahan' : '🏪 Tambah Unit Bisnis'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── GRID ───────────────────────────────────────────── */}
      {loading ? (
        <div className="card p-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Memuat...</div>
      ) : list.length === 0 ? (
        <div className="card p-12 text-center" style={{ color: 'var(--text-muted)' }}>
          <div className="text-5xl mb-3">🏪</div>
          <p className="text-sm font-medium">Belum ada unit bisnis</p>
          <p className="text-xs mt-1">Tambahkan cabang atau booth di atas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((u, i) => (
            <div key={u.id} className={`card p-5 border-t-4 ${tipeBorder[i % tipeBorder.length]}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: 'var(--text)' }}>{u.nama}</p>
                  {u.alamat && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{u.alamat}</p>}
                </div>
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold ml-2 flex-shrink-0">Aktif</span>
              </div>
              {u.deskripsi && <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{u.deskripsi}</p>}
              <div className="flex flex-wrap gap-2 mt-4">
                <a href={`/transaksi?unit_bisnis_id=${u.id}`} className="btn-secondary text-xs py-1.5 px-3">Transaksi</a>
                <a href={`/laporan?unit_bisnis_id=${u.id}`} className="btn-secondary text-xs py-1.5 px-3">Laporan</a>
                <button onClick={() => startEdit(u)} className="text-xs px-3 py-1.5 rounded border font-semibold" style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}>Edit</button>
                <button onClick={() => handleDelete(u)} className="text-xs px-3 py-1.5 rounded border font-semibold" style={{ borderColor: 'rgba(220,38,38,0.4)', color: '#dc2626' }}>Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
