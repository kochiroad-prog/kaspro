'use client'

import { useState, useEffect } from 'react'
import {
  getSupplier,
  tambahSupplier,
  updateSupplier,
  hapusSupplier,
  type Supplier,
  type SupplierInput,
} from '@/lib/actions/supplier'
import { JENIS_SUPPLIER } from '@/lib/constants/supplier'

export default function SupplierPage() {
  const [daftar, setDaftar] = useState<Supplier[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)
  const [search, setSearch] = useState('')

  // Form state
  const [jenis, setJenis] = useState('')
  const [jenisLainnya, setJenisLainnya] = useState('')
  const [nama, setNama] = useState('')
  const [alamat, setAlamat] = useState('')
  const [no_tlp, setNoTlp] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await getSupplier()
      setDaftar((res.data as Supplier[]) ?? [])
    } catch (e) {
      console.error('Gagal memuat supplier:', e)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setJenis(''); setJenisLainnya(''); setNama(''); setAlamat(''); setNoTlp(''); setEmail('')
    setEditingId(null); setShowForm(false); setMsg('')
  }

  function startEdit(s: Supplier) {
    setEditingId(s.id)
    // Jika jenis tersimpan tidak ada di daftar standar, berarti custom → pilih Lainnya
    const isStandard = JENIS_SUPPLIER.includes(s.jenis as typeof JENIS_SUPPLIER[number])
    setJenis(isStandard ? s.jenis : 'Lainnya')
    setJenisLainnya(isStandard ? '' : s.jenis)
    setNama(s.nama); setAlamat(s.alamat)
    setNoTlp(s.no_tlp); setEmail(s.email)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Nilai jenis final: jika pilih Lainnya, pakai input manual
    const jenisFinal = jenis === 'Lainnya' ? jenisLainnya.trim() : jenis
    if (!jenisFinal) { setMsg('Jenis supplier wajib diisi'); setIsErr(true); return }

    setLoading(true); setMsg('')
    const input: SupplierInput = { jenis: jenisFinal, nama, alamat, no_tlp, email }
    const result = editingId
      ? await updateSupplier(editingId, input)
      : await tambahSupplier(input)

    setIsErr(!!result.error)
    if (result.error) {
      setMsg(result.error)
    } else {
      setMsg(editingId ? 'Supplier berhasil diperbarui!' : 'Supplier berhasil ditambahkan!')
      await load()
      resetForm()
    }
    setLoading(false)
  }

  async function handleDelete(id: string, namaSupplier: string) {
    if (!confirm(`Hapus supplier "${namaSupplier}"?`)) return
    const result = await hapusSupplier(id)
    if (result.error) { alert(result.error); return }
    setDaftar(prev => prev.filter(s => s.id !== id))
  }

  const filtered = daftar.filter(s =>
    s.nama.toLowerCase().includes(search.toLowerCase()) ||
    s.jenis.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏭</span>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Supplier</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Peralatan · Kelola daftar pemasok/vendor</p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded text-sm font-semibold text-white"
            style={{ background: 'var(--brand)' }}
          >
            + Tambah Supplier
          </button>
        )}
      </div>

      {/* Notif */}
      {msg && !showForm && (
        <div className={`p-3 rounded-lg text-sm ${isErr ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {msg}
        </div>
      )}

      {/* ── FORM ──────────────────────────────────────────── */}
      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
              {editingId ? 'Edit Supplier' : 'Tambah Supplier Baru'}
            </h2>
            <button onClick={resetForm} className="text-sm" style={{ color: 'var(--text-muted)' }}>✕ Tutup</button>
          </div>

          {msg && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${isErr ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Jenis Supplier *</label>
                <select
                  value={jenis} onChange={e => { setJenis(e.target.value); setJenisLainnya('') }} required
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                >
                  <option value="">-- Pilih Jenis --</option>
                  {JENIS_SUPPLIER.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
                {jenis === 'Lainnya' && (
                  <input
                    value={jenisLainnya}
                    onChange={e => setJenisLainnya(e.target.value)}
                    placeholder="Tulis jenis supplier..."
                    required
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none mt-2"
                    style={{ borderColor: 'var(--brand)', background: 'var(--card-bg)', color: 'var(--text)' }}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Nama Supplier *</label>
                <input
                  value={nama} onChange={e => setNama(e.target.value)} required
                  placeholder="Nama perusahaan/individu"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Alamat</label>
              <textarea
                value={alamat} onChange={e => setAlamat(e.target.value)}
                rows={2} placeholder="Alamat lengkap supplier"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none resize-none"
                style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>No. Telepon</label>
                <input
                  type="tel" value={no_tlp} onChange={e => setNoTlp(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="supplier@email.com"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button" onClick={resetForm}
                className="px-4 py-2 rounded text-sm font-semibold border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                Batal
              </button>
              <button
                type="submit" disabled={loading}
                className="px-5 py-2 rounded text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--brand)' }}
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── LIST ──────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            Daftar Supplier ({filtered.length})
          </h2>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama / jenis..."
            className="border rounded px-3 py-1.5 text-sm w-48 focus:outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
          />
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Memuat data supplier...</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-4xl mb-2">🏭</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {search ? 'Tidak ada supplier yang cocok' : 'Belum ada supplier. Klik "+ Tambah Supplier" untuk memulai.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th className="pb-2 pr-4 font-semibold">Nama</th>
                  <th className="pb-2 pr-4 font-semibold">Jenis</th>
                  <th className="pb-2 pr-4 font-semibold">No. Telp</th>
                  <th className="pb-2 pr-4 font-semibold">Email</th>
                  <th className="pb-2 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td className="py-3 pr-4">
                      <p className="font-semibold" style={{ color: 'var(--text)' }}>{s.nama}</p>
                      {s.alamat && <p className="text-xs mt-0.5 truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>{s.alamat}</p>}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--nav-active-bg)', color: 'var(--brand)' }}>
                        {s.jenis}
                      </span>
                    </td>
                    <td className="py-3 pr-4" style={{ color: 'var(--text-muted)' }}>{s.no_tlp || '—'}</td>
                    <td className="py-3 pr-4" style={{ color: 'var(--text-muted)' }}>{s.email || '—'}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(s)}
                          className="text-xs px-3 py-1 rounded border font-semibold"
                          style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}
                        >Edit</button>
                        <button
                          onClick={() => handleDelete(s.id, s.nama)}
                          className="text-xs px-3 py-1 rounded border font-semibold"
                          style={{ borderColor: 'rgba(220,38,38,0.4)', color: '#dc2626' }}
                        >Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
