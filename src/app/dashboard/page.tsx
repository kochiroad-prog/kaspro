import { getDashboardStatsV2 } from '@/lib/actions/akuntansi'
import { getTransaksi } from '@/lib/actions/transaksi'
import { getKas, getProyek, getUnitBisnis, getLaporanBulanan } from '@/lib/actions/index'
import { formatRupiah } from '@/lib/utils'
import AddTxButton from '@/components/forms/AddTxButton'
import WeeklyChart from '@/components/charts/WeeklyChart'
import AnomalyAlert from '@/components/dashboard/AnomalyAlert'
import { MonthlyChart } from '@/components/charts/MonthlyChart'

export const revalidate = 0

export default async function DashboardPage() {
  const tahunIni = new Date().getFullYear()

  const [statsV2, txResult, kasResult, proyekResult, unitResult, laporanResult] = await Promise.all([
    getDashboardStatsV2(),
    getTransaksi({ limit: 50 }),
    getKas(),
    getProyek(),
    getUnitBisnis(),
    getLaporanBulanan(tahunIni),
  ])

  const s = statsV2 ?? {
    total_saldo: 0, pemasukan_hari_ini: 0, pengeluaran_hari_ini: 0,
    keuntungan_hari_ini: 0, pemasukan_bulan_ini: 0, pengeluaran_bulan_ini: 0,
    keuntungan_bulan_ini: 0, total_aset: 0, total_kewajiban: 0,
    total_ekuitas: 0, laba_bersih_bulan_ini: 0,
  }

  const proyekList = proyekResult.data ?? []
  const unitList = unitResult.data ?? []
  const laporanData = laporanResult.data ?? []

  const proyekAktif = proyekList.filter(p => p.status === 'aktif').length
  const proyekSelesai = proyekList.filter(p => p.status === 'selesai').length

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      <AnomalyAlert transaksi={txForAnomaly} />

        <AddTxButton />
      </div>

      {/* ── SECTION 1: HERO KPI (1 besar + 4 cards) ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Hero card */}
        <div className="lg:col-span-2 rounded-2xl p-6 flex flex-col justify-between"
          style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)', minHeight: '160px' }}>
          <div>
            <p className="text-sm font-semibold text-white/70 uppercase tracking-wider">Total Semua Kas</p>
            <p className="text-3xl font-bold text-white mt-2 font-mono">{formatRupiah(s.total_saldo)}</p>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-white/80 text-sm">{kasResult.data?.length ?? 0} rekening aktif</span>
            <a href="/kas" className="text-white text-xs font-semibold hover:underline">Lihat Kas →</a>
          </div>
        </div>

        {/* 4 KPI cards */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-4">
          {[
            { label: 'Uang Masuk Hari Ini', value: formatRupiah(s.pemasukan_hari_ini), icon: '📈', color: 'var(--inc)', bg: 'rgba(22,163,74,0.07)' },
            { label: 'Uang Keluar Hari Ini', value: formatRupiah(s.pengeluaran_hari_ini), icon: '📉', color: 'var(--exp)', bg: 'rgba(220,38,38,0.07)' },
            { label: 'Keuntungan Hari Ini',  value: formatRupiah(s.keuntungan_hari_ini),  icon: '💡', color: s.keuntungan_hari_ini >= 0 ? 'var(--inc)' : 'var(--exp)', bg: 'rgba(0,212,255,0.07)' },
            { label: 'Laba Bersih Bulan Ini', value: formatRupiah(s.laba_bersih_bulan_ini), icon: '📊', color: s.laba_bersih_bulan_ini >= 0 ? 'var(--inc)' : 'var(--exp)', bg: 'rgba(168,85,247,0.07)' },
          ].map((card, i) => (
            <div key={i} className="card p-4 flex items-start gap-3">
              <div className="text-2xl">{card.icon}</div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
                <p className="text-base font-bold font-mono mt-0.5" style={{ color: card.color }}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: CASHFLOW CHART (full width) ──────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Arus Kas 7 Hari Terakhir</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Cashflow harian masuk & keluar</p>
          </div>
          <a href="/laporan" className="text-xs font-semibold hover:underline" style={{ color: 'var(--brand)' }}>Lihat Laporan →</a>
        </div>
        <WeeklyChart />
      </div>

      {/* ── SECTION 3: MONTHLY CHART ────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Grafik Bulanan {tahunIni}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Perbandingan pemasukan & pengeluaran per bulan</p>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>
              Masuk: <b className="font-mono" style={{ color: 'var(--inc)' }}>
                {formatRupiah(laporanData.reduce((s, d) => s + d.pemasukan, 0))}
              </b>
            </span>
            <span>
              Keluar: <b className="font-mono" style={{ color: 'var(--exp)' }}>
                {formatRupiah(laporanData.reduce((s, d) => s + d.pengeluaran, 0))}
              </b>
            </span>
          </div>
        </div>
        <MonthlyChart data={laporanData} />
      </div>

      {/* ── SECTION 4+5: TRANSAKSI (left) + PROYEK & UNIT (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Transaksi Terakhir — left 3/5 */}
        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Transaksi Terakhir</h3>
            <a href="/transaksi" className="text-xs font-semibold hover:underline" style={{ color: 'var(--brand)' }}>Lihat semua →</a>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {txResult.data && txResult.data.length > 0 ? (
              txResult.data.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 py-2.5">
                  <div className="text-xl">
                    {tx.kategori?.ikon ?? (tx.tipe === 'pemasukan' ? '📈' : '📉')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {tx.catatan || tx.kategori?.nama || 'Transaksi'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {tx.kas?.nama} · {new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className="text-sm font-bold font-mono" style={{ color: tx.tipe === 'pemasukan' ? 'var(--inc)' : 'var(--exp)' }}>
                    {tx.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(tx.jumlah)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-10 text-center" style={{ color: 'var(--text-muted)' }}>
                <div className="text-4xl mb-2">📭</div>
                <p className="text-sm">Belum ada transaksi</p>
              </div>
            )}
          </div>
        </div>

        {/* Proyek + Unit Bisnis — right 2/5 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Proyek */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Proyek</h3>
              <a href="/proyek" className="text-xs font-semibold hover:underline" style={{ color: 'var(--brand)' }}>Kelola →</a>
            </div>
            <div className="flex gap-3 mb-3">
              <div className="flex-1 text-center py-3 rounded-xl" style={{ background: 'rgba(22,163,74,0.08)' }}>
                <p className="text-2xl font-bold" style={{ color: 'var(--inc)' }}>{proyekAktif}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Aktif</p>
              </div>
              <div className="flex-1 text-center py-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)' }}>
                <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>{proyekSelesai}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Selesai</p>
              </div>
              <div className="flex-1 text-center py-3 rounded-xl" style={{ background: 'var(--nav-active-bg)' }}>
                <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{proyekList.length}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Total</p>
              </div>
            </div>
            {proyekList.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center gap-2 py-1.5">
                <span className="text-sm">📁</span>
                <p className="text-xs font-medium flex-1 truncate" style={{ color: 'var(--text)' }}>{p.nama}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                  ${p.status === 'aktif' ? 'text-green-700' : p.status === 'selesai' ? 'text-blue-700' : 'text-gray-500'}`}
                  style={{
                    background: p.status === 'aktif' ? 'rgba(22,163,74,0.1)' : p.status === 'selesai' ? 'rgba(59,130,246,0.1)' : 'rgba(107,114,128,0.1)'
                  }}>
                  {p.status}
                </span>
              </div>
            ))}
            {proyekList.length === 0 && (
              <p className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>Belum ada proyek</p>
            )}
          </div>

          {/* Unit Bisnis */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Unit Bisnis</h3>
              <a href="/unit-bisnis" className="text-xs font-semibold hover:underline" style={{ color: 'var(--brand)' }}>Kelola →</a>
            </div>
            {unitList.length === 0 ? (
              <p className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>Belum ada unit bisnis</p>
            ) : (
              <div className="space-y-1.5">
                {unitList.slice(0, 4).map(u => (
                  <div key={u.id} className="flex items-center gap-2 py-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: 'var(--nav-active-bg)' }}>⬡</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{u.nama}</p>
                      {u.alamat && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.alamat}</p>}
                    </div>
                  </div>
                ))}
                {unitList.length > 4 && (
                  <p className="text-xs text-center pt-1" style={{ color: 'var(--text-muted)' }}>+{unitList.length - 4} lainnya</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 6: NERACA + LABA RUGI ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Neraca */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Neraca (Balance Sheet)</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Aset = Kewajiban + Ekuitas</p>
            </div>
            <a href="/akuntansi/neraca" className="text-xs font-semibold hover:underline" style={{ color: 'var(--brand)' }}>Detail →</a>
          </div>

          {/* Visual bar */}
          <div className="mb-4">
            {s.total_aset > 0 && (
              <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'var(--border)' }}>
                <div style={{ width: `${Math.min(100, (s.total_kewajiban / s.total_aset) * 100)}%`, background: 'var(--exp)' }} className="h-full" />
                <div style={{ width: `${Math.min(100, (s.total_ekuitas / s.total_aset) * 100)}%`, background: 'var(--inc)' }} className="h-full" />
              </div>
            )}
            <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--exp)' }}></span>Kewajiban</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--inc)' }}></span>Ekuitas</span>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Total Aset', value: s.total_aset, color: 'var(--brand)' },
              { label: 'Total Kewajiban', value: s.total_kewajiban, color: 'var(--exp)' },
              { label: 'Total Ekuitas', value: s.total_ekuitas, color: 'var(--inc)' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                <span className="text-sm font-bold font-mono" style={{ color: r.color }}>{formatRupiah(r.value)}</span>
              </div>
            ))}
            <div className="pt-2 flex items-center justify-between" style={{ borderTop: '2px solid var(--border)' }}>
              <span className="text-sm font-bold" style={{ color: (s.total_aset === s.total_kewajiban + s.total_ekuitas) ? 'var(--inc)' : 'var(--exp)' }}>
                {(s.total_aset === s.total_kewajiban + s.total_ekuitas) ? '✓ SEIMBANG' : '✕ TIDAK SEIMBANG'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                background: (s.total_aset === s.total_kewajiban + s.total_ekuitas) ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                color: (s.total_aset === s.total_kewajiban + s.total_ekuitas) ? 'var(--inc)' : 'var(--exp)',
              }}>A = K + E</span>
            </div>
          </div>
        </div>

        {/* Laba Rugi */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Laba Rugi (P&L) Bulan Ini</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Pendapatan dikurangi beban</p>
            </div>
            <a href="/akuntansi/laba-rugi" className="text-xs font-semibold hover:underline" style={{ color: 'var(--brand)' }}>Detail →</a>
          </div>

          {/* Progress bar laba */}
          {s.pemasukan_bulan_ini > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                <span>Margin</span>
                <span>{Math.round((s.laba_bersih_bulan_ini / s.pemasukan_bulan_ini) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, (s.laba_bersih_bulan_ini / s.pemasukan_bulan_ini) * 100))}%`,
                    background: s.laba_bersih_bulan_ini >= 0 ? 'var(--inc)' : 'var(--exp)',
                  }}
                  className="h-full rounded-full transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            {[
              { label: 'Pendapatan Bulan Ini', value: s.pemasukan_bulan_ini, color: 'var(--inc)' },
              { label: 'Beban Bulan Ini',      value: s.pengeluaran_bulan_ini, color: 'var(--exp)', prefix: '(' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                <span className="text-sm font-semibold font-mono" style={{ color: r.color }}>
                  {r.prefix}{formatRupiah(r.value)}{r.prefix ? ')' : ''}
                </span>
              </div>
            ))}
            <div className="pt-2 flex justify-between items-center" style={{ borderTop: '2px solid var(--border)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Laba Bersih</span>
              <span className="text-xl font-bold font-mono" style={{ color: s.laba_bersih_bulan_ini >= 0 ? 'var(--inc)' : 'var(--exp)' }}>
                {formatRupiah(s.laba_bersih_bulan_ini)}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
