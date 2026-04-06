import { getLabaRugi } from '@/lib/actions/akuntansi'
import { formatRupiah, awalBulan, akhirBulan } from '@/lib/utils'

export const revalidate = 0

function currentMonthLabel() {
  return new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

function PLRow({ label, value, color, indent = false, bold = false }: {
  label: string
  value: number
  color: string
  indent?: boolean
  bold?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 ${indent ? 'pl-4' : ''}`}
      style={{ color: 'var(--text)' }}
    >
      <span className={`text-sm ${bold ? 'font-bold' : ''}`}>{label}</span>
      <span className={`text-sm font-mono ${bold ? 'font-bold' : 'font-semibold'}`} style={{ color }}>
        {value < 0 ? `(${formatRupiah(Math.abs(value))})` : formatRupiah(value)}
      </span>
    </div>
  )
}

function PLSubtotal({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center justify-between py-3 px-4 rounded-lg my-2"
      style={{
        background: value >= 0 ? 'rgba(22,163,106,0.06)' : 'rgba(220,38,38,0.06)',
        borderLeft: `3px solid ${color}`,
      }}
    >
      <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{label}</span>
      <span className="text-base font-bold font-mono" style={{ color }}>
        {value < 0 ? `(${formatRupiah(Math.abs(value))})` : formatRupiah(value)}
      </span>
    </div>
  )
}

function PLSectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className="pt-4 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{title}</h3>
    </div>
  )
}

export default async function LabaRugiPage() {
  const result = await getLabaRugi(awalBulan(), akhirBulan())
  const pl = result.data

  const pendapatan = pl?.pendapatan ?? 0
  const hpp = pl?.hpp ?? 0
  const labaKotor = pl?.laba_kotor ?? (pendapatan - hpp)
  const bebanOps = pl?.beban_operasional ?? 0
  const labaOps = pl?.laba_operasional ?? (labaKotor - bebanOps)
  const pendapatanLain = pl?.pendapatan_lain ?? 0
  const bebanLain = pl?.beban_lain ?? 0
  const labaBersih = pl?.laba_bersih ?? (labaOps + pendapatanLain - bebanLain)

  const isProfit = labaBersih >= 0

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
          Laba Rugi / Income Statement
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Periode Bulan {currentMonthLabel()}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4" style={{ borderLeft: '4px solid var(--inc)' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Pendapatan</p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: 'var(--inc)' }}>
            {formatRupiah(pendapatan)}
          </p>
        </div>
        <div className="card p-4" style={{ borderLeft: '4px solid var(--exp)' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Beban</p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: 'var(--exp)' }}>
            {formatRupiah(hpp + bebanOps + bebanLain)}
          </p>
        </div>
        <div className="card p-4" style={{ borderLeft: `4px solid ${isProfit ? 'var(--inc)' : 'var(--exp)'}` }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Laba Bersih</p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: isProfit ? 'var(--inc)' : 'var(--exp)' }}>
            {labaBersih < 0 ? `(${formatRupiah(Math.abs(labaBersih))})` : formatRupiah(labaBersih)}
          </p>
        </div>
      </div>

      {/* Main P&L Statement */}
      <div className="card p-6">

        {/* PENDAPATAN */}
        <PLSectionHeader title="Pendapatan" color="var(--inc)" />
        <PLRow label="Pendapatan Usaha" value={pendapatan} color="var(--inc)" indent />

        {/* HPP */}
        <PLSectionHeader title="Harga Pokok Penjualan" color="var(--exp)" />
        <PLRow label="HPP Barang / Jasa" value={-hpp} color="var(--exp)" indent />

        {/* LABA KOTOR */}
        <PLSubtotal label="LABA KOTOR" value={labaKotor} color={labaKotor >= 0 ? 'var(--inc)' : 'var(--exp)'} />

        {/* BEBAN OPERASIONAL */}
        <PLSectionHeader title="Beban Operasional" color="var(--exp)" />
        <PLRow label="Total Beban Operasional" value={-bebanOps} color="var(--exp)" indent />

        {/* LABA OPERASIONAL */}
        <PLSubtotal label="LABA OPERASIONAL" value={labaOps} color={labaOps >= 0 ? 'var(--inc)' : 'var(--exp)'} />

        {/* PENDAPATAN LAIN-LAIN */}
        <PLSectionHeader title="Pendapatan Lain-Lain" color="var(--inc)" />
        <PLRow label="Pendapatan Non-Operasional" value={pendapatanLain} color="var(--inc)" indent />

        {/* BEBAN LAIN-LAIN */}
        <PLSectionHeader title="Beban Lain-Lain" color="var(--exp)" />
        <PLRow label="Beban Non-Operasional" value={-bebanLain} color="var(--exp)" indent />

        {/* LABA BERSIH — Highlighted */}
        <div className="mt-6">
          <div
            className="flex items-center justify-between py-5 px-5 rounded-lg"
            style={{
              background: isProfit ? 'rgba(22,163,106,0.1)' : 'rgba(220,38,38,0.1)',
              border: `2px solid ${isProfit ? 'rgba(22,163,106,0.3)' : 'rgba(220,38,38,0.3)'}`,
            }}
          >
            <div>
              <span className="text-base font-bold" style={{ color: 'var(--text)' }}>
                LABA BERSIH
              </span>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Pendapatan - HPP - Beban Ops + Pend. Lain - Beban Lain
              </p>
            </div>
            <span
              className="text-2xl font-bold font-mono"
              style={{ color: isProfit ? 'var(--inc)' : 'var(--exp)' }}
            >
              {labaBersih < 0 ? `(${formatRupiah(Math.abs(labaBersih))})` : formatRupiah(labaBersih)}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 text-center">
          <span
            className="text-xs font-bold px-4 py-1.5 rounded-full"
            style={{
              background: isProfit ? 'rgba(22,163,106,0.1)' : 'rgba(220,38,38,0.1)',
              color: isProfit ? '#16a34a' : '#dc2626',
            }}
          >
            {isProfit ? '✓ Perusahaan Menguntungkan' : '✗ Perusahaan Mengalami Kerugian'}
          </span>
        </div>

      </div>

    </div>
  )
}
