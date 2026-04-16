'use client'

// Grafik donut sederhana berbasis SVG
interface DonutSlice {
  label: string
  value: number
  color: string
}

interface Props {
  data: DonutSlice[]
  size?: number
  label?: string
}

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#84cc16',
  '#06b6d4', '#e11d48', '#0ea5e9', '#d97706', '#7c3aed',
]

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180)
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

function fmt(n: number) {
  if (n >= 1_000_000) return 'Rp' + (n / 1_000_000).toFixed(1) + 'jt'
  if (n >= 1_000) return 'Rp' + (n / 1_000).toFixed(0) + 'rb'
  return 'Rp' + n.toLocaleString('id-ID')
}

export default function GrafikDonut({ data, size = 110, label }: Props) {
  const filtered = data.filter(d => d.value > 0)
  if (filtered.length === 0) return null

  const total = filtered.reduce((s, d) => s + d.value, 0)
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 8

  let currentAngle = 0
  const slices = filtered.map((d, i) => {
    const angle = (d.value / total) * 360
    const path = describeArc(cx, cy, r, currentAngle, currentAngle + angle - 0.5)
    const color = d.color || COLORS[i % COLORS.length]
    currentAngle += angle
    return { ...d, path, color }
  })

  return (
    <div>
      {label && <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>}
      <div className="flex items-start gap-4 flex-wrap">
        <svg width={size} height={size} style={{ flexShrink: 0 }}>
          {slices.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} opacity={0.85} />
          ))}
          {/* Center hole */}
          <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--card-bg)" />
        </svg>
        {/* Legend */}
        <div className="space-y-1 flex-1 min-w-0" style={{ maxHeight: size, overflowY: 'auto' }}>
          {slices.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0, display: 'inline-block' }} />
              <span className="truncate" style={{ color: 'var(--text-muted)', flex: 1 }}>{s.label}</span>
              <span className="font-mono font-semibold flex-shrink-0" style={{ color: 'var(--text)' }}>{fmt(s.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
