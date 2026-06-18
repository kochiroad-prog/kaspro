'use client'

import { useEffect, useState } from 'react'

export default function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(err => console.error('SW registration failed:', err))
    }

    // Jika sudah standalone (sudah diinstall), tidak perlu tampil
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Tangkap event install dari Chrome
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setShowBanner(false))

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setShowBanner(false)
    setInstallPrompt(null)
  }

  if (!showBanner) return null

  return (
    <div
      className="fixed left-0 right-0 z-[70] flex items-center gap-3 px-4 py-3"
      style={{
        bottom: 0,
        background: 'var(--brand)',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -4px 20px rgba(99,102,241,0.3)',
      }}
    >
      <span className="text-2xl">📲</span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-bold leading-none">Install VALTO</p>
        <p className="text-white/70 text-xs mt-0.5">Akses lebih cepat dari layar utama</p>
      </div>
      <button
        onClick={handleInstall}
        className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold"
        style={{ background: 'white', color: 'var(--brand)' }}
      >
        Install
      </button>
      <button
        onClick={() => setShowBanner(false)}
        className="flex-shrink-0 text-white/70 text-lg leading-none"
      >
        ✕
      </button>
    </div>
  )
}
