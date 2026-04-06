import { getNeraca, getSaldoPerAkun } from '@/lib/actions/akuntansi'
import { formatRupiah } from '@/lib/utils'
import type { SaldoAkun } from '@/types'

export const revalidate = 0

function formatTgl() {
  return new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function AkunList({ items, emptyText }: { items: SaldoAkun[]; emptyText: string }) {
  if (items.length === 0) {
    return (
      <div className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        {emptyText}
      </div>
    )
  }
  return (
    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
      {items.map(akun => (
        <div key={akun.coa_id} className="flex items-center justify-between py-2.5 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0"
              style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
            >
              {akun.kode}
            </span>
            <span className="text-sm truncate" style={{ color: 'var(--text)' }}>
              {akun.nama}
            </span>
          </div>
          <span
            className="text-sm font-semibold font-mono flex-shrink-0 ml-3"
            style={{ color: akun.saldo >= 0 ? 'var(--text)' : 'var(--exp)' }}
          >
            {formatRupiah(Math.abs(akun.saldo))}
          </span>
        </div>
      ))}
    </div>
  )
}

export default async function NeracaPage() {
  const [neracaResult, saldoResult] = await Promise.all([
    getNeraca(),
    getSaldoPerAkun(),
  ])

  const neraca = neracaResult.data
  const allSaldo = saldoResult.data ?? []

  const asetAccounts = allSaldo.filter(a => a.klasifikasi === 1)
  const kewajibanAccounts = allSaldo.filter(a => a.klasifikasi === 2)
  const ekuitasAccounts = allSaldo.filter(a => a.klasifikasi === 3)

  const totalAset = neraca?.total_aset ?? asetAccounts.reduce((s, a) => s + a.saldo, 0)
  const totalKewajiban = neraca?.total_kewajiban ?? kewajibanAccounts.reduce((s, a) => s + a.saldo, 0)
  const totalEkuitas = neraca?.total_ekuitas ?? ekuitasAccounts.reduce((s, a) => s + a.saldo, 0)
  const isBalanced = neraca?.balanced ?? (totalAset === totalKewajiban + totalEkuitas)

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
          Neraca / Balance Sheet
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Posisi Keuangan Per Tanggal {formatTgl()}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4" style={{ borderLeft: '4px solid var(--brand)' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Total Aset
          </p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: 'var(--brand)' }}>
            {formatRupiah(totalAset)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {asetAccounts.length} akun aktif
          </p>
        </div>

        <div className="card p-4" style={{ borderLeft: '4px solid var(--exp)' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Total Kewajiban
          </p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: 'var(--exp)' }}>
            {formatRupiah(totalKewajiban)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {kewajibanAccounts.length} akun aktif
          </p>
        </div>

        <div className="card p-4" style={{ borderLeft: '4px solid var(--inc)' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Total Ekuitas
          </p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: 'var(--inc)' }}>
            {formatRupiah(totalEkuitas)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {ekuitasAccounts.length} akun aktif
          </p>
        </div>
      </div>

      {/* Balance Indicator */}
      <div
        className="p-3 rounded-lg flex items-center justify-between"
        style={{
          background: isBalanced ? 'rgba(22,163,106,0.08)' : 'rgba(220,38,38,0.08)',
          border: `1px solid ${isBalanced ? 'rgba(22,163,106,0.3)' : 'rgba(220,38,38,0.3)'}`,
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{isBalanced ? '✓' : '✗'}</span>
          <div>
            <span className={`text-sm font-bold ${isBalanced ? 'text-green-700' : 'text-red-600'}`}>
              {isBalanced ? 'NERACA SEIMBANG' : 'NERACA TIDAK SEIMBANG'}
            </span>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Aset ({formatRupiah(totalAset)}) = Kewajiban ({formatRupiah(totalKewajiban)}) + Ekuitas ({formatRupiah(totalEkuitas)})
            </p>
          </div>
        </div>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{
            background: isBalanced ? 'rgba(22,163,106,0.15)' : 'rgba(220,38,38,0.15)',
            color: isBalanced ? '#16a34a' : '#dc2626',
          }}
        >
          A = K + E
        </span>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Left: ASET */}
        <div className="card p-5">
          <div className="section-header">
            <h3 className="section-title">ASET</h3>
            <span className="text-sm font-bold font-mono" style={{ color: 'var(--brand)' }}>
              {formatRupiah(totalAset)}
            </span>
          </div>

          <div className="mt-3">
            <AkunList items={asetAccounts} emptyText="Belum ada saldo di akun aset" />
          </div>

          <div
            className="flex items-center justify-between mt-3 pt-3"
            style={{ borderTop: '2px solid var(--border)' }}
          >
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Total Aset</span>
            <span className="text-base font-bold font-mono" style={{ color: 'var(--brand)' }}>
              {formatRupiah(totalAset)}
            </span>
          </div>
        </div>

        {/* Right: KEWAJIBAN & EKUITAS */}
        <div className="space-y-5">

          {/* Kewajiban */}
          <div className="card p-5">
            <div className="section-header">
              <h3 className="section-title">KEWAJIBAN</h3>
              <span className="text-sm font-bold font-mono" style={{ color: 'var(--exp)' }}>
                {formatRupiah(totalKewajiban)}
              </span>
            </div>
            <div className="mt-3">
              <AkunList items={kewajibanAccounts} emptyText="Belum ada saldo di akun kewajiban" />
            </div>
            <div
              className="flex items-center justify-between mt-3 pt-3"
              style={{ borderTop: '2px solid var(--border)' }}
            >
              <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Total Kewajiban</span>
              <span className="text-sm font-bold font-mono" style={{ color: 'var(--exp)' }}>
                {formatRupiah(totalKewajiban)}
              </span>
            </div>
          </div>

          {/* Ekuitas */}
          <div className="card p-5">
            <div className="section-header">
              <h3 className="section-title">EKUITAS</h3>
              <span className="text-sm font-bold font-mono" style={{ color: 'var(--inc)' }}>
                {formatRupiah(totalEkuitas)}
              </span>
            </div>
            <div className="mt-3">
              <AkunList items={ekuitasAccounts} emptyText="Belum ada saldo di akun ekuitas" />
            </div>
            <div
              className="flex items-center justify-between mt-3 pt-3"
              style={{ borderTop: '2px solid var(--border)' }}
            >
              <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Total Ekuitas</span>
              <span className="text-sm font-bold font-mono" style={{ color: 'var(--inc)' }}>
                {formatRupiah(totalEkuitas)}
              </span>
            </div>
          </div>

          {/* Combined Total K + E */}
          <div
            className="card p-4 flex items-center justify-between"
            style={{
              background: isBalanced ? 'rgba(22,163,106,0.06)' : 'rgba(220,38,38,0.06)',
              border: `1px solid ${isBalanced ? 'rgba(22,163,106,0.2)' : 'rgba(220,38,38,0.2)'}`,
            }}
          >
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              Total Kewajiban + Ekuitas
            </span>
            <span
              className="text-base font-bold font-mono"
              style={{ color: isBalanced ? '#16a34a' : '#dc2626' }}
            >
              {formatRupiah(totalKewajiban + totalEkuitas)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Summary */}
      <div
        className="card p-5"
        style={{ background: isBalanced ? 'rgba(22,163,106,0.04)' : 'rgba(220,38,38,0.04)' }}
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Aset</p>
            <p className="text-lg font-bold font-mono mt-1" style={{ color: 'var(--brand)' }}>
              {formatRupiah(totalAset)}
            </p>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: isBalanced ? '#16a34a' : '#dc2626' }}>
              =
            </span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Kewajiban + Ekuitas</p>
            <p className="text-lg font-bold font-mono mt-1" style={{ color: isBalanced ? '#16a34a' : '#dc2626' }}>
              {formatRupiah(totalKewajiban + totalEkuitas)}
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
