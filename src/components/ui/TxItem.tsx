import { formatRupiah, formatRelative, formatJam } from '@/lib/utils'
import type { Transaksi } from '@/types'

export default function TxItem({ tx }: { tx: Transaksi }) {
  const isInc = tx.tipe === 'pemasukan'
  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${isInc ? 'bg-green-50' : 'bg-red-50'}`}>
        {tx.kategori?.ikon ?? (isInc ? '💰' : '💸')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {tx.kategori?.nama ?? 'Tanpa Kategori'}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="text-xs text-gray-400 truncate">{tx.catatan || '—'}</p>
          {tx.kas && (
            <span className="text-[10px] bg-[var(--brand-light)] text-[var(--brand)] px-1.5 py-0.5 rounded-full font-semibold">
              {tx.kas.nama}
            </span>
          )}
          {tx.unit_bisnis && (
            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-semibold">
              {tx.unit_bisnis.nama}
            </span>
          )}
          {tx.proyek && (
            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
              {tx.proyek.nama}
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${isInc ? 'text-green-600' : 'text-red-600'}`}>
          {isInc ? '+' : '-'} {formatRupiah(tx.jumlah)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatRelative(tx.tanggal)}
          {formatJam(tx.waktu, tx.created_at) && (
            <span className="ml-1">· {formatJam(tx.waktu, tx.created_at)}</span>
          )}
        </p>
      </div>
    </div>
  )
}
