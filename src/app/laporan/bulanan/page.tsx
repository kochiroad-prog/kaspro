import LaporanView from '@/components/laporan/LaporanView'

export const revalidate = 0

export default function LaporanBulananPage() {
  const now = new Date()
  const dari = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const sampai = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const label = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Laporan Bulanan</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Bulan {label}</p>
      </div>
      <LaporanView
        dari={dari}
        sampai={sampai}
        judulPeriode={`1 ${label} ke ${sampai.split('-')[2]} ${label}`}
      />
    </div>
  )
}
