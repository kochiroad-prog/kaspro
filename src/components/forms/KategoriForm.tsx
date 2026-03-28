'use client'

import { useState } from 'react'
import { tambahKategori } from '@/lib/actions/index'

const IKONS = ['🛒','🔧','💵','💰','🧺','👤','🏠','⚡','⚙️','🚗','📢','📦','🍕','☕','🎁','💊','📱','🏦','✈️','🎓']

export default function KategoriForm() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)
  const [ikon, setIkon] = useState('📦')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await tambahKategori({
      nama: fd.get('nama') as string,
      tipe: fd.get('tipe') as any,
      ikon,
    })
    setIsErr(!!result.error)
    setMsg(result.error ?? 'Kategori berhasil ditambahkan!')
    setLoading(false)
    if (!result.error) { (e.target as HTMLFormElement).reset(); setIkon('📦') }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {msg && (
        <div className={`p-3 rounded-lg text-sm ${isErr ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700 font-semibold'}`}>{msg}</div>
      )}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pilih Ikon</label>
        <div className="flex flex-wrap gap-2">
          {IKONS.map(i => (
            <button
              key={i} type="button" onClick={() => setIkon(i)}
              className={`w-9 h-9 rounded-lg text-lg hover:scale-110 transition-transform ${ikon === i ? 'bg-[var(--brand-light)] ring-2 ring-[var(--brand)]' : 'bg-gray-50'}`}
            >{i}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Kategori</label>
          <input name="nama" required placeholder="contoh: Penjualan Online" className="input" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipe</label>
          <select name="tipe" className="input">
            <option value="pemasukan">Uang Masuk</option>
            <option value="pengeluaran">Uang Keluar</option>
          </select>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Menyimpan...' : '+ Simpan Kategori'}
      </button>
    </form>
  )
}
