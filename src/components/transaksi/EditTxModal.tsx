'use client'

import { useState, useEffect } from 'react'
import { updateTransaksi, hapusTransaksi } from '@/lib/actions/transaksi'
import { getKas, getKategori, getUnitBisnis, getProyek } from '@/lib/actions/index'
import type { Transaksi, Kas, Kategori, UnitBisnis, Proyek } from '@/types'

interface Props {
  tx: Transaksi
  onClose: () => void
}

const TIPE_CONFIG = {
  pemasukan: {
    label: 'Pemasukan',
    headerBg: 'bg-green-600',
    headerText: 'text-white',
    cardBorder: 'border-green-200',
    cardBg: 'bg-green-50',
  },
  pengeluaran: {
    label: 'Pengeluaran',
    headerBg: 'bg-red-800',
    headerText: 'text-white',
    cardBorder: 'border-red-200',
    cardBg: 'bg-red-50',
  },
}

function formatNominal(val: string): string {
  const digits = val.replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits).toLocaleString('id-ID')
}

export default function EditTxModal({ tx, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [konfirmHapus, setKonfirmHapus] = useState(false)

  const [nominalDisplay, setNominalDisplay] = useState(
    tx.jumlah ? tx.jumlah.toLocaleString('id-ID') : ''
  )

  const [kasList, setKasList] = useState<Kas[]>([])
  const [katList, setKatList] = useState<Kategori[]>([])
  const [unitList, setUnitList] = useState<UnitBisnis[]>([])
  const [proyekList, setProyekList] = useState<Proyek[]>([])

  const cfg = TIPE_CONFIG[tx.tipe]

  useEffect(() => {
    Promise.all([getKas(), getKategori(), getUnitBisnis(), getProyek()]).then(
      ([k, kat, u, p]) => {
        setKasList(k.data ?? [])
        setKatList((kat.data ?? []).filter((c: Kategori) => c.tipe === tx.tipe))
        setUnitList(u.data ?? [])
        setProyekList(p.data ?? [])
      }
    )
  }, [tx.tipe])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const result = await updateTransaksi(tx.id, {
      kas_id: fd.get('kas_id') as string,
      kategori_id: fd.get('kategori_id') as string,
      unit_bisnis_id: (fd.get('unit_bisnis_id') as string) || undefined,
      proyek_id: (fd.get('proyek_id') as string) || undefined,
      jumlah: parseInt((fd.get('jumlah') as string).replace(/\D/g, '')) || 0,
      catatan: fd.get('catatan') as string,
      tanggal: fd.get('tanggal') as string,
    })
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Transaksi berhasil diperbarui!')
      setTimeout(() => onClose(), 1000)
    }
  }

  async function handleHapus() {
    setDeleting(true)
    const result = await hapusTransaksi(tx.id)
    setDeleting(false)
    if (result.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border-2 ${cfg.cardBorder}`}>
        {/* Colored Header */}
        <div className={`${cfg.headerBg} ${cfg.headerText} px-5 py-4 rounded-t-2xl flex items-center justify-between`}>
          <div>
            <div className="text-xs font-semibold opacity-80 uppercase tracking-wide">Edit Transaksi</div>
            <div className="font-bold text-lg">{cfg.label}</div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        <div className={`${cfg.cardBg} p-5`}>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-semibold">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipe (display only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipe</label>
              <div className={`input bg-white font-semibold ${tx.tipe === 'pemasukan' ? 'text-green-700' : 'text-red-700'}`}>
                {cfg.label}
              </div>
            </div>

            {/* Tanggal */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal</label>
              <input
                name="tanggal"
                type="date"
                defaultValue={tx.tanggal}
                required
                className="input bg-white"
              />
            </div>

            {/* Nominal */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nominal</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">Rp</span>
                <input
                  name="jumlah"
                  type="text"
                  required
                  inputMode="numeric"
                  value={nominalDisplay}
                  onChange={e => setNominalDisplay(formatNominal(e.target.value))}
                  placeholder="0"
                  className="input pl-10 text-xl font-bold bg-white"
                />
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
              <select name="kategori_id" defaultValue={tx.kategori_id ?? ''} className="input bg-white">
                {katList.map(k => (
                  <option key={k.id} value={k.id}>{k.ikon} {k.nama}</option>
                ))}
              </select>
            </div>

            {/* Kas */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kas</label>
              <select name="kas_id" defaultValue={tx.kas_id} required className="input bg-white">
                {kasList.map(k => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            </div>

            {/* Unit Bisnis */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unit Bisnis</label>
              <select name="unit_bisnis_id" defaultValue={tx.unit_bisnis_id ?? ''} className="input bg-white">
                <option value="">— Pilih unit —</option>
                {unitList.map(u => (
                  <option key={u.id} value={u.id}>{u.nama}</option>
                ))}
              </select>
            </div>

            {/* Proyek */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Proyek (opsional)</label>
              <select name="proyek_id" defaultValue={tx.proyek_id ?? ''} className="input bg-white">
                <option value="">— Tidak ada proyek —</option>
                {proyekList.map(p => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </div>

            {/* Deskripsi / Catatan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi</label>
              <textarea
                name="catatan"
                defaultValue={tx.catatan || ''}
                placeholder="Keterangan transaksi..."
                rows={2}
                className="input bg-white resize-none"
              />
            </div>

            {/* Tombol */}
            <div className="flex gap-2 pt-1">
              {!konfirmHapus ? (
                <button
                  type="button"
                  onClick={() => setKonfirmHapus(true)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                >
                  Hapus
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleHapus}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  {deleting ? 'Menghapus...' : 'Yakin Hapus?'}
                </button>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--brand)] hover:opacity-90 transition-colors"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
