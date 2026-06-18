'use client'

import { useState } from 'react'

export interface TxRow {
  tanggal: string
  kategori: string
  keterangan: string
  unit: string
  kas: string
  tipe: 'pemasukan' | 'pengeluaran'
  jumlah: number
}

interface Props {
  data: TxRow[]
  userName: string
  userEmail: string
}

export default function ExportPanel({ data, userName, userEmail }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [lampiran, setLampiran] = useState<'excel' | 'pdf'>('excel')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)

  // ── EXCEL ────────────────────────────────────────────────
  async function exportExcel() {
    const XLSX = await import('xlsx')
    const rows = data.map(d => ({
      Tanggal: d.tanggal,
      Kategori: d.kategori,
      Keterangan: d.keterangan,
      'Unit / Proyek': d.unit,
      Kas: d.kas,
      Tipe: d.tipe === 'pemasukan' ? 'Uang Masuk' : 'Uang Keluar',
      'Jumlah (Rp)': d.jumlah,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 14 }, { wch: 20 }, { wch: 35 }, { wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 16 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi')
    XLSX.writeFile(wb, `transaksi_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // ── PDF ──────────────────────────────────────────────────
  async function downloadPDF() {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFontSize(14)
    doc.setTextColor(27, 127, 90)
    doc.text('VALTO — Laporan Transaksi', 14, 14)
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, 14, 20)

    autoTable(doc, {
      startY: 25,
      head: [['Tanggal', 'Kategori', 'Keterangan', 'Unit/Proyek', 'Kas', 'Tipe', 'Jumlah (Rp)']],
      body: data.map(d => [
        d.tanggal,
        d.kategori,
        d.keterangan || '—',
        d.unit || '—',
        d.kas,
        d.tipe === 'pemasukan' ? 'Uang Masuk' : 'Uang Keluar',
        d.jumlah.toLocaleString('id-ID'),
      ]),
      headStyles: { fillColor: [27, 127, 90], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 255, 250] },
      didParseCell: (hookData: any) => {
        if (hookData.column.index === 5) {
          const val = hookData.cell.raw as string
          if (val === 'Uang Masuk') hookData.cell.styles.textColor = [22, 163, 74]
          if (val === 'Uang Keluar') hookData.cell.styles.textColor = [220, 38, 38]
        }
      },
    })

    doc.save(`transaksi_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  // ── Buat base64 attachment ────────────────────────────────
  async function buatAttachment(): Promise<{ base64: string; filename: string; mime: string }> {
    if (lampiran === 'excel') {
      const XLSX = await import('xlsx')
      const rows = data.map(d => ({
        Tanggal: d.tanggal,
        Kategori: d.kategori,
        Keterangan: d.keterangan,
        'Unit / Proyek': d.unit,
        Kas: d.kas,
        Tipe: d.tipe === 'pemasukan' ? 'Uang Masuk' : 'Uang Keluar',
        'Jumlah (Rp)': d.jumlah,
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Transaksi')
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
      return {
        base64,
        filename: `transaksi_${new Date().toISOString().slice(0, 10)}.xlsx`,
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    } else {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const doc = new jsPDF({ orientation: 'landscape' })
      doc.setFontSize(14)
      doc.setTextColor(27, 127, 90)
      doc.text('VALTO — Laporan Transaksi', 14, 14)
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, 14, 20)
      autoTable(doc, {
        startY: 25,
        head: [['Tanggal', 'Kategori', 'Keterangan', 'Unit/Proyek', 'Kas', 'Tipe', 'Jumlah (Rp)']],
        body: data.map(d => [
          d.tanggal, d.kategori, d.keterangan || '—', d.unit || '—', d.kas,
          d.tipe === 'pemasukan' ? 'Uang Masuk' : 'Uang Keluar',
          d.jumlah.toLocaleString('id-ID'),
        ]),
        headStyles: { fillColor: [27, 127, 90], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
      })
      const base64 = doc.output('datauristring').split(',')[1]
      return {
        base64,
        filename: `transaksi_${new Date().toISOString().slice(0, 10)}.pdf`,
        mime: 'application/pdf',
      }
    }
  }

  // ── KIRIM EMAIL ───────────────────────────────────────────
  async function handleKirimEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const fd = new FormData(e.currentTarget)

    const att = await buatAttachment()

    const res = await fetch('/api/kirim-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toName: fd.get('to_name'),
        toEmail: fd.get('to_email'),
        fromName: userName,
        fromEmail: userEmail,
        subjek: fd.get('subjek'),
        pesan: fd.get('pesan'),
        attachment: att,
      }),
    })

    const result = await res.json()
    setLoading(false)
    setIsErr(!result.ok)
    setMsg(result.ok ? 'Email berhasil dikirim!' : (result.error ?? 'Gagal mengirim email'))

    if (result.ok) {
      setTimeout(() => {
        setShowModal(false)
        setMsg('')
      }, 2000)
    }
  }

  return (
    <>
      {/* Tombol Export */}
      <div className="flex gap-2">
        <button
          onClick={exportExcel}
          className="btn-secondary text-sm flex items-center gap-1.5"
        >
          📊 Export Excel
        </button>
        <button
          onClick={downloadPDF}
          className="btn-secondary text-sm flex items-center gap-1.5"
        >
          📄 Download PDF
        </button>
        <button
          onClick={() => { setShowModal(true); setMsg('') }}
          className="btn-secondary text-sm flex items-center gap-1.5"
        >
          ✉️ Kirim Email
        </button>
      </div>

      {/* Modal Email */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl">
            {/* Header biru */}
            <div className="bg-[#1a5276] text-white px-6 py-4">
              <h2 className="text-base font-bold">Kirim Laporan via Email</h2>
            </div>

            <form onSubmit={handleKirimEmail} className="bg-[#1a5276]/90 px-6 py-5 space-y-4">
              {/* Dari / Ke */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">Dari *</label>
                  <input
                    readOnly
                    value={userName}
                    className="w-full rounded px-3 py-2 text-sm bg-white/90 text-gray-700 mb-2"
                  />
                  <input
                    readOnly
                    value={userEmail}
                    className="w-full rounded px-3 py-2 text-sm bg-white/90 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">Ke *</label>
                  <input
                    name="to_name"
                    required
                    placeholder="Nama Penerima"
                    className="w-full rounded px-3 py-2 text-sm bg-white/90 text-gray-700 mb-2 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                  <input
                    name="to_email"
                    type="email"
                    required
                    placeholder="Email Penerima"
                    className="w-full rounded px-3 py-2 text-sm bg-white/90 text-gray-700 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>
              </div>

              {/* Konten */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Konten Email *</label>
                <input
                  name="subjek"
                  required
                  placeholder="Subjek"
                  className="w-full rounded px-3 py-2 text-sm bg-white/90 text-gray-700 mb-2 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <textarea
                  name="pesan"
                  rows={4}
                  placeholder="Pesan Anda"
                  className="w-full rounded px-3 py-2 text-sm bg-white/90 text-gray-700 resize-y focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>

              {/* Lampiran */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-2">Lampiran</label>
                <div className="flex gap-5">
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input
                      type="radio"
                      name="lampiran"
                      value="excel"
                      checked={lampiran === 'excel'}
                      onChange={() => setLampiran('excel')}
                      className="accent-white"
                    />
                    Excel
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input
                      type="radio"
                      name="lampiran"
                      value="pdf"
                      checked={lampiran === 'pdf'}
                      onChange={() => setLampiran('pdf')}
                      className="accent-white"
                    />
                    PDF
                  </label>
                </div>
              </div>

              {/* Pesan status */}
              {msg && (
                <div className={`text-sm px-3 py-2 rounded font-medium ${isErr ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {msg}
                </div>
              )}

              {/* Tombol */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded bg-white text-gray-700 text-sm font-semibold hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded bg-white/20 border border-white text-white text-sm font-semibold hover:bg-white/30 flex items-center gap-2 disabled:opacity-60"
                >
                  ✉️ {loading ? 'Mengirim...' : 'Kirim Sekarang!'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
