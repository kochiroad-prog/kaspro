'use client'

import { useState, useEffect, useRef } from 'react'
import { tambahTransaksi } from '@/lib/actions/transaksi'
import { getKas, getKategori, getUnitBisnis, getProyek } from '@/lib/actions/index'
import { getCoaDetail } from '@/lib/actions/akuntansi'
import { rekomendasiAkun } from '@/lib/actions/rag'
import { hariIni, jamSekarang } from '@/lib/utils'
import WaktuPicker from '@/components/ui/WaktuPicker'
import type { Kas, Kategori, UnitBisnis, Proyek, TipeTransaksi, ChartOfAccounts, CoaSearchResult } from '@/types'

export default function AddTxButton() {
  const [open, setOpen] = useState(false)
  const [tipe, setTipe] = useState<TipeTransaksi>('pemasukan')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [nominalDisplay, setNominalDisplay] = useState('')

  const [kasList, setKasList] = useState<Kas[]>([])
  const [katList, setKatList] = useState<Kategori[]>([])
  const [unitList, setUnitList] = useState<UnitBisnis[]>([])
  const [proyekList, setProyekList] = useState<Proyek[]>([])
  const [coaList, setCoaList] = useState<ChartOfAccounts[]>([])
  const [selectedCoaId, setSelectedCoaId] = useState('')
  const [coaSuggestions, setCoaSuggestions] = useState<CoaSearchResult[]>([])
  const [showCoaSearch, setShowCoaSearch] = useState(false)

  const [aiCoaLoading, setAiCoaLoading] = useState(false)
  const [aiCoaSuggested, setAiCoaSuggested] = useState(false)
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function formatNominal(val: string): string {
    const digits = val.replace(/\D/g, '')
    if (!digits) return ''
    return parseInt(digits).toLocaleString('id-ID')
  }

  function resetForm() {
    setOpen(false)
    setNominalDisplay('')
    setSelectedCoaId('')
    setAiCoaSuggested(false)
    setError('')
    setSuccess('')
  }

  useEffect(() => {
    if (open) {
      setSelectedCoaId('')
      setAiCoaSuggested(false)
      Promise.all([getKas(), getKategori(), getUnitBisnis(), getProyek(), getCoaDetail()]).then(
        ([k, kat, u, p, coa]) => {
          setKasList(k.data ?? [])
          setKatList((kat.data ?? []).filter((c: Kategori) => c.tipe === tipe))
          setUnitList(u.data ?? [])
          setProyekList(p.data ?? [])
          setCoaList(coa.data ?? [])
        }
      )
    }
  }, [open, tipe])

  async function handleCatatanChange(catatan: string) {
    if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current)
    if (catatan.length < 3 || coaList.length === 0) return
    aiDebounceRef.current = setTimeout(async () => {
      setAiCoaLoading(true)
      try {
        const res = await fetch('/api/ai/saran-coa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ catatan, tipe, coaList }),
        })
        const data = await res.json()
        if (data.coa_id && !selectedCoaId) {
          setSelectedCoaId(data.coa_id)
          setAiCoaSuggested(true)
        }
      } catch {}
      setAiCoaLoading(false)
    }, 900)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const result = await tambahTransaksi({
      tipe,
      kas_id: fd.get('kas_id') as string,
      kategori_id: fd.get('kategori_id') as string,
      unit_bisnis_id: (fd.get('unit_bisnis_id') as string) || undefined,
      proyek_id: (fd.get('proyek_id') as string) || undefined,
      jumlah: parseInt((fd.get('jumlah') as string).replace(/\D/g, '')) || 0,
      catatan: fd.get('catatan') as string,
      tanggal: fd.get('tanggal') as string,
      waktu: (fd.get('waktu') as string) || null,
    })
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess('Transaksi berhasil disimpan!')
      setTimeout(() => resetForm(), 1200)
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setNominalDisplay('') }}
        className="btn-primary"
      >
        <span className="text-lg leading-none">+</span>
        Tambah Transaksi
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-[60] md:p-4"
          onClick={e => e.target === e.currentTarget && resetForm()}
        >
          {/* Sheet — flex column agar footer bisa sticky */}
          <div
            className="w-full md:max-w-md flex flex-col shadow-xl"
            style={{
              background: 'var(--surface)',
              borderRadius: '20px 20px 0 0',
              maxHeight: 'calc(92vh - env(safe-area-inset-bottom, 0px))',
            }}
          >
            {/* Handle bar (mobile only) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                Tambah Transaksi
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="text-xl leading-none"
                style={{ color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {/* Form: flex-col flex-1 overflow-hidden — kunci agar footer sticky */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 overflow-hidden min-h-0"
            >
              {/* Scrollable fields area */}
              <div className="overflow-y-auto flex-1 p-5">

                {/* Tipe Toggle */}
                <div
                  className="flex rounded-xl overflow-hidden mb-5"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <button
                    type="button"
                    onClick={() => setTipe('pemasukan')}
                    className="flex-1 py-3 text-sm font-bold transition-all"
                    style={{
                      background: tipe === 'pemasukan' ? 'rgba(22,163,74,0.08)' : 'transparent',
                      color: tipe === 'pemasukan' ? '#16a34a' : 'var(--text-muted)',
                    }}
                  >
                    💰 Uang Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipe('pengeluaran')}
                    className="flex-1 py-3 text-sm font-bold transition-all"
                    style={{
                      background: tipe === 'pengeluaran' ? 'rgba(220,38,38,0.08)' : 'transparent',
                      color: tipe === 'pengeluaran' ? '#dc2626' : 'var(--text-muted)',
                    }}
                  >
                    💸 Uang Keluar
                  </button>
                </div>

                {error && (
                  <div
                    className="mb-4 p-3 rounded-lg text-sm"
                    style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}
                  >
                    {error}
                  </div>
                )}
                {success && (
                  <div
                    className="mb-4 p-3 rounded-lg text-sm font-semibold"
                    style={{ background: 'rgba(22,163,74,0.08)', color: '#16a34a' }}
                  >
                    {success}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Jumlah */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1.5"
                      style={{ color: 'var(--text)' }}
                    >
                      Jumlah
                    </label>
                    <div className="relative">
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Rp
                      </span>
                      <input
                        name="jumlah"
                        type="text"
                        inputMode="numeric"
                        required
                        value={nominalDisplay}
                        onChange={e => setNominalDisplay(formatNominal(e.target.value))}
                        placeholder="0"
                        className="input pl-10 text-xl font-bold"
                      />
                    </div>
                  </div>

                  {/* Catatan — AI trigger di sini */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1.5"
                      style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      Catatan
                      {aiCoaLoading && (
                        <span
                          className="text-xs font-normal px-2 py-0.5 rounded-full animate-pulse"
                          style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                        >
                          AI memilih akun...
                        </span>
                      )}
                      {aiCoaSuggested && !aiCoaLoading && (
                        <span
                          className="text-xs font-normal px-2 py-0.5 rounded-full"
                          style={{ background: '#dcfce7', color: '#16a34a' }}
                        >
                          ✓ Akun CoA dipilih AI
                        </span>
                      )}
                    </label>
                    <input
                      name="catatan"
                      type="text"
                      placeholder="Ketik keterangan — AI akan rekomendasikan akun CoA"
                      className="input"
                      onChange={e => handleCatatanChange(e.target.value)}
                    />
                  </div>

                  {/* Kategori + Kas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: 'var(--text)' }}
                      >
                        Kategori
                      </label>
                      <select name="kategori_id" required className="input">
                        {katList.map(k => (
                          <option key={k.id} value={k.id}>
                            {k.ikon} {k.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: 'var(--text)' }}
                      >
                        Pilih Kas
                      </label>
                      <select name="kas_id" required className="input">
                        {kasList.map(k => (
                          <option key={k.id} value={k.id}>
                            {k.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tanggal + Jam */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
                        Tanggal
                      </label>
                      <input name="tanggal" type="date" defaultValue={hariIni()} required className="input" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
                        Jam
                      </label>
                      <WaktuPicker name="waktu" defaultValue={jamSekarang()} />
                    </div>
                  </div>

                  {/* Unit Bisnis + Proyek */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
                        Unit Bisnis
                      </label>
                      <select name="unit_bisnis_id" className="input">
                        <option value="">— Pilih unit —</option>
                        {unitList.map(u => (
                          <option key={u.id} value={u.id}>{u.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
                        Proyek
                      </label>
                      <select name="proyek_id" className="input">
                        <option value="">— Pilih proyek —</option>
                        {proyekList.map(p => (
                          <option key={p.id} value={p.id}>{p.nama}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Akun CoA — AI auto-select + manual search */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1.5"
                      style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      Akun CoA
                      <span
                        className="text-xs font-normal px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                      >
                        AI
                      </span>
                      <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                        opsional
                      </span>
                    </label>

                    {selectedCoaId ? (
                      <div className="flex items-center gap-2 input">
                        <span
                          className="font-mono text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}
                        >
                          {coaList.find(c => c.id === selectedCoaId)?.kode ??
                            coaSuggestions.find(s => s.coa_id === selectedCoaId)?.kode}
                        </span>
                        <span
                          className="text-sm flex-1 truncate"
                          style={{ color: 'var(--text)' }}
                        >
                          {coaList.find(c => c.id === selectedCoaId)?.nama ??
                            coaSuggestions.find(s => s.coa_id === selectedCoaId)?.nama}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setSelectedCoaId(''); setAiCoaSuggested(false) }}
                          className="text-xs"
                          style={{ color: 'var(--exp)' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          placeholder="Cari akun: sewa, listrik, gaji..."
                          className="input"
                          onChange={async e => {
                            const q = e.target.value
                            setShowCoaSearch(true)
                            if (q.length >= 2) {
                              const res = await rekomendasiAkun(q)
                              setCoaSuggestions(res.data ?? [])
                            } else {
                              setCoaSuggestions([])
                            }
                          }}
                          onFocus={() => setShowCoaSearch(true)}
                          onBlur={() => setTimeout(() => setShowCoaSearch(false), 200)}
                        />
                        {showCoaSearch && coaSuggestions.length > 0 && (
                          <div
                            className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg shadow-lg overflow-hidden"
                            style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            {coaSuggestions.slice(0, 6).map(s => (
                              <button
                                key={s.coa_id}
                                type="button"
                                onMouseDown={() => {
                                  setSelectedCoaId(s.coa_id)
                                  setShowCoaSearch(false)
                                }}
                                className="w-full text-left px-3 py-2.5 flex items-center gap-2 text-sm"
                                style={{ color: 'var(--text)' }}
                              >
                                <span
                                  className="font-mono text-xs px-1 py-0.5 rounded"
                                  style={{ background: 'var(--nav-active-bg)', color: 'var(--brand)' }}
                                >
                                  {s.kode}
                                </span>
                                <span className="truncate flex-1">{s.nama}</span>
                                {s.similarity >= 0.8 && (
                                  <span
                                    className="text-xs px-1.5 py-0.5 rounded"
                                    style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                                  >
                                    AI
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        <select
                          className="input mt-1.5 text-sm"
                          value=""
                          onChange={e => setSelectedCoaId(e.target.value)}
                        >
                          <option value="">— Pilih manual dari daftar —</option>
                          {coaList.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.kode} - {c.nama}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <input type="hidden" name="coa_id" value={selectedCoaId} />
                  </div>
                </div>
              </div>
              {/* END scrollable area */}

              {/* Sticky footer — ALWAYS visible, tidak pernah tertutup nav */}
              <div
                className="flex-shrink-0 px-5 py-4"
                style={{
                  borderTop: '1px solid var(--border)',
                  background: 'var(--surface)',
                  paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
                }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3.5 text-base font-bold"
                >
                  {loading ? 'Menyimpan...' : '✓ Simpan Transaksi'}
                </button>
              </div>

            </form>
            {/* END form */}

          </div>
          {/* END sheet */}
        </div>
      )}
    </>
  )
}
