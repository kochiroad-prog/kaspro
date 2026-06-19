'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'

const navItems = [
  {
    label: 'Utama',
    items: [
      { href: '/dashboard',  icon: '🏠', label: 'Dashboard' },
      { href: '/transaksi',  icon: '💸', label: 'Transaksi' },
      { href: '/kas',        icon: '💰', label: 'Kas & Rekening' },
      { href: '/transfer',   icon: '🔄', label: 'Transfer Kas' },
    ]
  },
  {
    label: 'Akuntansi',
    items: [
      { href: '/akuntansi/coa',       icon: '📋', label: 'Chart of Accounts' },
      { href: '/akuntansi/jurnal',     icon: '📓', label: 'Jurnal Memorial' },
      { href: '/akuntansi/neraca',     icon: '⚖️', label: 'Neraca' },
      { href: '/akuntansi/laba-rugi',  icon: '📊', label: 'Laba Rugi' },
    ]
  },
  {
    label: 'Laporan',
    items: [
      { href: '/laporan/harian', basePath: '/laporan', icon: '📊', label: 'Laporan' },
    ]
  },
  {
    label: 'Perencanaan',
    items: [
      { href: '/tagihan-rutin', icon: '📋', label: 'Tagihan Rutin' },
      { href: '/gaji',          icon: '👔', label: 'Rekap Gaji' },
    ]
  },
  {
    label: 'Bisnis',
    items: [
      { href: '/unit-bisnis', icon: '🏢', label: 'Unit Bisnis' },
      { href: '/proyek',      icon: '📁', label: 'Proyek' },
      { href: '/kategori',    icon: '🏷️', label: 'Kategori' },
    ]
  },
  {
    label: 'Peralatan',
    items: [
      { href: '/peralatan/e-invoice', icon: '🧾', label: 'e-Invoice' },
      { href: '/peralatan/catatan',   icon: '📝', label: 'Catatan' },
      { href: '/peralatan/supplier',  icon: '🏭', label: 'Supplier' },
    ]
  },
  {
    label: 'Utang Piutang',
    items: [
      { href: '/utang-piutang/utang',   icon: '📕', label: 'Utang' },
      { href: '/utang-piutang/piutang', icon: '📗', label: 'Piutang' },
    ]
  },
  {
    label: 'Pengaturan',
    items: [
      { href: '/pengaturan/akun',              icon: '👤', label: 'Pengguna & Akun' },
      { href: '/pengaturan/pengguna-tambahan', icon: '👥', label: 'Pengguna Tambahan' },
    ]
  },
  {
    label: 'Premium',
    items: [
      { href: '/premium/pembayaran', icon: '💎', label: 'Upgrade Premium' },
    ]
  },
]

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()

  const inisial = (user.profile?.nama || user.email || 'U')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside className="sidebar w-56 flex-shrink-0 flex-col h-full hidden md:flex">

      {/* Logo */}
      <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <ValtoLogo size={32} />
          <span className="font-extrabold text-lg tracking-widest valto-text">
            VALTO
          </span>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
          style={{ background: 'linear-gradient(135deg, var(--brand), #8b5cf6)' }}
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
                const base = (item as any).basePath ?? item.href
                const isActive = pathname === item.href || pathname.startsWith(base + '/')
                return (
                  <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                    <span className="text-sm leading-none w-5 text-center">{item.icon}</span>
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
        <Link
          href="/premium/pembayaran"
          className="block px-3 py-2 mb-2 rounded-xl transition-opacity hover:opacity-80"
          style={{ background: 'linear-gradient(135deg, var(--brand), #8b5cf6)' }}
        >
          <p className="text-xs font-bold text-white">✨ Plan Gratis</p>
          <p className="text-[10px] mt-0.5 text-white/70">Upgrade untuk fitur lengkap</p>
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="nav-item w-full"
            style={{ color: 'var(--exp)' }}
          >
            <span>🚪</span>
            <span>Keluar</span>
          </button>
        </form>
      </div>
    </aside>
  )
}

/* ── VALTO Logo SVG ─────────────────────────────── */
export function ValtoLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <defs>
        <linearGradient id="vg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#vg)" opacity="0.12" />
      <rect x="2" y="2" width="36" height="36" rx="10" stroke="url(#vg)" strokeWidth="1.5" fill="none" />
      <path
        d="M11 12 L20 28 L29 12"
        stroke="url(#vg)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="20" cy="28" r="2.5" fill="url(#vg)" />
    </svg>
  )
}
