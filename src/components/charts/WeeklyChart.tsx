'use client'

import { useEffect, useRef } from 'react'

export default function WeeklyChart() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let chart: any
    import('chart.js/auto').then(({ Chart }) => {
      if (!ref.current) return
      const existing = Chart.getChart(ref.current)
      if (existing) existing.destroy()
      const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ming']
      chart = new Chart(ref.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Uang Masuk',
              data: [820000, 640000, 1100000, 750000, 600000, 1250000, 980000],
              backgroundColor: '#dcfce7',
              borderColor: '#16a34a',
              borderWidth: 1.5,
              borderRadius: 5,
            },
            {
              label: 'Uang Keluar',
              data: [340000, 180000, 420000, 500000, 160000, 620000, 280000],
              backgroundColor: '#fee2e2',
              borderColor: '#dc2626',
              borderWidth: 1.5,
              borderRadius: 5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { size: 11, family: 'Plus Jakarta Sans' }, boxWidth: 10, padding: 12 },
            },
            tooltip: {
              callbacks: {
                label: (ctx: any) => ` Rp ${Number(ctx.raw).toLocaleString('id-ID')}`,
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            y: {
              grid: { color: '#f3f4f6' },
              ticks: {
                font: { size: 10 },
                callback: (v: any) => 'Rp ' + (Number(v) / 1000).toFixed(0) + 'rb',
              },
            },
          },
        },
      })
    })
    return () => chart?.destroy()
  }, [])

  return (
    <div style={{ position: 'relative', height: '200px' }}>
      <canvas ref={ref} />
    </div>
  )
}
