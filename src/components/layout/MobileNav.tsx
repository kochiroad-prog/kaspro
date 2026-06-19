'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { logout } from '@/lib/actions/auth'
import PwaInstallGuide from '@/components/PwaInstallGuide'

const mainNav = [
  { href: '/dashboard',  icon: '🏠', label: 'Home' },
  { href: '/transaksi',  icon: '💸', label: 'Transaksi' },
  { href: '/kas',        icon: '💰', label: 'Kas' },
  { href: '/laporan',    icon: '📊', label: 'Laporan' },
]

const drawerGroups = [
  {
    label: 'Keuangan',
    items: [
      { href: '/transfer',   icon: '🔄', label: 'Transfer Kas' },
      { href: '/kategori',   icon: '🏷️', label: 'Kategori' },
    ]
  },
  {
    label: 'Akuntansi',
    items: [
      { href: '/akuntansi/coa',       icon: '📋', label: 'Chart of Accounts' },
      { href: '/akuntansi/jurnal',    icon: '📓', label: 'Jurnal Memorial' },
      { href: '/akuntansi/neraca',    icon: '⚖️', label: 'Neraca' },
      { href: '/akuntansi/laba-rugi', icon: '📊', label: 'Laba Rugi' },
    ]
  },
  {
    label: 'Bisnis',
    items: [
      { href: '/unit-bisnis', icon: '🏢', label: 'Unit Bisnis' },
      { href: '/proyek',      icon: '📁', label: 'Proyek' },
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
    label: 'AI & Proyeksi',
    items: [
      { href: '/laporan/proyeksi', icon: '🤖', label: 'AI Proyeksi' },
    ]
  },
  {
    label: 'Akun & Premium',
    items: [
      { href: '/pengaturan/akun',              icon: '👤', label: 'Pengaturan Akun' },
      { href: '/pengaturan/pengguna-tambahan', icon: '👥', label: 'Pengguna Tambahan' },
      { href: '/premium/pembayaran',           icon: '💎', label: 'Upgrade Premium' },
    ]
  },
]

export default function MobileNav() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <>
      {/* ── Bottom Nav Bar ─────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -4px 20px rgba(99,102,241,0.08)',
          paddingTop: '8px',
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {mainNav.map(item => {
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

        {/* Lainnya button */}
        <button
          onClick={() => setDrawerOpen(o => !o)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all active:scale-90"
          style={{
            color: drawerOpen ? 'var(--brand)' : 'var(--text-muted)',
            background: drawerOpen ? 'var(--brand-light)' : 'transparent',
            minWidth: '56px',
          }}
        >
          <span className="text-xl leading-none">☰</span>
          <span className="text-[10px] font-semibold">Lainnya</span>
        </button>
      </nav>

      {/* ── Backdrop ───────────────────────────────── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Slide-up Drawer ────────────────────────── */}
      <div
        className="md:hidden fixed left-0 right-0 z-50 rounded-t-3xl overflow-hidden transition-transform duration-300"
        style={{
          bottom: 0,
          maxHeight: '80vh',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -8px 40px rgba(99,102,241,0.15)',
          transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',
          paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: 'calc(80vh - 80px)' }}>
          {drawerGroups.map(group => (
            <div key={group.label} className="mb-4">
              <p className="text-xs font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
                {group.label}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {group.items.map(item => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex flex-col items-center gap-1 p-3 rounded-2xl transition-all active:scale-95"
                      style={{
                        background: isActive ? 'var(--brand-light)' : 'var(--card-bg)',
                        color: isActive ? 'var(--brand)' : 'var(--text)',
                        border: `1px solid ${isActive ? 'var(--brand)' : 'var(--border)'}`,
                      }}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-[10px] font-semibold text-center leading-tight">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Tombol Install App */}
          <div className="mt-2">
            <PwaInstallGuide />
          </div>

          {/* Tombol Keluar — di dalam scrollable agar selalu tampil */}
          <div className="mt-2 mb-2">
            <form action={logout}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
                style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}
              >
                <span className="text-xl">🚪</span>
                Keluar dari Akun
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
