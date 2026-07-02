'use client'

import { useState } from 'react'
import { formatRupiah, formatTanggal, formatJam } from '@/lib/utils'
import type { Transaksi, Transfer } from '@/types'
import EditTxModal from './EditTxModal'

interface Props {
  txList: Transaksi[]
  transferList?: Transfer[]
  /** Kas yang sedang difilter (dipakai utk tahu arah transfer masuk/keluar & tampilkan Saldo Awal) */
  kasIdFilter?: string
  /** Saldo awal kas (all-time), sebelum transaksi/transfer pertama yg tercatat di tabel */
  saldoAwal?: number
}

// Baris gabungan utk ditampilkan: transaksi biasa ATAU transfer (read-only, tidak bisa diedit di sini)
type BarisTransfer = {
  kind: 'transfer'
  id: string
  tanggal: string
  created_at: string
  arah: 'masuk' | 'keluar'
  kasLawan: string
  jumlah: number
  catatan: string
}

export default function TransaksiTable({ txList, transferList = [], kasIdFilter, saldoAwal }: Props) {
  const [editTx, setEditTx] = useState<Transaksi | null>(null)

  const barisTransfer: BarisTransfer[] = kasIdFilter
    ? transferList.map(tr => {
        const arah: 'masuk' | 'keluar' = tr.ke_kas_id === kasIdFilter ? 'masuk' : 'keluar'
        const kasLawan = arah === 'masuk' ? (tr.dari_kas?.nama ?? '—') : (tr.ke_kas?.nama ?? '—')
        return {
          kind: 'transfer',
          id: tr.id,
          tanggal: tr.tanggal,
          created_at: tr.created_at,
          arah,
          kasLawan,
          jumlah: tr.jumlah,
          catatan: tr.catatan,
        }
      })
    : []

  // Gabung & urutkan (terbaru di atas), sama seperti urutan default query transaksi
  const gabungan: (({ kind: 'transaksi' } & Transaksi) | BarisTransfer)[] = [
    ...txList.map(tx => ({ kind: 'transaksi' as const, ...tx })),
    ...barisTransfer,
  ].sort((a, b) => {
    if (a.tanggal !== b.tanggal) return a.tanggal < b.tanggal ? 1 : -1
    return a.created_at < b.created_at ? 1 : -1
  })

  const totalBaris = gabungan.length + (saldoAwal !== undefined ? 1 : 0)

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Kategori</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Keterangan</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Unit / Proyek</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Kas</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">Jumlah</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {totalBaris === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-sm">Tidak ada transaksi ditemukan</p>
                  </td>
                </tr>
              ) : (
                <>
                  {gabungan.map(row =>
                    row.kind === 'transaksi' ? (
                      <tr
                        key={`tx-${row.id}`}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => setEditTx(row)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm text-gray-500">{formatTanggal(row.tanggal)}</p>
                          {formatJam(row.waktu, row.created_at) && (
                            <p className="text-xs text-gray-400 mt-0.5">🕐 {formatJam(row.waktu, row.created_at)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>{row.kategori?.ikon ?? '📦'}</span>
                            <span className="text-sm font-semibold text-gray-800">{row.kategori?.nama ?? 'Lainnya'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                          {row.catatan || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {row.unit_bisnis && (
                              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                                {row.unit_bisnis.nama}
                              </span>
                            )}
                            {row.proyek && (
                              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                                {row.proyek.nama}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-[var(--brand-light)] text-[var(--brand)] px-2 py-0.5 rounded-full font-semibold">
                            {row.kas?.nama ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-bold ${row.tipe === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                            {row.tipe === 'pemasukan' ? '+' : '-'} {formatRupiah(row.jumlah)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-gray-300 group-hover:text-gray-500 transition-colors text-base">⚙</span>
                        </td>
                      </tr>
                    ) : (
                      <tr key={`tr-${row.id}`} className="bg-blue-50/40">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm text-gray-500">{formatTanggal(row.tanggal)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>🔄</span>
                            <span className="text-sm font-semibold text-blue-700">Transfer</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                          {row.arah === 'masuk' ? `Dari ${row.kasLawan}` : `Ke ${row.kasLawan}`}
                          {row.catatan ? ` — ${row.catatan}` : ''}
                        </td>
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                            Transfer antar kas
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-bold ${row.arah === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>
                            {row.arah === 'masuk' ? '+' : '-'} {formatRupiah(row.jumlah)}
                          </span>
                        </td>
                        <td className="px-4 py-3" />
                      </tr>
                    )
                  )}
                  {saldoAwal !== undefined && (
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-600">
                        Saldo Awal Kas <span className="font-normal text-gray-400">(sebelum transaksi &amp; transfer di atas)</span>
                      </td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-700">{formatRupiah(saldoAwal)}</td>
                      <td className="px-4 py-3" />
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editTx && (
        <EditTxModal
          tx={editTx}
          onClose={() => setEditTx(null)}
        />
      )}
    </>
  )
}
