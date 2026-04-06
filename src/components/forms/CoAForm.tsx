'use client'

import { useState } from 'react'
import { tambahCoa } from '@/lib/actions/akuntansi'
import { rekomendasiAkun } from '@/lib/actions/rag'
import type { CoaSearchResult } from '@/types'

const KLASIFIKASI_OPTIONS = [
  { value: 1, label: '1 - Aset', saldo: 'debit' },
  { value: 2, label: '2 - Kewajiban', saldo: 'kredit' },
  { value: 3, label: '3 - Ekuitas', saldo: 'kredit' },
  { value: 4, label: '4 - Pendapatan', saldo: 'kredit' },
  { value: 5, label: '5 - HPP', saldo: 'debit' },
  { value: 6, label: '6 - Beban Operasional', saldo: 'debit' },
  { value: 7, label: '7 - Pendapatan Lain', saldo: 'kredit' },
  { value: 8, label: '8 - Beban Lain', saldo: 'debit' },
  { value: 9, label: '9 - Pajak', saldo: 'debit' },
]

export default function CoAForm() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [isErr, setIsErr] = useState(false)
  const [klasifikasi, setKlasifikasi] = useState(1)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const fd = new FormData(e.currentTarget)

    const klas = parseInt(fd.get('klasifikasi') as string) || 1
    const saldoNormal = KLASIFIKASI_OPTIONS.find(k => k.value === klas)?.saldo || 'debit'

    const result = await tambahCoa({
      kode: fd.get('kode') as string,
      nama: fd.get('nama') as string,
      tipe_akun: fd.get('tipe_akun') as any,
      klasifikasi: klas,
      saldo_normal: saldoNormal as any,
      parent_kode: (fd.get('parent_kode') as string) || undefined,
      is_kas: fd.get('is_kas') === 'true',
      deskripsi: fd.get('deskripsi') as string,
    })

    setIsErr(!!result.error)
    setMsg(result.error ?? 'Akun berhasil ditambahkan!')
    setLoading(false)
    if (!result.error) (e.target as HTMLFormElement).reset()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {msg && (
        <div className={`p-3 rounded-lg text-sm ${isErr ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700 font-semibold'}`}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kode Akun *</label>
          <input name="kode" required placeholder="1.1.11.001" className="input font-mono" pattern="\d\.\d\.\d{2}\.\d{3}" title="Format: X.X.XX.XXX" />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Format: X.X.XX.XXX</p>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Akun *</label>
          <input name="nama" required placeholder="contoh: Kas Utama (IDR)" className="input" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipe Akun *</label>
          <select name="tipe_akun" className="input">
            <option value="detail">Detail (Leaf)</option>
            <option value="sub_header">Sub-Header</option>
            <option value="header">Header</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Klasifikasi *</label>
          <select name="klasifikasi" className="input" value={klasifikasi} onChange={e => setKlasifikasi(parseInt(e.target.value))}>
            {KLASIFIKASI_OPTIONS.map(k => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Saldo Normal</label>
          <input
            type="text"
            readOnly
            value={KLASIFIKASI_OPTIONS.find(k => k.value === klasifikasi)?.saldo.toUpperCase() || 'DEBIT'}
            className="input bg-gray-50 font-semibold"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parent Kode</label>
          <input name="parent_kode" placeholder="1.1.00.000 (opsional)" className="input font-mono" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Akun Kas?</label>
          <select name="is_kas" className="input">
            <option value="false">Bukan Kas</option>
            <option value="true">Ya, Terkait Kas/Bank</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi (opsional)</label>
        <input name="deskripsi" placeholder="Keterangan singkat tentang akun ini" className="input" />
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Menyimpan...' : '+ Tambah Akun'}
      </button>
    </form>
  )
}
