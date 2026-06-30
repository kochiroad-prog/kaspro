'use client'

import { useState } from 'react'
import { formatRupiah, formatTanggal, formatJam } from '@/lib/utils'
import type { Transaksi } from '@/types'
import EditTxModal from './EditTxModal'

interface Props {
  txList: Transaksi[]
}

export default function TransaksiTable({ txList }: Props) {
  const [editTx, setEditTx] = useState<Transaksi | null>(null)

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
              {txList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-sm">Tidak ada transaksi ditemukan</p>
                  </td>
                </tr>
              ) : (
                txList.map(tx => (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => setEditTx(tx)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm text-gray-500">{formatTanggal(tx.tanggal)}</p>
                      {formatJam(tx.waktu, tx.created_at) && (
                        <p className="text-xs text-gray-400 mt-0.5">🕐 {formatJam(tx.waktu, tx.created_at)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{tx.kategori?.ikon ?? '📦'}</span>
                        <span className="text-sm font-semibold text-gray-800">{tx.kategori?.nama ?? 'Lainnya'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {tx.catatan || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {tx.unit_bisnis && (
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                            {tx.unit_bisnis.nama}
                          </span>
                        )}
                        {tx.proyek && (
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                            {tx.proyek.nama}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-[var(--brand-light)] text-[var(--brand)] px-2 py-0.5 rounded-full font-semibold">
                        {tx.kas?.nama ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-bold ${tx.tipe === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.tipe === 'pemasukan' ? '+' : '-'} {formatRupiah(tx.jumlah)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-300 group-hover:text-gray-500 transition-colors text-base">⚙</span>
                    </td>
                  </tr>
                ))
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
