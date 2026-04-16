import LaporanView from '@/components/laporan/LaporanView'

export const revalidate = 0

export default function LaporanHarianPage() {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Laporan Harian</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Transaksi hari ini</p>
      </div>
      <LaporanView
        dari={today}
        sampai={today}
        judulPeriode={new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />
    </div>
  )
}
