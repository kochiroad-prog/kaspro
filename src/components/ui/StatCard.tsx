// StatCard
export function StatCard({
  label, value, sub, color, icon
}: {
  label: string
  value: string
  sub?: string
  color: 'brand' | 'inc' | 'exp'
  icon?: string
}) {
  const colorMap = {
    brand: 'text-[var(--brand)]',
    inc: 'text-green-600',
    exp: 'text-red-600',
  }
  return (
    <div className="stat-card">
      <div className="stat-label flex items-center gap-1.5">
        {icon && <span className="text-base leading-none">{icon}</span>}
        {label}
      </div>
      <div className={`stat-value ${colorMap[color]}`}>{value}</div>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  )
}

// Default export for single import
export default StatCard
