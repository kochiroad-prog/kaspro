'use client'

import { useState } from 'react'
import { tambahUnitBisnis } from '@/lib/actions/index'

export default function UnitBisnisForm() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const fd = new FormData(e.currentTarget)
    const result = await tambahUnitBisnis({
      nama: fd.get('nama') as string,
      alamat: fd.get('alamat') as string,
      deskripsi: fd.get('deskripsi') as string,
    })
    setIsErr(!!result.error)
    setMsg(result.error ?? 'Unit bisnis berhasil ditambahkan!')
    setLoading(false)
    if (!result.error) (e.target as HTMLFormElement).reset()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {msg && (
        <div className={`p-3 rounded-lg text-sm ${isErr ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700 font-semibold'}`}>
          {msg}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Unit / Cabang</label>
          <input name="nama" required placeholder="contoh: Booth Alun-Alun" className="input" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat (opsional)</label>
          <input name="alamat" placeholder="Jl. Contoh No. 1, Kota" className="input" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi (opsional)</label>
        <input name="deskripsi" placeholder="Keterangan singkat tentang unit ini" className="input" />
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Menyimpan...' : '🏪 Tambah Unit Bisnis'}
      </button>
    </form>
  )
}
