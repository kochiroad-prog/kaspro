export const revalidate = 0

export default function AkunPage() {
  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚙️</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pengguna & Akun</h1>
          <p className="text-sm text-gray-500">Pengaturan</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100">
          Pengguna Utama
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kolom Kiri */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Nama lengkap" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telepon <span className="text-red-500">*</span></label>
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Nomor telepon" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perusahaan/Organisasi <span className="text-red-500">*</span></label>
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Nama perusahaan" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat <span className="text-red-500">*</span></label>
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Alamat baris 1" />
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Alamat baris 2" />
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Alamat baris 3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                <option value="">Pilih provinsi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kota <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                <option value="">Pilih kota</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pekerjaan/Jabatan <span className="text-red-500">*</span></label>
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Pekerjaan/jabatan" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Penggunaan <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                <option value="">Pilih penggunaan</option>
                <option value="pribadi">Pribadi</option>
                <option value="bisnis">Bisnis</option>
                <option value="organisasi">Organisasi</option>
              </select>
            </div>
          </div>

          {/* Kolom Kanan */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Password baru" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ulangi Password</label>
              <input type="password" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Ulangi password" />
              <p className="text-xs text-gray-400 mt-1">Biarkan kolom Password dan Ulangi Password kosong jika Anda tidak ingin mengganti password.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bahasa <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zona Waktu <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                <option value="Asia/Jakarta">Indonesia/Jakarta</option>
                <option value="Asia/Makassar">Indonesia/Makassar</option>
                <option value="Asia/Jayapura">Indonesia/Jayapura</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mata Uang <span className="text-red-500">*</span></label>
              <input type="text" className="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" defaultValue="Rp" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urutkan Buku Kas Berdasarkan Tanggal</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urutkan Utang & Piutang Berdasarkan Tanggal</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Status</span>
                <span className="font-bold text-[var(--brand)]">Pengguna premium</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tanggal Habis Premium</span>
                <span>—</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tanggal Mendaftar</span>
                <span>—</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Aktivitas Terakhir</span>
                <span>—</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Reset Buku Kas</span>
                <button className="text-red-500 hover:underline text-xs">Reset</button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button className="bg-[var(--brand)] text-white px-6 py-2 rounded text-sm font-semibold hover:opacity-90">
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
