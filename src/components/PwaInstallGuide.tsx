'use client'

import { useState, useEffect } from 'react'

export default function PwaInstallGuide() {
  const [open, setOpen] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent))
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
  }, [])

  // Sudah diinstall, tidak perlu tampil
  if (isStandalone) return null

  return (
    <>
      {/* Trigger button — bisa dipanggil dari luar via event juga */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
        style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--brand)' }}
      >
        <span className="text-xl">📲</span>
        Install Aplikasi VALTO
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={e => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl p-6"
            style={{ background: 'var(--surface)' }}
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>

            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>
              📲 Install Aplikasi VALTO
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              Ikuti langkah berikut di browser kamu:
            </p>

            {isIos ? (
              /* iOS Safari */
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: 'var(--bg)' }}>
                  <span className="text-2xl">1️⃣</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Buka di Safari</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Halaman ini harus dibuka di Safari (bukan Chrome) untuk iOS</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: 'var(--bg)' }}>
                  <span className="text-2xl">2️⃣</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Tap tombol Share <span className="font-mono">⎙</span></p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Tombol kotak dengan panah ke atas di tengah bawah layar</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: 'var(--bg)' }}>
                  <span className="text-2xl">3️⃣</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Pilih "Add to Home Screen"</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Scroll ke bawah di menu Share, cari "Tambahkan ke Layar Utama"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: 'var(--bg)' }}>
                  <span className="text-2xl">4️⃣</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Tap "Add" / "Tambahkan"</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Icon VALTO akan muncul di layar utama HP kamu</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Android Chrome */
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: 'var(--bg)' }}>
                  <span className="text-2xl">1️⃣</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Tap menu Chrome ⋮</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Titik tiga di pojok kanan atas browser Chrome</p>
                  </div>
                </div>
                <div
                  className="flex items-start gap-3 p-3 rounded-2xl"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid var(--brand)' }}
                >
                  <span className="text-2xl">2️⃣</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>Pilih "Install aplikasi"</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>atau "Tambahkan ke layar utama" — keduanya berfungsi sama</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: 'var(--bg)' }}>
                  <span className="text-2xl">3️⃣</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Tap "Install" / "Tambahkan"</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Icon VALTO langsung muncul di layar utama HP kamu</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setOpen(false)}
              className="w-full mt-5 py-3 rounded-2xl text-sm font-bold"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  )
}
