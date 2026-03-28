import { getKas, getTransfer, prosesTransfer } from '@/lib/actions/index'
import { formatRupiah, formatTanggal, hariIni } from '@/lib/utils'
import TransferForm from '@/components/forms/TransferForm'

export const revalidate = 0

export default async function TransferPage() {
  const [{ data: kasList }, { data: transferList }] = await Promise.all([
    getKas(),
    getTransfer(),
  ])

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Transfer Antar Kas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pindahkan saldo antar rekening atau dompet</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-base font-bold mb-5">Buat Transfer</h2>
          <TransferForm kasList={kasList ?? []} />
        </div>

        {/* Riwayat */}
        <div className="lg:col-span-3 card p-5">
          <h2 className="text-base font-bold mb-4">Riwayat Transfer</h2>
          {(transferList ?? []).length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <div className="text-4xl mb-3">🔄</div>
              <p className="text-sm">Belum ada riwayat transfer</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {(transferList ?? []).map(t => (
                <div key={t.id} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🔄</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {t.dari_kas?.nama} → {t.ke_kas?.nama}
                    </p>
                    <p className="text-xs text-gray-400">{formatTanggal(t.tanggal)} {t.catatan && `· ${t.catatan}`}</p>
                  </div>
                  <p className="text-sm font-bold text-blue-600">{formatRupiah(t.jumlah)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
