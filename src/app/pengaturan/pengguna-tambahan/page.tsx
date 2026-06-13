'use client'

import { useState, useEffect } from 'react'
import {
  getPenggunaTambahan, tambahPenggunaTambahan, updatePenggunaTambahan, hapusPenggunaTambahan,
  
  type PeranPengguna, type PermisiKas, type PermisiMenu, type PenggunaTambahan,
} from '@/lib/actions/pengguna-tambahan'
import { defaultPermisiMenu } from '@/lib/pengguna-tambahan-types'
import { getKas } from '@/lib/actions/index'
import type { Kas } from '@/types'

const PERAN_LIST: { value: PeranPengguna; label: string; desc: string }[] = [
  { value: 'Read Only',  label: 'Read Only',  desc: 'Dapat membaca semua data tapi tidak bisa mengubah' },
  { value: 'Writer',     label: 'Writer',     desc: 'Dapat mencatat transaksi sendiri, tidak bisa edit transaksi orang lain' },
  { value: 'Supervisor', label: 'Supervisor', desc: 'Akses Buku Kas & Peralatan, tidak bisa lihat Laporan & Saldo' },
  { value: 'Manager',    label: 'Manager',    desc: 'Semua menu kecuali Pengaturan, bisa baca laporan & edit transaksi' },
  { value: 'Custom',     label: 'Custom',     desc: 'Anda tentukan sendiri hak akses per Buku Kas dan menu lainnya' },
]

const PERMISI_KEYS: { key: keyof PermisiKas; label: string }[] = [
  { key: 'melihat_saldo',      label: 'Melihat saldo' },
  { key: 'mencatat_transaksi', label: 'Mencatat transaksi' },
  { key: 'mengedit_transaksi', label: 'Mengedit atau menghapus transaksi' },
  { key: 'unduh_excel',        label: 'Unduh file excel' },
  { key: 'unduh_pdf',          label: 'Unduh file pdf' },
  { key: 'kirim_excel_email',  label: 'Kirim file excel sebagai lampiran email' },
  { key: 'kirim_pdf_email',    label: 'Kirim file pdf sebagai lampiran email' },
]

const PERMISI_LAPORAN_KEYS = [
  { key: 'unduh_excel',       label: 'Unduh file excel' },
  { key: 'unduh_pdf',         label: 'Unduh file pdf' },
  { key: 'kirim_excel_email', label: 'Kirim file excel sebagai lampiran email' },
  { key: 'kirim_pdf_email',   label: 'Kirim file pdf sebagai lampiran email' },
] as const

const MENU_LAPORAN = [
  { key: 'laporan_harian'  as const, label: 'Laporan Harian' },
  { key: 'laporan_bulanan' as const, label: 'Laporan Bulanan' },
  { key: 'laporan_tahunan' as const, label: 'Laporan Tahunan' },
  { key: 'laporan_custom'  as const, label: 'Laporan Custom' },
]

const PERMISI_PIUTANG_KEYS = [
  { key: 'melihat_saldo'      as const, label: 'Melihat saldo' },
  { key: 'catat_piutang'      as const, label: 'Catat piutang' },
  { key: 'ubah_hapus_piutang' as const, label: 'Ubah atau hapus piutang' },
  { key: 'unduh_excel'        as const, label: 'Unduh file excel' },
  { key: 'unduh_pdf'          as const, label: 'Unduh file pdf' },
  { key: 'kirim_excel_email'  as const, label: 'Kirim file excel sebagai lampiran email' },
  { key: 'kirim_pdf_email'    as const, label: 'Kirim file pdf sebagai lampiran email' },
]

function emptyPermisiKas(kas: Kas): PermisiKas {
  return {
    kas_id: kas.id, nama_kas: kas.nama, aktif: false,
    melihat_saldo: false, mencatat_transaksi: false,
    mengedit_transaksi: false, unduh_excel: false,
    unduh_pdf: false, kirim_excel_email: false, kirim_pdf_email: false,
  }
}

