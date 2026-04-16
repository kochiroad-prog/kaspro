import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import AiChat from '@/components/ai/AiChat'

const subMenu = [
  { href: '/laporan/harian',  icon: '📅', label: 'Harian' },
  { href: '/laporan/bulanan', icon: '📆', label: 'Bulanan' },
  { href: '/laporan/tahunan', icon: '🗓️', label: 'Tahunan' },
  { href: '/laporan/custom',  icon: '⚙️', label: 'Custom' },
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
          {/* Sub-nav laporan */}
          <aside className="w-44 flex-shrink-0 flex flex-col py-4 px-2 overflow-y-auto" style={{ borderRight: '1px solid var(--border)', background: 'var(--sidebar-bg)' }}>
            <div className="flex items-center gap-2 px-3 mb-4">
              <span className="text-base">📊</span>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--nav-label)' }}>Laporan Kas</span>
            </div>
            <nav className="space-y-0.5">
              {subMenu.map(item => (
                <SubNavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
              ))}
            </nav>
          </aside>
          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
      <AiChat />
    </div>
  )
}

// Client link dengan active state
function SubNavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="nav-item flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
