export const revalidate = 0

const peranList = [
  {
    nama: 'Manager',
    deskripsi: 'Pengguna Tambahan ini dapat mengakses semua menu kecuali Pengaturan. Dia dapat membaca Laporan serta mencatat dan mengedit Pemasukan/Pengeluaran/Transfer.',
  },
  {
    nama: 'Supervisor',
    deskripsi: 'Pengguna Tambahan ini dapat mengakses Buku kas dan menu Peralatan, tetapi tidak dapat membuka Laporan dan menu Pengaturan. Dia tidak dapat melihat Saldo, tetapi dapat mencatat dan mengedit Pemasukan/Pengeluaran/Transfer.',
  },
  {
    nama: 'Writer',
    deskripsi: 'Pengguna Tambahan ini dapat mengakses Buku Kas dan Peralatan, tetapi tidak dapat membuka Laporan dan menu Pengaturan. Pengguna Tambahan ini juga tidak dapat melihat Saldo. Dia dapat mencatat Pemasukan, Pengeluaran, dan Transfer, tetapi dia tidak dapat membaca, mengedit, atau menghapus aktivitas yang dilakukan oleh Pengguna yang lain. Pengguna ini hanya dapat membaca dan mengubah transaksi yang dia buat sendiri.',
  },
  {
    nama: 'Read Only',
    deskripsi: 'Pengguna Tambahan ini dapat mengakses semua halaman, kecuali Peralatan dan Pengaturan. Dia dapat membaca seluruh isi Buku Kas dan Laporan, tetapi tidak dapat mengubah atau menambah aktivitas-aktivitas di dalamnya.',
  },
  {
    nama: 'Custom',
    deskripsi: 'Anda dapat menentukan sendiri hak akses pengguna, misalnya hanya dapat mengakses buku kas tertentu. Catatan: hanya kompatibel dengan aplikasi mobile versi 2.3 ke atas. Pastikan aplikasi mobile yang digunakan Pengguna Tambahan Anda selalu up-to-date, mungkin mereka juga perlu log-out lalu login lagi.',
  },
]

export default function PenggunaTambahanPage() {
  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚙️</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pengguna Tambahan</h1>
          <p className="text-sm text-gray-500">Pengaturan</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-bold text-gray-800 mb-3">Pengguna Tambahan</h2>
        <p className="text-sm text-gray-600 mb-4">
          Anda dapat membuat beberapa Pengguna Tambahan untuk membuka dan mengisi Buku Kas. Anda dapat memilih satu dari empat Peran yang tersedia untuk membatasi akses pengguna-pengguna tambahan tersebut. Semua Pengguna Tambahan tidak dapat membuka grup-menu "Pengaturan", jadi hanya Anda (Pengguna Utama) yang bisa menambah, mengedit, atau menghapusnya.
        </p>

        <div className="space-y-3 mb-5 border-t border-gray-100 pt-4">
          {peranList.map(p => (
            <div key={p.nama}>
              <p className="text-sm font-bold text-gray-800">{p.nama}</p>
              <p className="text-sm text-gray-600">{p.deskripsi}</p>
            </div>
          ))}
        </div>

        <button className="text-sm text-[var(--brand)] hover:underline font-medium">Baca Tutorial »</button>

        <div className="mt-5">
          <button className="bg-[var(--brand)] text-white px-5 py-2 rounded text-sm font-semibold hover:opacity-90">
            Buat Pengguna Tambahan »
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100">
          Daftar Pengguna Tambahan
        </h2>
        <p className="text-sm text-gray-400 italic">Belum ada pengguna tambahan.</p>
      </div>
    </div>
  )
}
