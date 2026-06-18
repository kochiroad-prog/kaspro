'use client'

import { useState } from 'react'

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}

const PAKET = [
  { periode: '1 TAHUN', nominal: 129000, diskon: '21% OFF', color: 'orange' },
  { periode: '9 BULAN', nominal: 105000, diskon: '70%', color: 'blue', popular: true },
  { periode: '6 BULAN', nominal: 125000, diskon: '', color: 'green' },
  { periode: '3 BULAN', nominal: 63000, diskon: '', color: 'gray' },
]

const BANK_INFO = [
  { nama: 'Bank BCA', rek: '1234567890', atas_nama: 'VALTO' },
  { nama: 'Bank Mandiri', rek: '0987654321', atas_nama: 'VALTO' },
]

export default function PembayaranPage() {
  const [metode, setMetode] = useState('transfer')

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-block">
          <h1 className="text-4xl font-bold" style={{ color: 'var(--text)' }}>Upgrade NOW!</h1>
          <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold text-white bg-orange-500">
            Harga Perkenalan
          </div>
        </div>
        <p className="text-base" style={{ color: 'var(--text-muted)' }}>Tingkatkan akun Anda ke premium dan nikmati fitur lengkap</p>
      </div>

      {/* Metode Pembayaran */}
      <div className="flex items-center justify-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio" value="transfer" checked={metode === 'transfer'} onChange={e => setMetode(e.target.value)}
            className="w-4 h-4 rounded border"
            style={{ accentColor: 'var(--brand)' }}
          />
          <span style={{ color: 'var(--text)' }}>Transfer Bank</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio" value="xendit" checked={metode === 'xendit'} onChange={e => setMetode(e.target.value)}
            className="w-4 h-4 rounded border"
            style={{ accentColor: 'var(--brand)' }}
          />
          <span style={{ color: 'var(--text)' }}>Xendit</span>
        </label>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PAKET.map((p, idx) => (
          <div
            key={idx}
            className={`rounded-lg p-6 card transition-transform hover:scale-105 ${p.popular ? 'ring-2 scale-105' : ''}`}
            style={{
              borderColor: p.popular ? 'var(--brand)' : 'var(--border)',
              ringColor: 'var(--brand)',
            }}
          >
            {/* Popular Badge */}
            {p.popular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'var(--brand)' }}>
                POPULER
              </div>
            )}

            {/* Price Circle */}
            <div className="flex justify-center mb-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background:
                    p.color === 'orange'
                      ? 'rgba(251, 146, 60, 0.1)'
                      : p.color === 'blue'
                      ? 'rgba(59, 130, 246, 0.1)'
                      : p.color === 'green'
                      ? 'rgba(34, 197, 94, 0.1)'
                      : 'rgba(156, 163, 175, 0.1)',
                }}
              >
                <span
                  className="text-2xl font-bold"
                  style={{
                    color:
                      p.color === 'orange'
                        ? '#fb923c'
                        : p.color === 'blue'
                        ? '#3b82f6'
                        : p.color === 'green'
                        ? '#22c55e'
                        : '#9ca3af',
                  }}
                >
                  {p.nominal / 1000}k
                </span>
              </div>
            </div>

            {/* Diskon Badge */}
            {p.diskon && (
              <div
                className="mb-3 px-2 py-1 rounded text-xs font-bold text-center text-white"
                style={{
                  background:
                    p.color === 'orange'
                      ? '#fb923c'
                      : p.color === 'blue'
                      ? '#3b82f6'
                      : '#22c55e',
                }}
              >
                {p.diskon}
              </div>
            )}

            {/* Period */}
            <h3 className="text-center font-bold mb-4" style={{ color: 'var(--text)' }}>
              {p.periode}
            </h3>

            {/* Button */}
            <button
              className="w-full py-2 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-80"
              style={{ background: 'var(--brand)' }}
            >
              Beli
            </button>
          </div>
        ))}
      </div>

      {/* Terms */}
      <div className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        <p>Paket premium otomatis diperpanjang setiap bulan/tahun.</p>
        <p>Anda dapat membatalkan kapan saja tanpa biaya tambahan.</p>
      </div>

      {/* Payment Method Section */}
      {metode === 'transfer' && (
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Informasi Rekening Bank</h2>
          <div className="space-y-4">
            {BANK_INFO.map((bank, idx) => (
              <div key={idx} className="p-4 rounded-lg" style={{ background: 'var(--nav-active-bg)', borderColor: 'var(--border)', border: '1px solid var(--border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{bank.nama}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No. Rekening</p>
                <p className="text-base font-mono font-bold" style={{ color: 'var(--brand)' }}>{bank.rek}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Atas Nama</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{bank.atas_nama}</p>
              </div>
            ))}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Kirim bukti transfer ke email support@valto.id untuk verifikasi instan.
          </p>
        </div>
      )}

      {metode === 'xendit' && (
        <div className="card p-6 text-center space-y-3">
          <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>Pembayaran Xendit</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Klik tombol Beli di atas untuk lanjut ke sistem pembayaran Xendit. Anda dapat membayar menggunakan berbagai metode.
          </p>
        </div>
      )}
    </div>
  )
}
