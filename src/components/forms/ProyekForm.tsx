'use client'

import { useState } from 'react'
import { tambahProyek } from '@/lib/actions/index'
import { hariIni } from '@/lib/utils'

export default function ProyekForm() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const fd = new FormData(e.currentTarget)
    const result = await tambahProyek({
      nama: fd.get('nama') as string,
      nama_client: fd.get('nama_client') as string,
      deskripsi: fd.get('deskripsi') as string,
      tgl_mulai: fd.get('tgl_mulai') as string || undefined,
      tgl_selesai: fd.get('tgl_selesai') as string || undefined,
    })
    setIsErr(!!result.error)
    setMsg(result.error ?? 'Proyek berhasil dibuat!')
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
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Proyek</label>
          <input name="nama" required placeholder="contoh: Catering Acara Kantor" className="input" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Klien (opsional)</label>
          <input name="nama_client" placeholder="contoh: PT Maju Bersama" className="input" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal Mulai</label>
          <input name="tgl_mulai" type="date" defaultValue={hariIni()} className="input" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal Selesai</label>
          <input name="tgl_selesai" type="date" className="input" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi (opsional)</label>
        <input name="deskripsi" placeholder="Keterangan singkat tentang proyek ini" className="input" />
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Menyimpan...' : '📁 Buat Proyek'}
      </button>
    </form>
  )
}
