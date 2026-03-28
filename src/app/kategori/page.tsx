import { getKategori, tambahKategori, hapusKategori } from '@/lib/actions/index'
import KategoriForm from '@/components/forms/KategoriForm'

export const revalidate = 0

export default async function KategoriPage() {
  const { data: semua } = await getKategori()
  const incList = (semua ?? []).filter(k => k.tipe === 'pemasukan')
  const expList = (semua ?? []).filter(k => k.tipe === 'pengeluaran')

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kategori</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola kategori transaksi Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Uang Masuk */}
        <div className="card p-5">
          <h2 className="text-base font-bold text-green-700 mb-4">💰 Uang Masuk ({incList.length})</h2>
          <div className="flex flex-wrap gap-2">
            {incList.map(k => (
              <div key={k.id} className="flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-800 text-sm px-3 py-1.5 rounded-full font-medium">
                <span>{k.ikon}</span>
                <span>{k.nama}</span>
                <form action={async () => { 'use server'; await hapusKategori(k.id) }}>
                  <button type="submit" className="ml-1 text-green-400 hover:text-red-500 text-xs leading-none">✕</button>
                </form>
              </div>
            ))}
          </div>
        </div>

        {/* Uang Keluar */}
        <div className="card p-5">
          <h2 className="text-base font-bold text-red-700 mb-4">💸 Uang Keluar ({expList.length})</h2>
          <div className="flex flex-wrap gap-2">
            {expList.map(k => (
              <div key={k.id} className="flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-800 text-sm px-3 py-1.5 rounded-full font-medium">
                <span>{k.ikon}</span>
                <span>{k.nama}</span>
                <form action={async () => { 'use server'; await hapusKategori(k.id) }}>
                  <button type="submit" className="ml-1 text-red-300 hover:text-red-600 text-xs leading-none">✕</button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Tambah */}
      <div className="card p-6">
        <h2 className="text-base font-bold mb-4">Tambah Kategori Baru</h2>
        <KategoriForm />
      </div>
    </div>
  )
}
