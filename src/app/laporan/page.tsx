import { getLaporanBulanan, getLaporanKategori, getLaporanUnitBisnis } from '@/lib/actions/index'
import { formatRupiah, awalBulan, akhirBulan } from '@/lib/utils'
import MonthlyChart from '@/components/charts/MonthlyChart'
import PieChart from '@/components/charts/PieChart'

export const revalidate = 0

export default async function LaporanPage() {
  const tahun = new Date().getFullYear()
  const dari = awalBulan()
  const sampai = akhirBulan()

  const [bulananResult, kategoriResult, unitResult] = await Promise.all([
    getLaporanBulanan(tahun),
    getLaporanKategori(dari, sampai),
    getLaporanUnitBisnis(dari, sampai),
  ])

  const bulan = bulananResult.data ?? []
  const bulanIni = bulan[new Date().getMonth()]

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Laporan Keuangan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Analisis keuangan usaha Anda</p>
        </div>
        <button className="btn-secondary text-sm">⬇️ Export PDF</button>
      </div>

      {/* Stat Bulan Ini */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-label">Uang Masuk (Bulan Ini)</div>
          <div className="stat-value text-green-600">{formatRupiah(bulanIni?.pemasukan ?? 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Uang Keluar (Bulan Ini)</div>
          <div className="stat-value text-red-600">{formatRupiah(bulanIni?.pengeluaran ?? 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Keuntungan Bersih</div>
          <div className={`stat-value ${(bulanIni?.keuntungan ?? 0) >= 0 ? 'text-[var(--brand)]' : 'text-red-600'}`}>
            {formatRupiah(bulanIni?.keuntungan ?? 0)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Margin Keuntungan</div>
          <div className="stat-value text-[var(--brand)]">
            {bulanIni?.pemasukan ? Math.round((bulanIni.keuntungan / bulanIni.pemasukan) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5">
          <div className="section-header">
            <h3 className="section-title">Tren Bulanan {tahun}</h3>
          </div>
          <MonthlyChart data={bulan} />
        </div>
        <div className="card p-5">
          <div className="section-header">
            <h3 className="section-title">Pengeluaran per Kategori</h3>
          </div>
          <PieChart data={kategoriResult.data ?? []} />
        </div>
      </div>

      {/* Laporan Unit Bisnis */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="section-title">Ringkasan per Unit Bisnis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Unit Bisnis</th>
                <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">Uang Masuk</th>
                <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">Uang Keluar</th>
                <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">Keuntungan</th>
                <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(unitResult.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                    Belum ada data unit bisnis
                  </td>
                </tr>
              ) : (
                (unitResult.data ?? []).map(u => (
                  <tr key={u.unit_bisnis_id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">{u.nama}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-green-600">{formatRupiah(u.pemasukan)}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-red-600">{formatRupiah(u.pengeluaran)}</td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-[var(--brand)]">{formatRupiah(u.keuntungan)}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.margin >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {u.margin}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
