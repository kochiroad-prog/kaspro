import { formatRupiah, ikonKas } from '@/lib/utils'
import type { Kas } from '@/types'

export default function KasSaldoBar({ kasData, totalSaldo }: { kasData: Kas[]; totalSaldo: number }) {
  if (kasData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-3xl mb-2">🏦</p>
        <p className="text-sm">Belum ada kas</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {kasData.map(k => {
        const pct = totalSaldo > 0 ? Math.round((k.saldo / totalSaldo) * 100) : 0
        return (
          <div key={k.id}>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{ikonKas(k.tipe)}</span>
                <span className="text-sm font-semibold text-gray-700">{k.nama}</span>
              </div>
              <span className="text-sm font-bold text-[var(--brand)]">{formatRupiah(k.saldo)}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--brand)] rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{pct}% dari total</p>
          </div>
        )
      })}
    </div>
  )
}
