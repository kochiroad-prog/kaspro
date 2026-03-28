'use client'

import { useEffect, useRef } from 'react'
import type { LaporanBulanan, LaporanKategori } from '@/types'

export function MonthlyChart({ data }: { data: LaporanBulanan[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let chart: any
    import('chart.js/auto').then(({ Chart }) => {
      if (!ref.current) return
      const existing = Chart.getChart(ref.current)
      if (existing) existing.destroy()
      chart = new Chart(ref.current, {
        type: 'line',
        data: {
          labels: data.map(d => d.label.split(' ')[0]),
          datasets: [
            {
              label: 'Uang Masuk',
              data: data.map(d => d.pemasukan),
              borderColor: '#16a34a',
              backgroundColor: 'rgba(22,163,74,.08)',
              tension: 0.4, fill: true, pointRadius: 4, borderWidth: 2,
            },
            {
              label: 'Uang Keluar',
              data: data.map(d => d.pengeluaran),
              borderColor: '#dc2626',
              backgroundColor: 'rgba(220,38,38,.06)',
              tension: 0.4, fill: true, pointRadius: 4, borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 10, padding: 12 } },
            tooltip: { callbacks: { label: (c: any) => ` Rp ${Number(c.raw).toLocaleString('id-ID')}` } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v: any) => 'Rp ' + (v / 1_000_000).toFixed(1) + 'jt' } },
          },
        },
      })
    })
    return () => chart?.destroy()
  }, [data])
  return (
    <div style={{ position: 'relative', height: '240px' }}>
      <canvas ref={ref} />
    </div>
  )
}

export default MonthlyChart
