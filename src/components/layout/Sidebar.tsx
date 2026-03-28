'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'

const navItems = [
  {
    label: 'Utama',
    items: [
      { href: '/dashboard', icon: '▦', label: 'Dashboard' },
      { href: '/transaksi', icon: '⟳', label: 'Transaksi' },
      { href: '/kas', icon: '◈', label: 'Kas & Rekening' },
      { href: '/transfer', icon: '⇄', label: 'Transfer Kas' },
    ]
  },
  {
    label: 'Kelola',
    items: [
      { href: '/kategori', icon: '⊞', label: 'Kategori' },
      { href: '/laporan', icon: '◎', label: 'Laporan' },
    ]
  },
  {
    label: 'Bisnis',
    items: [
      { href: '/unit-bisnis', icon: '⬡', label: 'Unit Bisnis' },
      { href: '/proyek', icon: '◫', label: 'Proyek' },
    ]
  },
  {
    label: 'Pengaturan',
    items: [
      { href: '/pengaturan/akun', icon: '◉', label: 'Pengguna & Akun' },
      { href: '/pengaturan/pengguna-tambahan', icon: '◎', label: 'Pengguna Tambahan' },
      { href: '/pengaturan/buku-kas', icon: '▣', label: 'Buku Kas' },
      { href: '/pengaturan/kategori-buku-kas', icon: '⊟', label: 'Kategori Buku Kas' },
      { href: '/pengaturan/pembayaran', icon: '◆', label: 'Pembayaran' },
    ]
  },
]

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()

  const inisial = (user.profile?.nama || user.email || 'U')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside className="sidebar w-56 flex-shrink-0 flex flex-col h-full">

      {/* Logo */}
      <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <PraecoxLogo size={32} id="sidebar" />
          <span className="font-bold text-base tracking-widest praecox-text">
            PRAECOX
          </span>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            background: 'var(--nav-active-bg)',
            border: '1px solid var(--brand)',
            color: 'var(--brand)',
          }}
        >
          {inisial}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
            {user.profile?.nama || 'Pengguna'}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {user.profile?.nama_bisnis || user.email}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navItems.map(section => (
          <div key={section.label}>
            <p
              className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1"
              style={{ color: 'var(--nav-label)' }}
            >
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                    <span className="text-sm leading-none font-mono w-4 text-center">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div
          className="px-3 py-2 mb-2 rounded-lg"
          style={{
            background: 'var(--nav-active-bg)',
            border: '1px solid var(--border)',
          }}
        >
          <p className="text-xs font-bold" style={{ color: 'var(--brand)' }}>Plan Gratis</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Upgrade untuk fitur lengkap</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="nav-item w-full"
            style={{ color: 'var(--exp)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--exp-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            <span>⏻</span>
            <span>Keluar</span>
          </button>
        </form>
      </div>
    </aside>
  )
}

/* ── Globe SVG Logo ───────────────────────── */
function PraecoxLogo({ size = 32, id }: { size?: number; id: string }) {
  const gid = `pg-${id}`
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand-2)" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="15" stroke={`url(#${gid})`} strokeWidth="1.2" fill="none" />
      <line x1="18" y1="3"  x2="6"  y2="12" stroke={`url(#${gid})`} strokeWidth="0.9" opacity="0.7"/>
      <line x1="18" y1="3"  x2="30" y2="12" stroke={`url(#${gid})`} strokeWidth="0.9" opacity="0.7"/>
      <line x1="6"  y1="12" x2="18" y2="18" stroke={`url(#${gid})`} strokeWidth="0.9" opacity="0.7"/>
      <line x1="30" y1="12" x2="18" y2="18" stroke={`url(#${gid})`} strokeWidth="0.9" opacity="0.7"/>
      <line x1="18" y1="18" x2="6"  y2="26" stroke={`url(#${gid})`} strokeWidth="0.9" opacity="0.7"/>
      <line x1="18" y1="18" x2="30" y2="26" stroke={`url(#${gid})`} strokeWidth="0.9" opacity="0.7"/>
      <line x1="6"  y1="26" x2="18" y2="33" stroke={`url(#${gid})`} strokeWidth="0.9" opacity="0.7"/>
      <line x1="30" y1="26" x2="18" y2="33" stroke={`url(#${gid})`} strokeWidth="0.9" opacity="0.7"/>
      <line x1="6"  y1="12" x2="6"  y2="26" stroke={`url(#${gid})`} strokeWidth="0.9" opacity="0.4"/>
      <line x1="30" y1="12" x2="30" y2="26" stroke={`url(#${gid})`} strokeWidth="0.9" opacity="0.4"/>
      <circle cx="18" cy="3"  r="1.8" fill="var(--brand)" />
      <circle cx="6"  cy="12" r="1.5" fill="var(--brand)" opacity="0.8"/>
      <circle cx="30" cy="12" r="1.5" fill="var(--brand-2)" />
      <circle cx="18" cy="18" r="2.2" fill={`url(#${gid})`} />
      <circle cx="6"  cy="26" r="1.5" fill="var(--brand-2)" opacity="0.8"/>
      <circle cx="30" cy="26" r="1.5" fill="var(--brand)" opacity="0.8"/>
      <circle cx="18" cy="33" r="1.8" fill="var(--brand-2)" />
    </svg>
  )
}
