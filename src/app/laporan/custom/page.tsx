import LaporanView from '@/components/laporan/LaporanView'

export const revalidate = 0

export default function LaporanCustomPage() {
  const now = new Date()
  const dari = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const sampai = now.toISOString().split('T')[0]

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Laporan Custom</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Pilih rentang tanggal sesuka Anda</p>
      </div>
      <LaporanView
        dari={dari}
        sampai={sampai}
        judulPeriode="Laporan Custom"
      />
    </div>
  )
}
