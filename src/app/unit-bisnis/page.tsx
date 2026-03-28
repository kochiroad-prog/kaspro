import { getUnitBisnis, tambahUnitBisnis } from '@/lib/actions/index'
import { formatRupiah } from '@/lib/utils'
import UnitBisnisForm from '@/components/forms/UnitBisnisForm'

export const revalidate = 0

export default async function UnitBisnisPage() {
  const { data: unitList } = await getUnitBisnis()

  const tipeBorder = ['border-t-[var(--brand)]', 'border-t-blue-500', 'border-t-purple-500', 'border-t-amber-500']

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Unit Bisnis</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola cabang, booth, atau outlet usaha Anda</p>
      </div>

      {/* Unit Bisnis Grid */}
      {(unitList ?? []).length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <div className="text-5xl mb-3">🏪</div>
          <p className="text-sm font-medium">Belum ada unit bisnis</p>
          <p className="text-xs mt-1">Tambahkan cabang atau booth di bawah ini</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(unitList ?? []).map((u, i) => (
            <div key={u.id} className={`card p-5 border-t-4 ${tipeBorder[i % tipeBorder.length]}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-gray-800">{u.nama}</p>
                  {u.alamat && <p className="text-xs text-gray-400 mt-0.5">{u.alamat}</p>}
                </div>
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">Aktif</span>
              </div>
              {u.deskripsi && <p className="text-sm text-gray-500 mt-2">{u.deskripsi}</p>}
              <div className="flex gap-2 mt-4">
                <a href={`/transaksi?unit_bisnis_id=${u.id}`} className="btn-secondary text-xs py-1.5 px-3">
                  Lihat Transaksi
                </a>
                <a href={`/laporan?unit_bisnis_id=${u.id}`} className="btn-secondary text-xs py-1.5 px-3">
                  Laporan
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Tambah */}
      <div className="card p-6">
        <h2 className="text-base font-bold mb-4">Tambah Unit Bisnis / Cabang</h2>
        <UnitBisnisForm />
      </div>
    </div>
  )
}
