'use client'

// Grafik line sederhana berbasis SVG untuk laporan tahunan
interface LinePoint {
  label: string
  pemasukan: number
  pengeluaran: number
}

interface Props {
  data: LinePoint[]
  height?: number
}

export default function GrafikLine({ data, height = 160 }: Props) {
  if (data.length < 2) return null

  const maxVal = Math.max(...data.flatMap(d => [d.pemasukan, d.pengeluaran]), 1)
  const padL = 8, padR = 8, padTop = 10, padBottom = 20
  const svgW = 480
  const chartW = svgW - padL - padR
  const chartH = height - padTop - padBottom

  const xStep = chartW / (data.length - 1)

  function toX(i: number) { return padL + i * xStep }
  function toY(v: number) { return padTop + chartH * (1 - v / maxVal) }

  const pathMasuk = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.pemasukan)}`).join(' ')
  const pathKeluar = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.pengeluaran)}`).join(' ')

  return (
    <div className="w-full overflow-x-auto">
      <svg width={svgW} height={height} style={{ display: 'block' }}>
        {/* Grid */}
        {[0.25, 0.5, 0.75, 1].map(r => {
          const y = padTop + chartH * (1 - r)
          return <line key={r} x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="var(--border)" strokeWidth={1} strokeDasharray="3,3" />
        })}

        {/* Lines */}
        <path d={pathMasuk} fill="none" stroke="rgba(34,197,94,0.85)" strokeWidth={2.5} strokeLinejoin="round" />
        <path d={pathKeluar} fill="none" stroke="rgba(239,68,68,0.85)" strokeWidth={2.5} strokeLinejoin="round" />

        {/* Dots + labels */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(d.pemasukan)} r={3} fill="rgba(34,197,94,0.9)" />
            <circle cx={toX(i)} cy={toY(d.pengeluaran)} r={3} fill="rgba(239,68,68,0.9)" />
            <text x={toX(i)} y={height - 4} textAnchor="middle" fontSize={9} fill="var(--text-muted)">{d.label}</text>
          </g>
        ))}
      </svg>
      <div className="flex gap-4 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1"><span style={{ width: 16, height: 3, background: 'rgba(34,197,94,0.85)', display: 'inline-block', borderRadius: 2 }} />Pemasukan</span>
        <span className="flex items-center gap-1"><span style={{ width: 16, height: 3, background: 'rgba(239,68,68,0.85)', display: 'inline-block', borderRadius: 2 }} />Pengeluaran</span>
      </div>
    </div>
  )
}
