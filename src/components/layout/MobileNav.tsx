'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const mobileNav = [
  { href: '/dashboard',  icon: '🏠', label: 'Home' },
  { href: '/transaksi',  icon: '💸', label: 'Transaksi' },
  { href: '/kas',        icon: '💰', label: 'Kas' },
  { href: '/laporan',    icon: '📊', label: 'Laporan' },
  { href: '/pengaturan/akun', icon: '👤', label: 'Akun' },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="mobile-safe-bottom md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 20px rgba(99,102,241,0.08)',
        paddingTop: '8px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {mobileNav.map(item => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all active:scale-90"
            style={{
              color: isActive ? 'var(--brand)' : 'var(--text-muted)',
              background: isActive ? 'var(--brand-light)' : 'transparent',
              minWidth: '56px',
            }}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
