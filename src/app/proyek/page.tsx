'use client'

import { useState, useEffect } from 'react'
import { getProyek, tambahProyek, updateProyek, hapusProyek } from '@/lib/actions/index'
import { hariIni, formatTanggal } from '@/lib/utils'
import type { Proyek } from '@/types'

type StatusProyek = 'aktif' | 'selesai' | 'dibatalkan'

const statusConfig: Record<StatusProyek, { label: string; bg: string; text: string }> = {
  aktif:      { label: 'Aktif',      bg: 'bg-green-50',  text: 'text-green-700' },
  selesai:    { label: 'Selesai',    bg: 'bg-blue-50',   text: 'text-blue-700'  },
  dibatalkan: { label: 'Dibatalkan', bg: 'bg-gray-100',  text: 'text-gray-500'  },
}

const emptyForm = { nama: '', nama_client: '', deskripsi: '', tgl_mulai: hariIni(), tgl_selesai: '', status: 'aktif' as StatusProyek }

export default function ProyekPage() {
  const [list, setList]         = useState<Proyek[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [form, setForm]         = useState({ ...emptyForm })
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')
  const [isErr, setIsErr]       = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await getProyek()
    setList((data as Proyek[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startAdd() {
    setEditId(null)
    setForm({ ...emptyForm })
    setMsg('')
    setShowForm(true)
  }

  function startEdit(p: Proyek) {
    setEditId(p.id)
    setForm({
      nama: p.nama,
      nama_client: p.nama_client ?? '',
      deskripsi: p.deskripsi ?? '',
      tgl_mulai: p.tgl_mulai ?? '',
      tgl_selesai: p.tgl_selesai ?? '',
      status: p.status as StatusProyek,
    })
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
      nama_client: form.nama_client || undefined,
      deskripsi: form.deskripsi || undefined,
      tgl_mulai: form.tgl_mulai || undefined,
      tgl_selesai: form.tgl_selesai || undefined,
      status: form.status,
    }
    const result = editId
      ? await updateProyek(editId, payload)
      : await tambahProyek(payload)

    setIsErr(!!result.error)
    if (result.error) {
      setMsg(result.error)
    } else {
      setMsg(editId ? 'Proyek berhasil diperbarui!' : 'Proyek berhasil dibuat!')
      await load()
      if (!editId) setForm({ ...emptyForm })
      else closeForm()
    }
    setSaving(false)
  }

  async function handleDelete(p: Proyek) {
    if (!confirm(`Hapus proyek "${p.nama}"? Transaksi terkait tidak ikut terhapus.`)) return
    const result = await hapusProyek(p.id)
    if (result.error) { alert(result.error); return }
    await load()
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Proyek</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Lacak keuangan per proyek atau klien</p>
        </div>
        {!showForm && (
          <button onClick={startAdd} className="btn-primary text-sm px-4 py-2">
            + Buat Proyek
          </button>
        )}
      </div>

      {/* ── FORM TAMBAH / EDIT ─────────────────────────────── */}
      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
              {editId ? 'Edit Proyek' : 'Buat Proyek Baru'}
            </h2>
            <button onClick={closeForm} className="text-sm" style={{ color: 'var(--text-muted)' }}>✕ Tutup</button>
          </div>
          {msg && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${isErr ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700 font-semibold'}`}>{msg}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Nama Proyek *</label>
                <input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} required placeholder="contoh: Catering Acara Kantor" className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Nama Klien (opsional)</label>
                <input value={form.nama_client} onChange={e => setForm(f => ({ ...f, nama_client: e.target.value }))} placeholder="contoh: PT Maju Bersama" className="input" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Tanggal Mulai</label>
                <input type="date" value={form.tgl_mulai} onChange={e => setForm(f => ({ ...f, tgl_mulai: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Tanggal Selesai</label>
                <input type="date" value={form.tgl_selesai} onChange={e => setForm(f => ({ ...f, tgl_selesai: e.target.value }))} className="input" />
              </div>
              {editId && (
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as StatusProyek }))} className="input">
                    <option value="aktif">Aktif</option>
                    <option value="selesai">Selesai</option>
                    <option value="dibatalkan">Dibatalkan</option>
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Deskripsi (opsional)</label>
              <input value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))} placeholder="Keterangan singkat tentang proyek ini" className="input" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={closeForm} className="px-4 py-2 rounded text-sm font-semibold border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Batal</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Menyimpan...' : editId ? '💾 Simpan Perubahan' : '📁 Buat Proyek'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── LIST ───────────────────────────────────────────── */}
      {loading ? (
        <div className="card p-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Memuat...</div>
      ) : list.length === 0 ? (
        <div className="card p-12 text-center" style={{ color: 'var(--text-muted)' }}>
          <div className="text-5xl mb-3">📁</div>
          <p className="text-sm font-medium">Belum ada proyek</p>
          <p className="text-xs mt-1">Tambahkan proyek untuk melacak keuangan per klien</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {list.map(p => {
              const sc = statusConfig[p.status as StatusProyek] ?? statusConfig.aktif
              return (
                <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl flex-shrink-0">📁</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{p.nama}</p>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {p.nama_client && <span className="mr-2">👤 {p.nama_client}</span>}
                      {p.tgl_mulai && <span>📅 {formatTanggal(p.tgl_mulai)}</span>}
                      {p.tgl_selesai && <span> – {formatTanggal(p.tgl_selesai)}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <a href={`/transaksi?proyek_id=${p.id}`} className="btn-secondary text-xs py-1.5 px-3">Transaksi</a>
                    <button onClick={() => startEdit(p)} className="text-xs px-3 py-1.5 rounded border font-semibold" style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}>Edit</button>
                    <button onClick={() => handleDelete(p)} className="text-xs px-3 py-1.5 rounded border font-semibold" style={{ borderColor: 'rgba(220,38,38,0.4)', color: '#dc2626' }}>Hapus</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
