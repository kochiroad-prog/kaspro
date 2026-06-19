import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import MobileNav from '@/components/layout/MobileNav'

const subMenu = [
  { href: '/laporan/harian',   icon: '1', label: 'Harian' },
  { href: '/laporan/bulanan',  icon: '2', label: 'Bulanan' },
  { href: '/laporan/tahunan',  icon: '3', label: 'Tahunan' },
  { href: '/laporan/custom',   icon: '4', label: 'Custom' },
  { href: '/laporan/proyeksi', icon: '🤖', label: 'AI Proyeksi' },
]

export default async function LaporanLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <div className="app-bg flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} />
        <div className="flex-1 flex overflow-hidden">
          {/* Sub-nav desktop */}
          <aside className="w-44 flex-shrink-0 flex-col py-4 px-2 overflow-y-auto hidden md:flex" style={{ borderRight: '1px solid var(--border)', background: 'var(--sidebar-bg)' }}>
            <div className="flex items-center gap-2 px-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--nav-label)' }}>Laporan</span>
            </div>
            <nav className="space-y-0.5">
              {subMenu.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-item flex items-center gap-2 px-3 py-2 rounded-xl text-sm w-full"
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
          {/* Mobile sub-nav tabs */}
          <div className="md:hidden fixed top-14 left-0 right-0 z-40 flex gap-1 px-3 py-2 overflow-x-auto" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            {subMenu.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
              >
                {item.label}
              </Link>
            ))}
          </div>
          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 mt-10 md:mt-0">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />

    </div>
  )
}
