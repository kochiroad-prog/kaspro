'use client'

import { useState, useEffect } from 'react'
import { tambahJurnalMemorial } from '@/lib/actions/akuntansi'
import { getCoa } from '@/lib/actions/akuntansi'
import { rekomendasiAkun } from '@/lib/actions/rag'
import type { ChartOfAccounts, JurnalDetailInput, CoaSearchResult } from '@/types'

interface DetailRow {
  coa_id: string
  kode_akun: string
  nama_akun: string
  debit: number
  kredit: number
  keterangan: string
}

const emptyRow = (): DetailRow => ({
  coa_id: '', kode_akun: '', nama_akun: '', debit: 0, kredit: 0, keterangan: '',
})

export default function JurnalMemorialForm() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [keterangan, setKeterangan] = useState('')
  const [reff, setReff] = useState('')
  const [rows, setRows] = useState<DetailRow[]>([emptyRow(), emptyRow()])

  // Data
  const [coaList, setCoaList] = useState<ChartOfAccounts[]>([])
  const [suggestions, setSuggestions] = useState<CoaSearchResult[]>([])
  const [activeSearchRow, setActiveSearchRow] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadData() {
      const coaRes = await getCoa({ tipe_akun: 'detail', aktif: true })
      setCoaList(coaRes.data ?? [])
    }
    loadData()
  }, [])

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0)
  const totalKredit = rows.reduce((s, r) => s + r.kredit, 0)
  const isBalanced = totalDebit === totalKredit && totalDebit > 0

  function updateRow(idx: number, field: keyof DetailRow, value: any) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  function selectCoa(idx: number, coa: ChartOfAccounts | CoaSearchResult) {
    const kode = 'kode_akun' in coa ? (coa as any).kode : coa.kode
    const nama = 'nama_akun' in coa ? (coa as any).nama : coa.nama
    const id = 'coa_id' in coa ? (coa as CoaSearchResult).coa_id : (coa as ChartOfAccounts).id
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, coa_id: id, kode_akun: kode, nama_akun: nama } : r))
    setActiveSearchRow(null)
    setSuggestions([])
    setSearchQuery('')
  }

  function addRow() {
    setRows(prev => [...prev, emptyRow()])
  }

  function removeRow(idx: number) {
    if (rows.length <= 2) return
    setRows(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSearch(query: string, rowIdx: number) {
    setSearchQuery(query)
    setActiveSearchRow(rowIdx)
    if (query.length < 2) {
      setSuggestions([])
      return
    }
    const result = await rekomendasiAkun(query)
    setSuggestions(result.data ?? [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isBalanced) {
      setIsErr(true)
      setMsg(`Jurnal tidak seimbang: Debit ${totalDebit.toLocaleString()} != Kredit ${totalKredit.toLocaleString()}`)
      return
    }
    setLoading(true)
    setMsg('')

    const validRows = rows.filter(r => r.coa_id && (r.debit > 0 || r.kredit > 0))
    if (validRows.length < 2) {
      setIsErr(true)
      setMsg('Minimal 2 baris jurnal dengan akun dan nominal')
      setLoading(false)
      return
    }

    const result = await tambahJurnalMemorial({
      tanggal,
      keterangan,
      reff,
      details: validRows.map(r => ({
        coa_id: r.coa_id,
        kode_akun: r.kode_akun,
        nama_akun: r.nama_akun,
        debit: r.debit,
        kredit: r.kredit,
        keterangan: r.keterangan,
        kode_kas: 'kosongan', // default, kolom dihapus dari UI
      })),
    })

    setIsErr(!!result.error)
    setMsg(result.error ?? `Jurnal ${result.data?.nomor} berhasil dibuat!`)
    setLoading(false)

    if (!result.error) {
      setKeterangan('')
      setReff('')
      setRows([emptyRow(), emptyRow()])
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {msg && (
        <div className={`p-3 rounded-lg text-sm ${isErr ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700 font-semibold'}`}>
          {msg}
        </div>
      )}

      {/* Header fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal *</label>
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Referensi (Reff)</label>
          <input value={reff} onChange={e => setReff(e.target.value)} placeholder="No. Dokumen Internal" className="input" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Keterangan *</label>
          <input value={keterangan} onChange={e => setKeterangan(e.target.value)} required placeholder="Deskripsi jurnal" className="input" />
        </div>
      </div>

      {/* Detail rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Detail Jurnal</p>
          <button type="button" onClick={addRow} className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>
            + Tambah Baris
          </button>
        </div>

        {/* Header */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
          <div className="col-span-5">Kode Akun / Nama</div>
          <div className="col-span-2 text-right">Debit (Rp)</div>
          <div className="col-span-2 text-right">Kredit (Rp)</div>
          <div className="col-span-2">Keterangan</div>
          <div className="col-span-1"></div>
        </div>

        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start p-2 rounded-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            {/* Account selector with AI search */}
            <div className="col-span-5 relative">
              {row.coa_id ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--brand)', color: '#fff' }}>{row.kode_akun}</span>
                  <span className="text-sm truncate">{row.nama_akun}</span>
                  <button type="button" onClick={() => updateRow(idx, 'coa_id', '')} className="text-xs text-red-500 ml-auto">x</button>
                </div>
              ) : (
                <>
                  <input
                    placeholder="Cari akun... (ketik: sewa, listrik, dll)"
                    className="input text-sm"
                    value={activeSearchRow === idx ? searchQuery : ''}
                    onChange={e => handleSearch(e.target.value, idx)}
                    onFocus={() => setActiveSearchRow(idx)}
                  />
                  {activeSearchRow === idx && suggestions.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg shadow-lg overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                      {suggestions.map(s => (
                        <button
                          key={s.coa_id}
                          type="button"
                          onClick={() => selectCoa(idx, s)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm transition-colors"
                        >
                          <span className="font-mono text-xs px-1 py-0.5 rounded bg-gray-200">{s.kode}</span>
                          <span>{s.nama}</span>
                          {s.similarity >= 0.8 && <span className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--brand)', color: '#fff' }}>AI</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Manual select fallback */}
                  {activeSearchRow !== idx && (
                    <select className="input text-sm mt-1" value="" onChange={e => {
                      const coa = coaList.find(c => c.id === e.target.value)
                      if (coa) selectCoa(idx, coa)
                    }}>
                      <option value="">-- Pilih Manual --</option>
                      {coaList.map(c => (
                        <option key={c.id} value={c.id}>{c.kode} - {c.nama}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>

            {/* Debit */}
            <div className="col-span-2">
              <input
                type="number" min="0" placeholder="0"
                className="input text-right text-sm"
                value={row.debit || ''}
                onChange={e => {
                  const val = parseInt(e.target.value) || 0
                  updateRow(idx, 'debit', val)
                  if (val > 0) updateRow(idx, 'kredit', 0)
                }}
              />
            </div>

            {/* Kredit */}
            <div className="col-span-2">
              <input
                type="number" min="0" placeholder="0"
                className="input text-right text-sm"
                value={row.kredit || ''}
                onChange={e => {
                  const val = parseInt(e.target.value) || 0
                  updateRow(idx, 'kredit', val)
                  if (val > 0) updateRow(idx, 'debit', 0)
                }}
              />
            </div>

            {/* Keterangan */}
            <div className="col-span-2">
              <input
                placeholder="Keterangan..."
                className="input text-sm"
                value={row.keterangan}
                onChange={e => updateRow(idx, 'keterangan', e.target.value)}
              />
            </div>

            {/* Remove */}
            <div className="col-span-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeRow(idx)}
                disabled={rows.length <= 2}
                className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: isBalanced ? 'rgba(22,163,106,0.08)' : 'rgba(220,38,38,0.08)', border: `1px solid ${isBalanced ? 'rgba(22,163,106,0.3)' : 'rgba(220,38,38,0.3)'}` }}>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-bold ${isBalanced ? 'text-green-700' : 'text-red-600'}`}>
            {isBalanced ? 'SEIMBANG' : 'TIDAK SEIMBANG'}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Selisih: Rp {Math.abs(totalDebit - totalKredit).toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex gap-6 text-sm font-semibold">
          <span>Total Debit: <span className="font-mono">Rp {totalDebit.toLocaleString('id-ID')}</span></span>
          <span>Total Kredit: <span className="font-mono">Rp {totalKredit.toLocaleString('id-ID')}</span></span>
        </div>
      </div>

      {/* Submit */}
      <button type="submit" disabled={loading || !isBalanced} className="btn-primary disabled:opacity-50">
        {loading ? 'Menyimpan...' : 'Simpan Jurnal Memorial'}
      </button>
    </form>
  )
}