export default function PenggunaTambahanPage() {
  const [daftar, setDaftar] = useState<PenggunaTambahan[]>([])
  const [kasList, setKasList] = useState<Kas[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)

  // Form state
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [peran, setPeran] = useState<PeranPengguna | ''>('')
  const [permisiList, setPermisiList] = useState<PermisiKas[]>([])
  const [permisiMenu, setPermisiMenu] = useState<PermisiMenu>(defaultPermisiMenu())

  useEffect(() => {
    async function load() {
      const [daftarRes, kasRes] = await Promise.all([getPenggunaTambahan(), getKas()])
      setDaftar((daftarRes.data as PenggunaTambahan[]) ?? [])
      setKasList(kasRes.data ?? [])
    }
    load()
  }, [])

  useEffect(() => {
    if (peran === 'Custom' && permisiList.length === 0) {
      setPermisiList(kasList.map(emptyPermisiKas))
    }
  }, [peran, kasList])

  function resetForm() {
    setNama(''); setEmail(''); setPassword(''); setPeran(''); setPermisiList([])
    setPermisiMenu(defaultPermisiMenu())
    setEditingId(null); setShowForm(false); setMsg('')
  }

  function startEdit(u: PenggunaTambahan) {
    setEditingId(u.id)
    setNama(u.nama); setEmail(u.email); setPassword('')
    setPeran(u.peran)
    setPermisiList(u.permisi_custom ?? kasList.map(emptyPermisiKas))
    setPermisiMenu(u.permisi_menu ?? defaultPermisiMenu())
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleKasAktif(kasId: string, val: boolean) {
    setPermisiList(prev => prev.map(p => {
      if (p.kas_id !== kasId) return p
      if (!val) return { ...p, aktif: false, melihat_saldo: false, mencatat_transaksi: false, mengedit_transaksi: false, unduh_excel: false, unduh_pdf: false, kirim_excel_email: false, kirim_pdf_email: false }
      return { ...p, aktif: true }
    }))
  }

  function togglePermisi(kasId: string, key: keyof PermisiKas, val: boolean) {
    setPermisiList(prev => prev.map(p => p.kas_id !== kasId ? p : { ...p, [key]: val }))
  }

  // Toggle parent menu
  function toggleMenuParent<K extends keyof PermisiMenu>(menuKey: K, val: boolean) {
    setPermisiMenu(prev => {
      const section = { ...prev[menuKey] } as any
      // set all children to false when parent unchecked
      Object.keys(section).forEach(k => { section[k] = k === 'aktif' ? val : val ? section[k] : false })
      section.aktif = val
      return { ...prev, [menuKey]: section }
    })
  }

  function toggleMenuChild<K extends keyof PermisiMenu>(menuKey: K, childKey: string, val: boolean) {
    setPermisiMenu(prev => {
      const section = { ...prev[menuKey] } as any
      section[childKey] = val
      return { ...prev, [menuKey]: section }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!peran) { setIsErr(true); setMsg('Pilih peran terlebih dahulu'); return }
    setLoading(true); setMsg('')

    const payload = {
      nama, email, password, peran: peran as PeranPengguna,
      permisi_custom: peran === 'Custom' ? permisiList : undefined,
      permisi_menu: peran === 'Custom' ? permisiMenu : undefined,
    }

    const result = editingId
      ? await updatePenggunaTambahan(editingId, payload)
      : await tambahPenggunaTambahan(payload)

    setIsErr(!!result.error)
    if (result.error) {
      setMsg(result.error)
    } else {
      setMsg(editingId ? 'Pengguna berhasil diperbarui!' : 'Pengguna berhasil ditambahkan!')
      const refresh = await getPenggunaTambahan()
      setDaftar((refresh.data as PenggunaTambahan[]) ?? [])
      resetForm()
    }
    setLoading(false)
  }

  async function handleDelete(id: string, namaUser: string) {
    if (!confirm(`Hapus pengguna "${namaUser}"?`)) return
    const result = await hapusPenggunaTambahan(id)
    if (result.error) { alert(result.error); return }
    setDaftar(prev => prev.filter(u => u.id !== id))
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👥</span>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Pengguna Tambahan</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pengaturan · Hanya SuperAdmin yang dapat mengelola</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded text-sm font-semibold text-white" style={{ background: 'var(--brand)' }}>
            Buat Pengguna Tambahan »
          </button>
        )}
      </div>

      {msg && !showForm && (
        <div className={`p-3 rounded-lg text-sm ${isErr ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{msg}</div>
      )}

      {/* ── FORM ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
              {editingId ? 'Edit Pengguna Tambahan' : 'Tambah Pengguna Tambahan'}
            </h2>
            <button onClick={resetForm} className="text-sm" style={{ color: 'var(--text-muted)' }}>✕ Tutup</button>
          </div>

          {msg && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${isErr ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{msg}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Nama *</label>
                <input value={nama} onChange={e => setNama(e.target.value)} required placeholder="Nama pengguna"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Peran *</label>
                <select value={peran} onChange={e => { setPeran(e.target.value as PeranPengguna); setPermisiList([]) }} required
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}>
                  <option value="">---</option>
                  {PERAN_LIST.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                {peran && peran !== 'Custom' && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{PERAN_LIST.find(p => p.value === peran)?.desc}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@example.com"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={editingId ? 'Kosongkan jika tidak diganti' : 'Password pengguna'}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
              </div>
            </div>

            {/* Custom Permissions */}
            {peran === 'Custom' && (
              <div className="space-y-4">
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Pilih hak akses</p>

                {/* ── Buku Kas ────────────────────────── */}
                {kasList.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Belum ada Buku Kas.</p>
                ) : permisiList.map((perm) => (
                  <div key={perm.kas_id} style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" checked={perm.aktif} onChange={e => toggleKasAktif(perm.kas_id, e.target.checked)} className="w-4 h-4" style={{ accentColor: 'var(--brand)' }} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Buku Kas: {perm.nama_kas}</span>
                    </label>
                    {perm.aktif && (
                      <div className="ml-6 space-y-1.5">
                        {PERMISI_KEYS.map(pk => (
                          <label key={pk.key} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={Boolean(perm[pk.key])} onChange={e => togglePermisi(perm.kas_id, pk.key, e.target.checked)} className="w-4 h-4" style={{ accentColor: 'var(--brand)' }} />
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{pk.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* ── Buku Piutang ─────────────────── */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={permisiMenu.buku_piutang.aktif} onChange={e => toggleMenuParent('buku_piutang', e.target.checked)} className="w-4 h-4" style={{ accentColor: 'var(--brand)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Buku Piutang</span>
                  </label>
                  {permisiMenu.buku_piutang.aktif && (
                    <div className="ml-6 space-y-1.5">
                      {PERMISI_PIUTANG_KEYS.map(pk => (
                        <label key={pk.key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={Boolean(permisiMenu.buku_piutang[pk.key])} onChange={e => toggleMenuChild('buku_piutang', pk.key, e.target.checked)} className="w-4 h-4" style={{ accentColor: 'var(--brand)' }} />
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{pk.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Laporan ──────────────────────── */}
                {MENU_LAPORAN.map(({ key, label }) => (
                  <div key={key} style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" checked={permisiMenu[key].aktif} onChange={e => toggleMenuParent(key, e.target.checked)} className="w-4 h-4" style={{ accentColor: 'var(--brand)' }} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{label}</span>
                    </label>
                    {permisiMenu[key].aktif && (
                      <div className="ml-6 space-y-1.5">
                        {PERMISI_LAPORAN_KEYS.map(pk => (
                          <label key={pk.key} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={Boolean((permisiMenu[key] as any)[pk.key])} onChange={e => toggleMenuChild(key, pk.key, e.target.checked)} className="w-4 h-4" style={{ accentColor: 'var(--brand)' }} />
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{pk.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* ── Peralatan ─────────────────────── */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={permisiMenu.peralatan.aktif} onChange={e => toggleMenuParent('peralatan', e.target.checked)} className="w-4 h-4" style={{ accentColor: 'var(--brand)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Peralatan</span>
                  </label>
                  {permisiMenu.peralatan.aktif && (
                    <div className="ml-6 space-y-1.5">
                      {[{ key: 'e_invoice' as const, label: 'e-Invoice' },
                        { key: 'catatan'   as const, label: 'Catatan' },
                        { key: 'supplier'  as const, label: 'Supplier' }].map(pk => (
                        <label key={pk.key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={permisiMenu.peralatan[pk.key]} onChange={e => toggleMenuChild('peralatan', pk.key, e.target.checked)} className="w-4 h-4" style={{ accentColor: 'var(--brand)' }} />
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{pk.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}


                {/* ── Akuntansi ─────────────────────── */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={permisiMenu.akuntansi.aktif} onChange={e => toggleMenuParent('akuntansi', e.target.checked)} className="w-4 h-4" style={{ accentColor: 'var(--brand)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Akuntansi</span>
                  </label>
                  {permisiMenu.akuntansi.aktif && (
                    <div className="ml-6 space-y-1.5">
                      {[
                        { key: 'chart_of_accounts' as const, label: 'Chart of Accounts' },
                        { key: 'jurnal_memorial'   as const, label: 'Jurnal Memorial' },
                        { key: 'neraca'            as const, label: 'Neraca' },
                        { key: 'laba_rugi'         as const, label: 'Laba Rugi' },
                      ].map(pk => (
                        <label key={pk.key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={permisiMenu.akuntansi[pk.key]} onChange={e => toggleMenuChild('akuntansi', pk.key, e.target.checked)} className="w-4 h-4" style={{ accentColor: 'var(--brand)' }} />
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{pk.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded text-sm font-semibold border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Batal</button>
              <button type="submit" disabled={loading} className="px-5 py-2 rounded text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'var(--brand)' }}>
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── INFO PERAN ──────────────────────────────────────── */}
      <div className="card p-6">
        <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text)' }}>Jenis Peran</h2>
        <div className="space-y-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {PERAN_LIST.map(p => (
            <div key={p.value} className="flex gap-2">
              <span className="text-sm font-bold w-24 flex-shrink-0" style={{ color: 'var(--text)' }}>{p.label}</span>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{p.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── DAFTAR ─────────────────────────────────────────── */}
      <div className="card p-6">
        <h2 className="text-base font-bold mb-4 pb-3" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>Daftar Pengguna Tambahan</h2>
        {daftar.length === 0 ? (
          <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Belum ada pengguna tambahan.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {daftar.map(u => (
              <div key={u.id} className="flex items-center gap-4 py-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'var(--nav-active-bg)', color: 'var(--brand)', border: '1px solid var(--brand)' }}>
                  {u.nama.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{u.nama}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: 'var(--nav-active-bg)', color: 'var(--brand)' }}>{u.peran}</span>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(u)} className="text-xs px-3 py-1.5 rounded border font-semibold" style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}>Edit</button>
                  <button onClick={() => handleDelete(u.id, u.nama)} className="text-xs px-3 py-1.5 rounded border font-semibold" style={{ borderColor: 'rgba(220,38,38,0.4)', color: '#dc2626' }}>Hapus</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
