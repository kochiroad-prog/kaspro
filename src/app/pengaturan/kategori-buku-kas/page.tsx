import { getKategori, tambahKategori, hapusKategori } from '@/lib/actions/index'
import KategoriForm from '@/components/forms/KategoriForm'

export const revalidate = 0

export default async function KategoriBukuKasPage() {
  const { data: semua } = await getKategori()
  const incList = (semua ?? []).filter(k => k.tipe === 'pemasukan')
  const expList = (semua ?? []).filter(k => k.tipe === 'pengeluaran')

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚙️</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kategori Buku Kas</h1>
          <p className="text-sm text-gray-500">Pengaturan</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pengeluaran */}
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
              Pengeluaran
            </h2>
            <div className="space-y-0">
              {expList.length === 0 && (
                <p className="text-sm text-gray-400 italic">Belum ada kategori pengeluaran.</p>
              )}
              {expList.map(k => (
                <div key={k.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-[var(--brand)]">
                    <span>{k.ikon}</span>
                    <span>{k.nama}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <form action={async () => { 'use server'; await hapusKategori(k.id) }}>
                      <button type="submit" className="text-red-400 hover:text-red-600 text-lg leading-none" title="Hapus">⊗</button>
                    </form>
                    <button className="text-gray-400 hover:text-gray-600 text-sm" title="Edit">✏️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pemasukan */}
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
              Pemasukan
            </h2>
            <div className="space-y-0">
              {incList.length === 0 && (
                <p className="text-sm text-gray-400 italic">Belum ada kategori pemasukan.</p>
              )}
              {incList.map(k => (
                <div key={k.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-[var(--brand)]">
                    <span>{k.ikon}</span>
                    <span>{k.nama}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <form action={async () => { 'use server'; await hapusKategori(k.id) }}>
                      <button type="submit" className="text-red-400 hover:text-red-600 text-lg leading-none" title="Hapus">⊗</button>
                    </form>
                    <button className="text-gray-400 hover:text-gray-600 text-sm" title="Edit">✏️</button>
                  </div>
                </div>
              ))}
            </div>
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
