'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transaksi': 'Transaksi',
  '/kas': 'Kas & Rekening',
  '/transfer': 'Transfer Antar Kas',
  '/kategori': 'Kategori',
  '/laporan': 'Laporan',
  '/unit-bisnis': 'Unit Bisnis',
  '/proyek': 'Proyek',
  '/pengaturan': 'Pengaturan',
}

export default function Topbar({ user }: { user: any }) {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const title = Object.entries(pageTitles).find(([k]) => pathname.startsWith(k))?.[1] ?? 'Praecox'

  const tgl = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <header className="topbar h-14 flex items-center px-6 gap-4 flex-shrink-0">
      <h1 className="font-bold text-base flex-1" style={{ color: 'var(--text)' }}>{title}</h1>

      <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>{tgl}</span>

      {/* Theme toggle */}
      <div className="theme-toggle">
        <button
          onClick={() => theme === 'dark' && toggle()}
          className={`theme-toggle-btn ${theme === 'light' ? 'active' : ''}`}
        >
          ☀️ Light
        </button>
        <button
          onClick={() => theme === 'light' && toggle()}
          className={`theme-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
        >
          🌙 Dark
        </button>
      </div>
    </header>
  )
}
