import { getKas, tambahKas, hapusKas } from '@/lib/actions/index'
import { formatRupiah, ikonKas } from '@/lib/utils'
import KasForm from '@/components/forms/KasForm'

export const revalidate = 0

export default async function KasPage() {
  const { data: kasList } = await getKas()
  const totalSaldo = (kasList ?? []).reduce((s, k) => s + k.saldo, 0)

  const tipeLabel: Record<string, string> = {
    tunai: 'Kas Tunai', bank: 'Rekening Bank',
    ewallet: 'E-Wallet', lainnya: 'Lainnya',
  }
  const tipeBorder: Record<string, string> = {
    tunai: 'border-t-[var(--brand)]', bank: 'border-t-blue-500',
    ewallet: 'border-t-purple-500', lainnya: 'border-t-gray-400',
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kas & Rekening</h1>
          <p className="text-sm text-gray-500 mt-0.5">Total: <strong className="text-[var(--brand)]">{formatRupiah(totalSaldo)}</strong></p>
        </div>
      </div>

      {/* Kas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(kasList ?? []).map(k => (
          <div key={k.id} className={`card p-5 border-t-4 ${tipeBorder[k.tipe] ?? 'border-t-gray-400'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{ikonKas(k.tipe)}</span>
              <div>
                <p className="font-bold text-gray-800">{k.nama}</p>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  {tipeLabel[k.tipe]}
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--brand)] mt-1">{formatRupiah(k.saldo)}</p>
            <div className="flex gap-2 mt-4">
              <a href={`/transaksi?kas_id=${k.id}`} className="btn-secondary text-xs py-1.5 px-3">
                Lihat Transaksi
              </a>
              <form action={async () => {
                'use server'
                await hapusKas(k.id)
              }}>
                <button type="submit" className="text-xs py-1.5 px-3 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                  Hapus
                </button>
              </form>
            </div>
          </div>
        ))}

        {/* Tambah Kas Card */}
        <div className="card p-5 border-2 border-dashed border-gray-200 flex items-center justify-center min-h-[160px]">
          <div className="text-center">
            <div className="text-3xl mb-2">+</div>
            <p className="text-sm text-gray-500 font-medium">Tambah Kas Baru</p>
          </div>
        </div>
      </div>

      {/* Form Tambah Kas */}
      <div className="card p-6">
        <h2 className="text-base font-bold mb-4">Tambah Kas / Rekening Baru</h2>
        <KasForm />
      </div>
    </div>
  )
}
