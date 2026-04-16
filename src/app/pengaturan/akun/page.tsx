'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from '@/lib/actions/auth'

const PROVINSI_INDONESIA = [
  'Aceh','Bali','Banten','Bengkulu','DI Yogyakarta','DKI Jakarta',
  'Gorontalo','Jambi','Jawa Barat','Jawa Tengah','Jawa Timur','Kalimantan Barat',
  'Kalimantan Selatan','Kalimantan Tengah','Kalimantan Timur','Kalimantan Utara',
  'Kepulauan Bangka Belitung','Kepulauan Riau','Lampung','Maluku','Maluku Utara',
  'Nusa Tenggara Barat','Nusa Tenggara Timur','Papua','Papua Barat','Papua Barat Daya',
  'Papua Pegunungan','Papua Selatan','Papua Tengah','Riau','Sulawesi Barat',
  'Sulawesi Selatan','Sulawesi Tengah','Sulawesi Tenggara','Sulawesi Utara',
  'Sumatera Barat','Sumatera Selatan','Sumatera Utara',
]

export default function AkunPage() {
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState('')
  const [error, setError]       = useState('')
  const [userData, setUserData] = useState<any>(null)

  // Form state
  const [form, setForm] = useState({
    nama: '', nama_bisnis: '', email: '', no_whatsapp: '',
    telepon: '', alamat: '', provinsi: '', kota: '',
    pekerjaan: '', penggunaan: '', zona_waktu: 'Asia/Jakarta',
    mata_uang: 'Rp', password: '', password_conf: '',
  })

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserData(user)
      const m = user.user_metadata || {}
      setForm(f => ({
        ...f,
        nama:        m.nama        || '',
        nama_bisnis: m.nama_bisnis || '',
        email:       user.email    || '',
        no_whatsapp: m.no_whatsapp || '',
        telepon:     m.telepon     || '',
        alamat:      m.alamat      || '',
        provinsi:    m.provinsi    || '',
        kota:        m.kota        || '',
        pekerjaan:   m.pekerjaan   || '',
        penggunaan:  m.penggunaan  || '',
        zona_waktu:  m.zona_waktu  || 'Asia/Jakarta',
        mata_uang:   m.mata_uang   || 'Rp',
      }))
      setLoading(false)
    }
    loadUser()
  }, [])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))

    const result = await updateProfile(fd)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess('Profil berhasil disimpan!')
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Memuat data...</div>
  )

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚙️</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pengguna & Akun</h1>
          <p className="text-sm text-gray-500">Pengaturan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100">
            Pengguna Utama
          </h2>

          {error   && <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">{error}</div>}
          {success && <div className="mb-4 p-3 rounded bg-green-50 text-green-700 text-sm border border-green-200">{success}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kolom Kiri */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                <input required value={form.nama} onChange={e => set('nama', e.target.value)}
                  type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Nama lengkap" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perusahaan/Organisasi</label>
                <input value={form.nama_bisnis} onChange={e => set('nama_bisnis', e.target.value)}
                  type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Nama perusahaan" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={form.email} disabled
                  type="email" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. WhatsApp
                  <span className="ml-1 text-xs text-[var(--brand)] font-normal">(untuk bot Kaspro)</span>
                </label>
                <input value={form.no_whatsapp} onChange={e => set('no_whatsapp', e.target.value)}
                  type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  placeholder="Contoh: 6281234567890" />
                <p className="text-xs text-gray-400 mt-1">Format: 628xxx (tanpa + dan tanda -)  </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                <input value={form.telepon} onChange={e => set('telepon', e.target.value)}
                  type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Nomor telepon" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <input value={form.alamat} onChange={e => set('alamat', e.target.value)}
                  type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Alamat lengkap" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                <select value={form.provinsi} onChange={e => set('provinsi', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                  <option value="">Pilih provinsi</option>
                  {PROVINSI_INDONESIA.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kota / Kabupaten</label>
                <input value={form.kota} onChange={e => set('kota', e.target.value)}
                  type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Nama kota / kabupaten" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pekerjaan/Jabatan</label>
                <input value={form.pekerjaan} onChange={e => set('pekerjaan', e.target.value)}
                  type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Pekerjaan/jabatan" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Penggunaan</label>
                <select value={form.penggunaan} onChange={e => set('penggunaan', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                <input value={form.password} onChange={e => set('password', e.target.value)}
                  type="password" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Password baru (kosongkan jika tidak ganti)" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ulangi Password</label>
                <input value={form.password_conf} onChange={e => set('password_conf', e.target.value)}
                  type="password" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Ulangi password baru" />
                <p className="text-xs text-gray-400 mt-1">Biarkan kosong jika tidak ingin mengganti password.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bahasa</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona Waktu</label>
                <select value={form.zona_waktu} onChange={e => set('zona_waktu', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                  <option value="Asia/Jakarta">Indonesia/Jakarta (WIB)</option>
                  <option value="Asia/Makassar">Indonesia/Makassar (WITA)</option>
                  <option value="Asia/Jayapura">Indonesia/Jayapura (WIT)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mata Uang</label>
                <input value={form.mata_uang} onChange={e => set('mata_uang', e.target.value)}
                  type="text" className="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
              </div>

              {/* Info akun */}
              <div className="pt-4 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Status</span>
                  <span className="font-bold text-[var(--brand)]">
                    {userData?.profile?.plan === 'pro' ? 'Premium' : 'Gratis'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tanggal Mendaftar</span>
                  <span>{userData?.created_at ? new Date(userData.created_at).toLocaleDateString('id-ID') : '—'}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>User ID</span>
                  <span className="text-xs text-gray-400">{userData?.id?.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button type="submit" disabled={saving}
              className="bg-[var(--brand)] text-white px-6 py-2 rounded text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Menyimpan...
                </>
              ) : 'Simpan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
