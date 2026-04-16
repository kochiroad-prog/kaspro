'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getInvoice, tambahInvoice, hapusInvoice, updateStatusInvoice,
  type Invoice, type InvoiceItem,
} from '@/lib/actions/invoice'

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}

function generateInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `INV-${year}${month}${day}-${random}`
}

export default function EInvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)
  const [showPreviewId, setShowPreviewId] = useState<string | null>(null)

  // Form state
  const [nomorInvoice, setNomorInvoice] = useState(generateInvoiceNumber())
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [pelanggan, setPelanggan] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', deskripsi: '', qty: 1, hargaSatuan: 0 }])
  const [catatan, setCatatan] = useState('')

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

  function handleAddItem() {
    setItems(prev => [...prev, { id: String(Date.now()), deskripsi: '', qty: 1, hargaSatuan: 0 }])
  }

  function handleRemoveItem(id: string) {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  function handleItemChange(id: string, field: string, value: string | number) {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  function calculateTotal(): number {
    return items.reduce((sum, item) => sum + (item.qty * item.hargaSatuan), 0)
  }

  function resetForm() {
    setNomorInvoice(generateInvoiceNumber())
    setTanggal(new Date().toISOString().split('T')[0])
    setPelanggan('')
    setItems([{ id: '1', deskripsi: '', qty: 1, hargaSatuan: 0 }])
    setCatatan('')
    setShowForm(false)
    setMsg('')
  }

  async function handleSaveInvoice() {
    if (!pelanggan.trim()) { setMsg('Nama pelanggan wajib diisi'); setIsErr(true); return }
    if (items.some(i => !i.deskripsi.trim() || i.qty <= 0 || i.hargaSatuan <= 0)) {
      setMsg('Semua item harus diisi lengkap'); setIsErr(true); return
    }

    setSaving(true); setMsg('')
    try {
      const total = calculateTotal()
      const res = await tambahInvoice({ nomor: nomorInvoice, tanggal, pelanggan, items, total, catatan })
      setIsErr(!!res.error)
      if (res.error) {
        setMsg(res.error)
      } else {
        await load()
        resetForm()
      }
    } catch (e) {
      setIsErr(true)
      setMsg('Gagal menyimpan invoice. Pastikan SQL migration sudah dijalankan di Supabase.')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteInvoice(id: string) {
    if (!confirm('Hapus invoice ini?')) return
    try {
      const res = await hapusInvoice(id)
      if (res.error) { alert(res.error); return }
      setInvoices(prev => prev.filter(inv => inv.id !== id))
    } catch (e) {
      console.error('Gagal hapus invoice:', e)
    }
  }

  async function handleToggleStatus(inv: Invoice) {
    const newStatus = inv.status === 'lunas' ? 'belum_lunas' : 'lunas'
    try {
      await updateStatusInvoice(inv.id, newStatus)
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: newStatus } : i))
    } catch (e) {
      console.error('Gagal update status invoice:', e)
    }
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
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded text-sm font-semibold text-white"
            style={{ background: 'var(--brand)' }}
          >
            + Buat Invoice Baru
          </button>
        )}
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Buat Invoice Baru</h2>
            <button onClick={resetForm} className="text-sm" style={{ color: 'var(--text-muted)' }}>✕ Tutup</button>
          </div>

          {msg && (
            <div className={`mb-4 p-3 rounded text-sm ${isErr ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {msg}
            </div>
          )}

          <div className="space-y-4">
            {/* Row 1: Nomor & Tanggal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Nomor Invoice</label>
                <input
                  type="text" value={nomorInvoice} disabled
                  className="w-full border rounded px-3 py-2 text-sm cursor-not-allowed"
                  style={{ borderColor: 'var(--border)', background: 'var(--nav-active-bg)', color: 'var(--text-muted)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Tanggal</label>
                <input
                  type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                />
              </div>
            </div>

            {/* Pelanggan */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Pelanggan *</label>
              <input
                type="text" value={pelanggan} onChange={e => setPelanggan(e.target.value)}
                placeholder="Nama pelanggan atau perusahaan"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
              />
            </div>

            {/* Items Table */}
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
                      <th className="pb-2 text-center w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => {
                      const subtotal = item.qty * item.hargaSatuan
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="py-2 pr-2">
                            <input
                              type="text" value={item.deskripsi}
                              onChange={e => handleItemChange(item.id, 'deskripsi', e.target.value)}
                              placeholder="Deskripsi item"
                              className="w-full border rounded px-2 py-1.5 text-xs focus:outline-none"
                              style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number" min="1" value={item.qty}
                              onChange={e => handleItemChange(item.id, 'qty', parseInt(e.target.value) || 0)}
                              className="w-full border rounded px-2 py-1.5 text-xs focus:outline-none text-right"
                              style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number" min="0" value={item.hargaSatuan}
                              onChange={e => handleItemChange(item.id, 'hargaSatuan', parseInt(e.target.value) || 0)}
                              className="w-full border rounded px-2 py-1.5 text-xs focus:outline-none text-right"
                              style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                            />
                          </td>
                          <td className="py-2 pr-2 text-right text-xs" style={{ color: 'var(--text)' }}>{formatRupiah(subtotal)}</td>
                          <td className="py-2 text-center">
                            {items.length > 1 && (
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-xs px-2 py-1 rounded border"
                                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                              >✕</button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={handleAddItem}
                  className="text-sm px-3 py-1.5 rounded border font-semibold"
                  style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}
                >
                  + Tambah Baris
                </button>
                <div className="flex items-center gap-3 px-3 py-2 rounded" style={{ background: 'var(--nav-active-bg)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Total:</span>
                  <span className="text-base font-bold" style={{ color: 'var(--brand)' }}>{formatRupiah(calculateTotal())}</span>
                </div>
              </div>
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Catatan</label>
              <textarea
                value={catatan} onChange={e => setCatatan(e.target.value)}
                placeholder="Catatan tambahan atau syarat pembayaran..."
                rows={2}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none resize-none"
                style={{ borderColor: 'var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
              />
            </div>

            {/* Buttons */}
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
        <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text)' }}>
          Daftar Invoice ({invoices.length})
        </h2>

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
                    <td className="py-3 pr-3" style={{ color: 'var(--text)' }}>
                      {new Date(inv.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 pr-3 font-medium" style={{ color: 'var(--text)' }}>{inv.pelanggan}</td>
                    <td className="py-3 pr-3 text-right font-bold" style={{ color: 'var(--brand)' }}>
                      {formatRupiah(inv.total)}
                    </td>
                    <td className="py-3 pr-3 text-center">
                      <button
                        onClick={() => handleToggleStatus(inv)}
                        className="text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer"
                        style={{
                          background: inv.status === 'lunas' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          color: inv.status === 'lunas' ? '#22c55e' : '#ef4444'
                        }}
                      >
                        {inv.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                      </button>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setShowPreviewId(inv.id)}
                          className="text-xs px-3 py-1 rounded border font-semibold"
                          style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}
                        >Lihat</button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="text-xs px-3 py-1 rounded border font-semibold"
                          style={{ borderColor: 'rgba(220,38,38,0.4)', color: '#dc2626' }}
                        >Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Preview Invoice */}
      {previewInvoice && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreviewId(null)}
        >
          <div
            className="w-full max-w-2xl rounded-lg p-8 shadow-xl overflow-y-auto max-h-[90vh]"
            style={{ background: 'white', color: '#333' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header Invoice */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
                <p className="text-sm text-gray-500 mt-1 font-mono">{previewInvoice.nomor}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Tanggal</p>
                <p className="font-semibold">{new Date(previewInvoice.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Pelanggan */}
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Kepada</p>
              <p className="text-lg font-semibold">{previewInvoice.pelanggan}</p>
            </div>

            {/* Items */}
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

            {/* Total */}
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
              <button
                onClick={() => setShowPreviewId(null)}
                className="px-4 py-2 rounded text-sm font-semibold border border-gray-300 text-gray-600"
              >Tutup</button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded text-sm font-semibold text-white"
                style={{ background: 'var(--brand)' }}
              >🖨️ Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
