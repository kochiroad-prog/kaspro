import { getDashboardStats } from '@/lib/actions/transaksi'
import { getTransaksi } from '@/lib/actions/transaksi'
import { getKas } from '@/lib/actions/index'
import { getDashboardStatsV2 } from '@/lib/actions/akuntansi'
import { formatRupiah } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import TxItem from '@/components/ui/TxItem'
import KasSaldoBar from '@/components/ui/KasSaldoBar'
import WeeklyChart from '@/components/charts/WeeklyChart'
import AddTxButton from '@/components/forms/AddTxButton'

export const revalidate = 0

export default async function DashboardPage() {
  // Reduced parallel queries: statsV2 already includes neraca & laba-rugi data
  const [statsV2, txResult, kasResult] = await Promise.all([
    getDashboardStatsV2(),
    getTransaksi({ limit: 5 }),
    getKas(),
  ])

  const s = statsV2 ?? {
    total_saldo: 0, pemasukan_hari_ini: 0, pengeluaran_hari_ini: 0,
    keuntungan_hari_ini: 0, pemasukan_bulan_ini: 0, pengeluaran_bulan_ini: 0,
    keuntungan_bulan_ini: 0, total_aset: 0, total_kewajiban: 0,
    total_ekuitas: 0, laba_bersih_bulan_ini: 0,
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Ringkasan keuangan usaha Anda</p>
        </div>
        <AddTxButton />
      </div>

      {/* Stat Cards — Kas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Semua Kas"
          value={formatRupiah(s.total_saldo)}
          sub={`${kasResult.data?.length ?? 0} rekening aktif`}
          color="brand"
          icon="💰"
        />
        <StatCard
          label="Uang Masuk Hari Ini"
          value={formatRupiah(s.pemasukan_hari_ini)}
          color="inc"
          icon="📈"
        />
        <StatCard
          label="Uang Keluar Hari Ini"
          value={formatRupiah(s.pengeluaran_hari_ini)}
          color="exp"
          icon="📉"
        />
        <StatCard
          label="Keuntungan Hari Ini"
          value={formatRupiah(s.keuntungan_hari_ini)}
          color={s.keuntungan_hari_ini >= 0 ? 'brand' : 'exp'}
          icon="💡"
        />
      </div>

      {/* V2.0 — Financial Health Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Aset"
          value={formatRupiah(s.total_aset)}
          sub="Dari Neraca (CoA 1)"
          color="brand"
          icon="🏦"
        />
        <StatCard
          label="Total Kewajiban"
          value={formatRupiah(s.total_kewajiban)}
          sub="Utang (CoA 2)"
          color="exp"
          icon="📋"
        />
        <StatCard
          label="Total Ekuitas"
          value={formatRupiah(s.total_ekuitas)}
          sub="Modal Pemilik (CoA 3)"
          color="inc"
          icon="🏛"
        />
        <StatCard
          label="Laba Bersih Bulan Ini"
          value={formatRupiah(s.laba_bersih_bulan_ini)}
          sub="Pendapatan - Beban"
          color={s.laba_bersih_bulan_ini >= 0 ? 'inc' : 'exp'}
          icon="📊"
        />
      </div>

      {/* V2.0 — Live Neraca & Laba Rugi Mini */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Mini Neraca */}
        <div className="card p-5">
          <div className="section-header">
            <h3 className="section-title">Neraca (Balance Sheet)</h3>
            <a href="/akuntansi/neraca" className="text-sm font-semibold hover:underline" style={{ color: 'var(--brand)' }}>
              Detail →
            </a>
          </div>
          <div className="space-y-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Aset</span>
              <span className="text-sm font-semibold font-mono">{formatRupiah(s.total_aset)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Kewajiban</span>
              <span className="text-sm font-semibold font-mono">{formatRupiah(s.total_kewajiban)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Ekuitas</span>
              <span className="text-sm font-semibold font-mono">{formatRupiah(s.total_ekuitas)}</span>
            </div>
            <div className="pt-2" style={{ borderTop: '2px solid var(--border)' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold" style={{ color: (s.total_aset === s.total_kewajiban + s.total_ekuitas) ? 'var(--inc)' : 'var(--exp)' }}>
                  {(s.total_aset === s.total_kewajiban + s.total_ekuitas) ? 'SEIMBANG' : 'TIDAK SEIMBANG'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                  background: (s.total_aset === s.total_kewajiban + s.total_ekuitas) ? 'rgba(22,163,106,0.1)' : 'rgba(220,38,38,0.1)',
                  color: (s.total_aset === s.total_kewajiban + s.total_ekuitas) ? 'var(--inc)' : 'var(--exp)',
                }}>
                  A = K + E
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Laba Rugi */}
        <div className="card p-5">
          <div className="section-header">
            <h3 className="section-title">Laba Rugi (P&amp;L) Bulan Ini</h3>
            <a href="/akuntansi/laba-rugi" className="text-sm font-semibold hover:underline" style={{ color: 'var(--brand)' }}>
              Detail →
            </a>
          </div>
          <div className="space-y-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Pendapatan Bulan Ini</span>
              <span className="text-sm font-semibold font-mono" style={{ color: 'var(--inc)' }}>{formatRupiah(s.pemasukan_bulan_ini)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Beban</span>
              <span className="text-sm font-semibold font-mono" style={{ color: 'var(--exp)' }}>({formatRupiah(s.pengeluaran_bulan_ini)})</span>
            </div>
            <div className="pt-2" style={{ borderTop: '2px solid var(--border)' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">Laba Bersih</span>
                <span className="text-base font-bold font-mono" style={{ color: s.laba_bersih_bulan_ini >= 0 ? 'var(--inc)' : 'var(--exp)' }}>
                  {formatRupiah(s.laba_bersih_bulan_ini)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts + Saldo */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 card p-5">
          <div className="section-header">
            <h3 className="section-title">Arus Kas 7 Hari Terakhir</h3>
          </div>
          <WeeklyChart />
        </div>
        <div className="lg:col-span-2 card p-5">
          <div className="section-header">
            <h3 className="section-title">Saldo Per Kas</h3>
          </div>
          <KasSaldoBar
            kasData={kasResult.data ?? []}
            totalSaldo={s.total_saldo}
          />
        </div>
      </div>

      {/* Transaksi Terakhir */}
      <div className="card p-5">
        <div className="section-header">
          <h3 className="section-title">Transaksi Terakhir</h3>
          <a href="/transaksi" className="text-sm text-[var(--brand)] font-semibold hover:underline">
            Lihat semua →
          </a>
        </div>
        <div className="divide-y divide-gray-50">
          {txResult.data && txResult.data.length > 0 ? (
            txResult.data.map(tx => <TxItem key={tx.id} tx={tx} />)
          ) : (
            <div className="py-12 text-center text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm">Belum ada transaksi</p>
              <p className="text-xs mt-1">Klik &quot;+ Tambah&quot; untuk mencatat transaksi pertama</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
