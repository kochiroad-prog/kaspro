'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getInvoice, tambahInvoice, hapusInvoice, updateStatusInvoice,
  type Invoice, type InvoiceItem,
} from '@/lib/actions/invoice'

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}

function generateInvoiceNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const r = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `INV-${y}${m}${d}-${r}`
}

// Simpan profil perusahaan di localStorage agar persisten
const PROFILE_KEY = 'kaspro_company_profile'
function loadProfile() {
  try {
    const s = localStorage.getItem(PROFILE_KEY)
    return s ? JSON.parse(s) : { logo: '', nama: '', alamat1: '', alamat2: '', alamat3: '' }
  } catch { return { logo: '', nama: '', alamat1: '', alamat2: '', alamat3: '' } }
}
function saveProfile(p: any) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)) } catch {}
}

export default function EInvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)
  const [showPreviewId, setShowPreviewId] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [nomorInvoice, setNomorInvoice] = useState(generateInvoiceNumber())
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [jatuhTempo, setJatuhTempo] = useState('')
  const [pelanggan, setPelanggan] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', deskripsi: '', qty: 1, hargaSatuan: 0 }])
  const [catatan, setCatatan] = useState('')

  // Company profile state
  const [logo, setLogo] = useState('')
  const [namaPerusahaan, setNamaPerusahaan] = useState('')
  const [alamat1, setAlamat1] = useState('')
  const [alamat2, setAlamat2] = useState('')
  const [alamat3, setAlamat3] = useState('')

  useEffect(() => {
    const p = loadProfile()
    setLogo(p.logo); setNamaPerusahaan(p.nama)
    setAlamat1(p.alamat1); setAlamat2(p.alamat2); setAlamat3(p.alamat3)
  }, [])

  // Auto-save profile whenever it changes
  useEffect(() => {
    saveProfile({ logo, nama: namaPerusahaan, alamat1, alamat2, alamat3 })
  }, [logo, namaPerusahaan, alamat1, alamat2, alamat3])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getInvoice()
      setInvoices((res.data as Invoice[]) ?? [])
    } catch (e) {
      console.error('Gagal memuat invoice:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) { alert('Ukuran logo maksimal 500 KB'); return }
    const reader = new FileReader()
    reader.onload = ev => setLogo(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleAddItem() {
    setItems(prev => [...prev, { id: String(Date.now()), deskripsi: '', qty: 1, hargaSatuan: 0 }])
  }

  function handleRemoveItem(id: string) {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  function handleItemChange(id: string, field: string, value: string | number) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  function calculateTotal(): number {
    return items.reduce((sum, item) => sum + (item.qty * item.hargaSatuan), 0)
  }

  function resetForm() {
    setNomorInvoice(generateInvoiceNumber())
    setTanggal(new Date().toISOString().split('T')[0])
    setJatuhTempo(''); setPelanggan('')
    setItems([{ id: '1', deskripsi: '', qty: 1, hargaSatuan: 0 }])
    setCatatan(''); setShowForm(false); setMsg('')
  }

  async function handleSaveInvoice() {
    if (!namaPerusahaan.trim()) { setMsg('Nama perusahaan wajib diisi'); setIsErr(true); return }
    if (!pelanggan.trim()) { setMsg('Nama pelanggan wajib diisi'); setIsErr(true); return }
    if (items.some(i => !i.deskripsi.trim() || i.qty <= 0 || i.hargaSatuan <= 0)) {
      setMsg('Semua item harus diisi lengkap'); setIsErr(true); return
    }

    setSaving(true); setMsg('')
    try {
      const total = calculateTotal()
      const res = await tambahInvoice({
        nomor: nomorInvoice, tanggal, jatuh_tempo: jatuhTempo || null,
        pelanggan, items, total, catatan,
        logo_url: logo || null,
        nama_perusahaan: namaPerusahaan,
        alamat_perusahaan: [alamat1, alamat2, alamat3].filter(Boolean).join('\n'),
      })
      setIsErr(!!res.error)
      if (res.error) { setMsg(res.error) }
      else { await load(); resetForm() }
    } catch (e) {
      setIsErr(true); setMsg('Gagal menyimpan invoice.')
      console.error(e)
    } finally { setSaving(false) }
  }

  async function handleDeleteInvoice(id: string) {
    if (!confirm('Hapus invoice ini?')) return
    try {
      const res = await hapusInvoice(id)
      if (res.error) { alert(res.error); return }
      setInvoices(prev => prev.filter(inv => inv.id !== id))
    } catch (e) { console.error(e) }
  }

  async function handleToggleStatus(inv: Invoice) {
    const newStatus = inv.status === 'lunas' ? 'belum_lunas' : 'lunas'
    try {
      await updateStatusInvoice(inv.id, newStatus)
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: newStatus } : i))
    } catch (e) { console.error(e) }
  }

  const previewInvoice = showPreviewId ? invoices.find(inv => inv.id === showPreviewId) : null

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧾</span>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>e-Invoice</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Kelola dan buat invoice digital</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded text-sm font-semibold text-white" style={{ background: 'var(--brand)' }}>
            + Buat Invoice Baru
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Buat Invoice Baru</h2>
            <button onClick={resetForm} className="text-sm" style={{ color: 'var(--text-muted)' }}>✕ Tutup</button>
          </div>

          {msg && (
            <div className={`mb-4 p-3 rounded text-sm ${isErr ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{msg}</div>
          )}

          <div className="space-y-5">
            {/* ── Info Perusahaan ─────────────────────────── */}
            <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)', background: 'var(--nav-active-bg)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Info Perusahaan (tersimpan otomatis)</p>
              <div className="flex gap-4 flex-wrap">
                {/* Logo */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-20 h-20 rounded-lg border flex items-center justify-center overflow-hidden cursor-pointer"
                    style={{ borderColor: 'var(--border)', background: 'var(--card-bg)' }}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-2xl">🏢</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="text-xs px-2 py-1 rounded border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                  >
                    {logo ? 'Ganti Logo' : 'Pilih Logo'}
                  </button>
                  {logo && (
                    <button type="button" onClick={() => setLogo('')} className="text-xs" style={{ color: '#ef4444' }}>Hapus</button>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </div>

                {/* Info */}
                <div className="flex-1 space-y-2 min-w-0">
                  <input
                    value={namaPerusahaan} onChange={e => setNamaPerusahaan(e.target.value)}
                    placeholder="Nama Perusahaan Anda *"
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                  />
                  <input
                    value={alamat1} onChange={e => setAlamat1(e.target.value)}
                    placeholder="Alamat Anda baris 1"
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                  />
                  <input
                    value={alamat2} onChange={e => setAlamat2(e.target.value)}
                    placeholder="Alamat Anda baris 2"
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                  />
                  <input
                    value={alamat3} onChange={e => setAlamat3(e.target.value)}
                    placeholder="Alamat Anda baris 3"
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                  />
                </div>
              </div>
            </div>

            {/* ── Info Invoice ────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Nomor Invoice</label>
                <input type="text" value={nomorInvoice} disabled
                  className="w-full border rounded px-3 py-2 text-sm cursor-not-allowed"
                  style={{ borderColor: 'var(--border)', background: 'var(--nav-active-bg)', color: 'var(--text-muted)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Tanggal Invoice *</label>
                <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Jatuh Tempo</label>
                <input type="date" value={jatuhTempo} onChange={e => setJatuhTempo(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Pelanggan *</label>
              <input type="text" value={pelanggan} onChange={e => setPelanggan(e.target.value)}
                placeholder="Nama pelanggan atau perusahaan"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
            </div>

            {/* Items */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Item</label>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th className="pb-2 text-left pr-2">Deskripsi</th>
                      <th className="pb-2 text-right pr-2 w-20">Qty</th>
                      <th className="pb-2 text-right pr-2 w-32">Harga Satuan</th>
                      <th className="pb-2 text-right pr-2 w-32">Subtotal</th>
                      <th className="pb-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-2 pr-2">
                          <input type="text" value={item.deskripsi} onChange={e => handleItemChange(item.id, 'deskripsi', e.target.value)}
                            placeholder="Deskripsi item"
                            className="w-full border rounded px-2 py-1.5 text-xs focus:outline-none"
                            style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
                        </td>
                        <td className="py-2 pr-2">
                          <input type="number" min="1" value={item.qty} onChange={e => handleItemChange(item.id, 'qty', parseInt(e.target.value) || 0)}
                            className="w-full border rounded px-2 py-1.5 text-xs focus:outline-none text-right"
                            style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
                        </td>
                        <td className="py-2 pr-2">
                          <input type="number" min="0" value={item.hargaSatuan} onChange={e => handleItemChange(item.id, 'hargaSatuan', parseInt(e.target.value) || 0)}
                            className="w-full border rounded px-2 py-1.5 text-xs focus:outline-none text-right"
                            style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
                        </td>
                        <td className="py-2 pr-2 text-right text-xs" style={{ color: 'var(--text)' }}>{formatRupiah(item.qty * item.hargaSatuan)}</td>
                        <td className="py-2 text-center">
                          {items.length > 1 && (
                            <button onClick={() => handleRemoveItem(item.id)} className="text-xs px-2 py-1 rounded" style={{ color: '#ef4444' }}>✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-3">
                <button onClick={handleAddItem} className="text-sm px-3 py-1.5 rounded border font-semibold"
                  style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}>+ Tambah Baris</button>
                <div className="flex items-center gap-3 px-3 py-2 rounded" style={{ background: 'var(--nav-active-bg)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Total:</span>
                  <span className="text-base font-bold" style={{ color: 'var(--brand)' }}>{formatRupiah(calculateTotal())}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Catatan</label>
              <textarea value={catatan} onChange={e => setCatatan(e.target.value)}
                placeholder="Catatan tambahan atau syarat pembayaran..." rows={2}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none resize-none"
                style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={resetForm} className="px-4 py-2 rounded text-sm font-semibold border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Batal</button>
              <button onClick={handleSaveInvoice} disabled={saving}
                className="px-5 py-2 rounded text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--brand)' }}>
                {saving ? 'Menyimpan...' : 'Simpan Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daftar Invoice */}
      <div className="card p-6">
        <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text)' }}>Daftar Invoice ({invoices.length})</h2>
        {loading ? (
          <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Memuat data...</div>
        ) : invoices.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-4xl mb-2">🧾</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Belum ada invoice. Klik "+ Buat Invoice Baru" untuk membuat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th className="pb-2 text-left font-semibold pr-3">No. Invoice</th>
                  <th className="pb-2 text-left font-semibold pr-3">Tanggal</th>
                  <th className="pb-2 text-left font-semibold pr-3">Pelanggan</th>
                  <th className="pb-2 text-right font-semibold pr-3">Total</th>
                  <th className="pb-2 text-center font-semibold pr-3">Status</th>
                  <th className="pb-2 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 pr-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{inv.nomor}</td>
                    <td className="py-3 pr-3" style={{ color: 'var(--text)' }}>{new Date(inv.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="py-3 pr-3 font-medium" style={{ color: 'var(--text)' }}>{inv.pelanggan}</td>
                    <td className="py-3 pr-3 text-right font-bold" style={{ color: 'var(--brand)' }}>{formatRupiah(inv.total)}</td>
                    <td className="py-3 pr-3 text-center">
                      <button onClick={() => handleToggleStatus(inv)}
                        className="text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer"
                        style={{ background: inv.status === 'lunas' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: inv.status === 'lunas' ? '#22c55e' : '#ef4444' }}>
                        {inv.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                      </button>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => setShowPreviewId(inv.id)}
                          className="text-xs px-3 py-1 rounded border font-semibold"
                          style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}>Lihat</button>
                        <button onClick={() => handleDeleteInvoice(inv.id)}
                          className="text-xs px-3 py-1 rounded border font-semibold"
                          style={{ borderColor: 'rgba(220,38,38,0.4)', color: '#dc2626' }}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Preview */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPreviewId(null)}>
          <div className="w-full max-w-2xl rounded-lg p-8 shadow-xl overflow-y-auto max-h-[90vh]"
            style={{ background: 'white', color: '#333' }} onClick={e => e.stopPropagation()}>

            {/* Header Invoice */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-start gap-4">
                {(previewInvoice as any).logo_url && (
                  <img src={(previewInvoice as any).logo_url} alt="Logo" className="w-16 h-16 object-contain rounded" />
                )}
                <div>
                  {(previewInvoice as any).nama_perusahaan && (
                    <p className="font-bold text-gray-800 text-lg">{(previewInvoice as any).nama_perusahaan}</p>
                  )}
                  {(previewInvoice as any).alamat_perusahaan && (
                    <p className="text-xs text-gray-500 whitespace-pre-line">{(previewInvoice as any).alamat_perusahaan}</p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
                <p className="text-sm text-gray-500 font-mono">{previewInvoice.nomor}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(previewInvoice.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {(previewInvoice as any).jatuh_tempo && (
                  <p className="text-xs text-gray-500">
                    Jatuh Tempo: {new Date((previewInvoice as any).jatuh_tempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Kepada</p>
              <p className="text-lg font-semibold">{previewInvoice.pelanggan}</p>
            </div>

            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left pb-2 text-gray-600">Deskripsi</th>
                  <th className="text-right pb-2 text-gray-600 w-16">Qty</th>
                  <th className="text-right pb-2 text-gray-600 w-32">Harga</th>
                  <th className="text-right pb-2 text-gray-600 w-32">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {previewInvoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2">{item.deskripsi}</td>
                    <td className="py-2 text-right">{item.qty}</td>
                    <td className="py-2 text-right">{formatRupiah(item.hargaSatuan)}</td>
                    <td className="py-2 text-right font-medium">{formatRupiah(item.qty * item.hargaSatuan)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-6">
              <div className="w-64">
                <div className="flex justify-between py-2 border-t-2 border-gray-800">
                  <span className="font-bold text-lg">TOTAL</span>
                  <span className="font-bold text-lg">{formatRupiah(previewInvoice.total)}</span>
                </div>
              </div>
            </div>

            {previewInvoice.catatan && (
              <div className="bg-gray-50 rounded p-3 mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Catatan</p>
                <p className="text-sm text-gray-600">{previewInvoice.catatan}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowPreviewId(null)} className="px-4 py-2 rounded text-sm font-semibold border border-gray-300 text-gray-600">Tutup</button>
              <button onClick={() => window.print()} className="px-4 py-2 rounded text-sm font-semibold text-white" style={{ background: 'var(--brand)' }}>🖨️ Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
