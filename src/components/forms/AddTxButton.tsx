'use client'

import { useState, useEffect } from 'react'
import { tambahTransaksi } from '@/lib/actions/transaksi'
import { getKas, getKategori, getUnitBisnis, getProyek } from '@/lib/actions/index'
import { hariIni } from '@/lib/utils'
import type { Kas, Kategori, UnitBisnis, Proyek, TipeTransaksi } from '@/types'

export default function AddTxButton() {
  const [open, setOpen] = useState(false)
  const [tipe, setTipe] = useState<TipeTransaksi>('pemasukan')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [kasList, setKasList] = useState<Kas[]>([])
  const [katList, setKatList] = useState<Kategori[]>([])
  const [unitList, setUnitList] = useState<UnitBisnis[]>([])
  const [proyekList, setProyekList] = useState<Proyek[]>([])

  useEffect(() => {
    if (open) {
      Promise.all([getKas(), getKategori(), getUnitBisnis(), getProyek()]).then(
        ([k, kat, u, p]) => {
          setKasList(k.data ?? [])
          setKatList((kat.data ?? []).filter((c: Kategori) => c.tipe === tipe))
          setUnitList(u.data ?? [])
          setProyekList(p.data ?? [])
        }
      )
    }
  }, [open, tipe])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const result = await tambahTransaksi({
      tipe,
      kas_id: fd.get('kas_id') as string,
      kategori_id: fd.get('kategori_id') as string,
      unit_bisnis_id: fd.get('unit_bisnis_id') as string || undefined,
      proyek_id: fd.get('proyek_id') as string || undefined,
      jumlah: parseInt((fd.get('jumlah') as string).replace(/\D/g, '')) || 0,
      catatan: fd.get('catatan') as string,
      tanggal: fd.get('tanggal') as string,
    })
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess('Transaksi berhasil disimpan!')
      setTimeout(() => { setOpen(false); setSuccess('') }, 1200)
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary"
      >
        <span className="text-lg leading-none">+</span>
        Tambah Transaksi
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold">Tambah Transaksi</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <div className="p-5">
              {/* Tipe Toggle */}
              <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-5">
                <button
                  type="button"
                  onClick={() => setTipe('pemasukan')}
                  className={`flex-1 py-3 text-sm font-bold transition-all ${tipe === 'pemasukan' ? 'bg-green-50 text-green-700' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  💰 Uang Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setTipe('pengeluaran')}
                  className={`flex-1 py-3 text-sm font-bold transition-all ${tipe === 'pengeluaran' ? 'bg-red-50 text-red-600' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  💸 Uang Keluar
                </button>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}
              {success && <div className="mb-4 p-3 bg-green-50 rounded-lg text-sm text-green-700 font-semibold">{success}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Jumlah */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jumlah</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">Rp</span>
                    <input
                      name="jumlah"
                      type="number"
                      required
                      min="1"
                      placeholder="0"
                      className="input pl-10 text-xl font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Kategori */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
                    <select name="kategori_id" required className="input">
                      {katList.map(k => <option key={k.id} value={k.id}>{k.ikon} {k.nama}</option>)}
                    </select>
                  </div>
                  {/* Kas */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pilih Kas</label>
                    <select name="kas_id" required className="input">
                      {kasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Tanggal */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal</label>
                    <input name="tanggal" type="date" defaultValue={hariIni()} required className="input" />
                  </div>
                  {/* Unit Bisnis */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unit Bisnis</label>
                    <select name="unit_bisnis_id" className="input">
                      <option value="">— Pilih unit —</option>
                      {unitList.map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}
                    </select>
                  </div>
                </div>

                {/* Proyek */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Proyek (opsional)</label>
                  <select name="proyek_id" className="input">
                    <option value="">— Tidak ada proyek —</option>
                    {proyekList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>

                {/* Catatan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catatan</label>
                  <input name="catatan" type="text" placeholder="Keterangan transaksi..." className="input" />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
                  {loading ? 'Menyimpan...' : '✓ Simpan Transaksi'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
