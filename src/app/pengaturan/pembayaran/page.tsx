export const revalidate = 0

const riwayatPembayaran: any[] = [
  // Data contoh — ganti dengan data dari database
]

export default function PembayaranPage() {
  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚙️</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pembayaran</h1>
          <p className="text-sm text-gray-500">Riwayat Premium Saya</p>
        </div>
      </div>

      {riwayatPembayaran.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400 text-sm">Belum ada riwayat pembayaran.</p>
          <button className="mt-4 bg-[var(--brand)] text-white px-5 py-2 rounded text-sm font-semibold hover:opacity-90">
            Upgrade ke Premium
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {riwayatPembayaran.map((item: any) => (
            <div key={item.id} className="card p-4 flex gap-3 border-l-4 border-green-700">
              <div>
                <p className="font-bold text-sm text-gray-800">{item.tanggal}, ID {item.id}</p>
                <p className="text-xs text-gray-600">{item.paket}, {item.harga}</p>
                <p className="text-xs text-gray-600">{item.metode}</p>
                <p className="text-xs font-bold text-gray-800 mt-1">Status : {item.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-base font-bold text-gray-800 mb-3">Upgrade Premium</h2>
        <p className="text-sm text-gray-600 mb-4">
          Nikmati fitur lengkap Praecox dengan berlangganan paket premium.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-[var(--brand)] rounded-lg p-4">
            <p className="font-bold text-[var(--brand)]">3 Bulan</p>
            <p className="text-2xl font-bold text-gray-800 my-2">Rp 63.000</p>
            <button className="w-full bg-[var(--brand)] text-white py-2 rounded text-sm font-semibold hover:opacity-90">
              Pilih Paket
            </button>
          </div>
          <div className="border border-[var(--brand)] rounded-lg p-4 bg-[var(--brand-light)]">
            <div className="flex items-center justify-between">
              <p className="font-bold text-[var(--brand)]">12 Bulan</p>
              <span className="text-xs bg-[var(--brand)] text-white px-2 py-0.5 rounded-full">Hemat</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 my-2">Rp 199.000</p>
            <button className="w-full bg-[var(--brand)] text-white py-2 rounded text-sm font-semibold hover:opacity-90">
              Pilih Paket
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
