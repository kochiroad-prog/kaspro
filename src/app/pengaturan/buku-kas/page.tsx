import { getKas, hapusKas } from '@/lib/actions/index'
import { formatRupiah, ikonKas } from '@/lib/utils'
import KasForm from '@/components/forms/KasForm'

export const revalidate = 0

const tipeLabel: Record<string, string> = {
  tunai: 'Kas Tunai',
  bank: 'Rekening Bank',
  ewallet: 'E-Wallet',
  lainnya: 'Lainnya',
}

const tipeBg: Record<string, string> = {
  tunai: 'bg-[var(--brand)]',
  bank: 'bg-blue-600',
  ewallet: 'bg-purple-600',
  lainnya: 'bg-gray-500',
}

export default async function BukuKasPage() {
  const { data: kasList } = await getKas()
  const list = kasList ?? []

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚙️</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Buku Kas</h1>
          <p className="text-sm text-gray-500">Pengaturan</p>
        </div>
      </div>

      {/* Daftar Buku Kas */}
      <div className="card p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100">
          Daftar Buku Kas
        </h2>

        {list.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Belum ada buku kas. Tambahkan di bawah.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map(k => (
              <div key={k.id} className="border border-gray-200 rounded-xl p-4 flex gap-3 hover:shadow-sm transition-shadow">
                {/* Ikon */}
                <div className={`w-12 h-14 ${tipeBg[k.tipe] ?? 'bg-gray-500'} rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xl`}>
                  {ikonKas(k.tipe)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--brand)] text-sm truncate">{k.nama}</p>
                  <p className="text-xs text-gray-500 mb-2">{tipeLabel[k.tipe] ?? k.tipe}</p>
                  <p className="text-xs text-[var(--brand)]">Saldo Awal: Rp 0,00</p>
                  <p className="text-xs text-[var(--brand)]">Saldo Sekarang: {formatRupiah(k.saldo)}</p>

                  {/* Tombol aksi */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <form action={async () => {
                      'use server'
                      await hapusKas(k.id)
                    }}>
                      <button
                        type="submit"
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        title="Hapus"
                      >
                        Hapus
                      </button>
                    </form>
                    <button className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:opacity-90 transition-opacity">
                      Edit »
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4 italic">
          Klik Edit untuk mengedit Saldo Awal, Kategori, dan berbagai opsi lain dari Buku Kas ini.
        </p>
      </div>

      {/* Form Tambah Buku Kas */}
      <div className="card p-6">
        <h2 className="text-base font-bold mb-4">+ Buku Kas Baru</h2>
        <KasForm />
      </div>
    </div>
  )
}
