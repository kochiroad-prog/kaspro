import LaporanView from '@/components/laporan/LaporanView'

export const revalidate = 0

export default function LaporanTahunanPage() {
  const tahun = new Date().getFullYear()
  const dari = `${tahun}-01-01`
  const sampai = `${tahun}-12-31`

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Laporan Tahunan</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Tahun {tahun}</p>
      </div>
      <LaporanView
        dari={dari}
        sampai={sampai}
        judulPeriode={`1 Januari ${tahun} ke 31 Desember ${tahun}`}
      />
    </div>
  )
}
