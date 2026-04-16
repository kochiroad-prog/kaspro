'use client'

// Grafik bar sederhana berbasis SVG — tanpa library eksternal
interface BarData {
  label: string
  pemasukan: number
  pengeluaran: number
}

interface Props {
  data: BarData[]
  height?: number
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'jt'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'rb'
  return String(n)
}

export default function GrafikBar({ data, height = 180 }: Props) {
  if (data.length === 0) return null

  const maxVal = Math.max(...data.flatMap(d => [d.pemasukan, d.pengeluaran]), 1)
  const barW = Math.max(6, Math.floor(480 / (data.length * 2 + data.length + 1)))
  const gap = Math.floor(barW / 2)
  const groupW = barW * 2 + gap
  const svgW = data.length * (groupW + gap) + gap
  const padBottom = 20
  const padTop = 10
  const chartH = height - padBottom - padTop

  return (
    <div className="w-full overflow-x-auto">
      <svg width={Math.max(svgW, 300)} height={height} style={{ display: 'block' }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(ratio => {
          const y = padTop + chartH * (1 - ratio)
          return (
            <line key={ratio} x1={0} y1={y} x2={Math.max(svgW, 300)} y2={y}
              stroke="var(--border)" strokeWidth={1} strokeDasharray="3,3" />
          )
        })}

        {data.map((d, i) => {
          const x = gap + i * (groupW + gap)
          const hMasuk = d.pemasukan > 0 ? Math.max(3, (d.pemasukan / maxVal) * chartH) : 0
          const hKeluar = d.pengeluaran > 0 ? Math.max(3, (d.pengeluaran / maxVal) * chartH) : 0

          return (
            <g key={i}>
              {/* Bar Pemasukan (hijau) */}
              <rect
                x={x} y={padTop + chartH - hMasuk}
                width={barW} height={hMasuk}
                fill="rgba(34,197,94,0.75)" rx={2}
              />
              {/* Bar Pengeluaran (merah) */}
              <rect
                x={x + barW + gap} y={padTop + chartH - hKeluar}
                width={barW} height={hKeluar}
                fill="rgba(239,68,68,0.75)" rx={2}
              />
              {/* Label */}
              <text
                x={x + barW + gap / 2}
                y={height - 4}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-muted)"
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
      {/* Legend */}
      <div className="flex gap-4 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, background: 'rgba(34,197,94,0.75)', borderRadius: 2, display: 'inline-block' }} />Pemasukan</span>
        <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, background: 'rgba(239,68,68,0.75)', borderRadius: 2, display: 'inline-block' }} />Pengeluaran</span>
      </div>
    </div>
  )
}
