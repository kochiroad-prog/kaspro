'use client'

import { useEffect, useRef } from 'react'
import { formatRupiah } from '@/lib/utils'
import type { LaporanKategori } from '@/types'

const COLORS = ['#16a34a','#dc2626','#3b82f6','#f59e0b','#8b5cf6','#06b6d4','#ec4899','#84cc16']

export default function PieChart({ data }: { data: LaporanKategori[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let chart: any
    import('chart.js/auto').then(({ Chart }) => {
      if (!ref.current || data.length === 0) return
      const existing = Chart.getChart(ref.current)
      if (existing) existing.destroy()
      chart = new Chart(ref.current, {
        type: 'doughnut',
        data: {
          labels: data.map(d => d.nama),
          datasets: [{
            data: data.map(d => d.total),
            backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
            borderWidth: 2, borderColor: '#fff',
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (c: any) => ` ${c.label}: Rp ${Number(c.raw).toLocaleString('id-ID')}` } },
          },
        },
      })
    })
    return () => chart?.destroy()
  }, [data])

  if (data.length === 0) {
    return <div className="py-10 text-center text-gray-400 text-sm">Belum ada data pengeluaran</div>
  }

  return (
    <div>
      <div style={{ position: 'relative', height: '180px' }}>
        <canvas ref={ref} />
      </div>
      <div className="mt-3 space-y-1.5">
        {data.slice(0, 5).map((d, i) => (
          <div key={d.kategori_id} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-gray-600 flex-1 truncate">{d.ikon} {d.nama}</span>
            <span className="font-semibold text-gray-700">{d.persentase}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
