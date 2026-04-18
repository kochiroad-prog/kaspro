import { getTransaksi } from '@/lib/actions/transaksi'
import { getKas, getKategori } from '@/lib/actions/index'
import { getUser } from '@/lib/actions/auth'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import AddTxButton from '@/components/forms/AddTxButton'
import ExportPanel from '@/components/transaksi/ExportPanel'
import TransaksiTable from '@/components/transaksi/TransaksiTable'

export const revalidate = 0

export default async function TransaksiPage({
  searchParams,
}: {
  searchParams: Promise<{ tipe?: string; kas_id?: string; kategori_id?: string; dari?: string; sampai?: string }>
}) {
  const sp = await searchParams
  const [txResult, kasResult, katResult, user] = await Promise.all([
    getTransaksi({
      tipe: sp.tipe as any,
      kas_id: sp.kas_id,
      kategori_id: sp.kategori_id,
      dari_tanggal: sp.dari,
      sampai_tanggal: sp.sampai,
      limit: 100,
    }),
    getKas(),
    getKategori(),
    getUser(),
  ])

  const txList = txResult.data ?? []
  const totalMasuk = txList.filter(t => t.tipe === 'pemasukan').reduce((s, t) => s + t.jumlah, 0)
  const totalKeluar = txList.filter(t => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0)

  // Siapkan data untuk export
  const exportData = txList.map(tx => ({
    tanggal: formatTanggal(tx.tanggal),
    kategori: tx.kategori?.nama ?? 'Lainnya',
    keterangan: tx.catatan || '',
    unit: [tx.unit_bisnis?.nama, tx.proyek?.nama].filter(Boolean).join(' / '),
    kas: tx.kas?.nama ?? '—',
    tipe: tx.tipe,
    jumlah: tx.jumlah,
  }))

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transaksi</h1>
          <p className="text-sm text-gray-500 mt-0.5">{txList.length} transaksi ditemukan</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ExportPanel
            data={exportData}
            userName={user?.profile?.nama ?? user?.email ?? 'Pengguna'}
            userEmail={user?.email ?? ''}
          />
          <AddTxButton />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-label">Total Uang Masuk</div>
          <div className="stat-value text-green-600">{formatRupiah(totalMasuk)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Uang Keluar</div>
          <div className="stat-value text-red-600">{formatRupiah(totalKeluar)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Selisih / Keuntungan</div>
          <div className={`stat-value ${totalMasuk - totalKeluar >= 0 ? 'text-[var(--brand)]' : 'text-red-600'}`}>
            {formatRupiah(totalMasuk - totalKeluar)}
          </div>
        </div>
      </div>

      {/* Filter */}
      <form method="GET" className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Tipe</label>
          <select name="tipe" defaultValue={sp.tipe ?? ''} className="input w-36 py-2 text-sm">
            <option value="">Semua</option>
            <option value="pemasukan">Uang Masuk</option>
            <option value="pengeluaran">Uang Keluar</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Kas</label>
          <select name="kas_id" defaultValue={sp.kas_id ?? ''} className="input w-40 py-2 text-sm">
            <option value="">Semua Kas</option>
            {(kasResult.data ?? []).map(k => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Kategori</label>
          <select name="kategori_id" defaultValue={sp.kategori_id ?? ''} className="input w-44 py-2 text-sm">
            <option value="">Semua Kategori</option>
            {(katResult.data ?? []).map(k => (
              <option key={k.id} value={k.id}>{k.ikon} {k.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Dari</label>
          <input type="date" name="dari" defaultValue={sp.dari ?? ''} className="input w-36 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Sampai</label>
          <input type="date" name="sampai" defaultValue={sp.sampai ?? ''} className="input w-36 py-2 text-sm" />
        </div>
        <button type="submit" className="btn-primary py-2 text-sm">Filter</button>
        <a href="/transaksi" className="btn-secondary py-2 text-sm">Reset</a>
      </form>

      {/* Table */}
      <TransaksiTable txList={txList} />
    </div>
  )
}
