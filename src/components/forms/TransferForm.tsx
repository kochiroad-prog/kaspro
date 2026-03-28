'use client'

import { useState } from 'react'
import { prosesTransfer } from '@/lib/actions/index'
import { hariIni, formatRupiah } from '@/lib/utils'
import type { Kas } from '@/types'

export default function TransferForm({ kasList }: { kasList: Kas[] }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const fd = new FormData(e.currentTarget)
    const result = await prosesTransfer({
      dari_kas_id: fd.get('dari_kas_id') as string,
      ke_kas_id: fd.get('ke_kas_id') as string,
      jumlah: parseInt(fd.get('jumlah') as string) || 0,
      catatan: fd.get('catatan') as string,
      tanggal: fd.get('tanggal') as string,
    })
    setIsErr(!!result.error)
    setMsg(result.error ?? 'Transfer berhasil diproses!')
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
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dari Kas</label>
        <select name="dari_kas_id" required className="input">
          <option value="">— Pilih kas asal —</option>
          {kasList.map(k => (
            <option key={k.id} value={k.id}>{k.nama} — {formatRupiah(k.saldo)}</option>
          ))}
        </select>
      </div>
      <div className="text-center text-2xl text-gray-300">↓</div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ke Kas</label>
        <select name="ke_kas_id" required className="input">
          <option value="">— Pilih kas tujuan —</option>
          {kasList.map(k => (
            <option key={k.id} value={k.id}>{k.nama} — {formatRupiah(k.saldo)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jumlah Transfer</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-semibold">Rp</span>
          <input name="jumlah" type="number" min="1" required placeholder="0" className="input pl-10 text-lg font-bold" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal</label>
        <input name="tanggal" type="date" defaultValue={hariIni()} required className="input" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catatan (opsional)</label>
        <input name="catatan" type="text" placeholder="contoh: Tarik tunai ATM" className="input" />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
        {loading ? 'Memproses...' : '🔄 Proses Transfer'}
      </button>
    </form>
  )
}
