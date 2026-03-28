'use client'

import { useState } from 'react'
import { tambahKas } from '@/lib/actions/index'

export default function KasForm() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const fd = new FormData(e.currentTarget)
    const result = await tambahKas({
      nama: fd.get('nama') as string,
      tipe: fd.get('tipe') as any,
      saldo_awal: parseInt(fd.get('saldo_awal') as string) || 0,
    })
    setIsErr(!!result.error)
    setMsg(result.error ?? 'Kas berhasil ditambahkan!')
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Kas</label>
          <input name="nama" required placeholder="contoh: Bank BRI, GoPay..." className="input" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipe</label>
          <select name="tipe" className="input">
            <option value="tunai">💵 Kas Tunai</option>
            <option value="bank">🏦 Rekening Bank</option>
            <option value="ewallet">📱 E-Wallet</option>
            <option value="lainnya">💼 Lainnya</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Saldo Awal</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-semibold">Rp</span>
            <input name="saldo_awal" type="number" min="0" placeholder="0" className="input pl-10" />
          </div>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Menyimpan...' : '+ Simpan Kas'}
      </button>
    </form>
  )
}
