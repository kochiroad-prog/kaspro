'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'
import { ValtoLogo } from '@/components/layout/Sidebar'

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
  '/akuntansi': 'Akuntansi',
  '/peralatan': 'Peralatan',
  '/utang-piutang': 'Utang Piutang',
  '/premium': 'Premium',
}

export default function Topbar({ user }: { user: any }) {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const title = Object.entries(pageTitles).find(([k]) => pathname.startsWith(k))?.[1] ?? 'VALTO'

  const tgl = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <header className="topbar h-14 flex items-center px-4 md:px-6 gap-4 flex-shrink-0">
      <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
        <ValtoLogo size={28} />
        <span className="font-extrabold text-sm valto-text">VALTO</span>
      </Link>

      <h1 className="font-bold text-base flex-1 hidden md:block" style={{ color: 'var(--text)' }}>{title}</h1>

      <span className="text-xs hidden lg:block" style={{ color: 'var(--text-muted)' }}>{tgl}</span>

      <div className="theme-toggle">
        <button
          onClick={() => theme === 'dark' && toggle()}
          className={`theme-toggle-btn ${theme === 'light' ? 'active' : ''}`}
        >
          Light
        </button>
        <button
          onClick={() => theme === 'light' && toggle()}
          className={`theme-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
        >
          Dark
        </button>
      </div>
    </header>
  )
}
