// ============================================================
// KasPro - Utility Functions
// ============================================================

/**
 * Format angka ke format Rupiah
 * @example formatRupiah(1500000) → "Rp 1.500.000"
 */
export function formatRupiah(angka: number): string {
  return 'Rp ' + Math.round(angka).toLocaleString('id-ID')
}

/**
 * Format angka pendek untuk display
 * @example formatRupiahShort(1500000) → "Rp 1,5jt"
 */
export function formatRupiahShort(angka: number): string {
  if (angka >= 1_000_000_000) return `Rp ${(angka / 1_000_000_000).toFixed(1)}M`
  if (angka >= 1_000_000) return `Rp ${(angka / 1_000_000).toFixed(1)}jt`
  if (angka >= 1_000) return `Rp ${(angka / 1_000).toFixed(0)}rb`
  return `Rp ${angka}`
}

/**
 * Format tanggal ke bahasa Indonesia
 * @example formatTanggal('2026-03-28') → "28 Mar 2026"
 */
export function formatTanggal(tgl: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof tgl === 'string' ? new Date(tgl + 'T00:00:00') : tgl
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: format === 'long' ? 'long' : 'short',
    year: 'numeric',
  })
}

/**
 * Format tanggal relatif
 * @example formatRelative('2026-03-28') → "Hari ini"
 */
export function formatRelative(tgl: string): string {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (tgl === today) return 'Hari ini'
  if (tgl === yesterday) return 'Kemarin'
  return formatTanggal(tgl)
}

/**
 * Tanggal hari ini dalam format YYYY-MM-DD
 */
export function hariIni(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Awal bulan ini dalam format YYYY-MM-DD
 */
export function awalBulan(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

/**
 * Akhir bulan ini dalam format YYYY-MM-DD
 */
export function akhirBulan(): string {
  const d = new Date()
  const akhir = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return akhir.toISOString().split('T')[0]
}

/**
 * Parse input angka dari string (hapus titik/koma pemisah)
 */
export function parseAngka(str: string): number {
  return parseInt(str.replace(/\D/g, '')) || 0
}

/**
 * Warna hex untuk tipe kas
 */
export function warnaKas(tipe: string): string {
  const map: Record<string, string> = {
    tunai: '#1a7f5a',
    bank: '#3b82f6',
    ewallet: '#8b5cf6',
    lainnya: '#6b7280',
  }
  return map[tipe] ?? '#6b7280'
}

/**
 * Ikon untuk tipe kas
 */
export function ikonKas(tipe: string): string {
  const map: Record<string, string> = {
    tunai: '💵',
    bank: '🏦',
    ewallet: '📱',
    lainnya: '💼',
  }
  return map[tipe] ?? '💰'
}

/**
 * Label tipe transaksi yang ramah pengguna
 */
export function labelTipe(tipe: 'pemasukan' | 'pengeluaran'): string {
  return tipe === 'pemasukan' ? 'Uang Masuk' : 'Uang Keluar'
}

/**
 * Hitung persentase perubahan
 */
export function hitungPerubahan(sekarang: number, sebelum: number): number {
  if (sebelum === 0) return sekarang > 0 ? 100 : 0
  return Math.round(((sekarang - sebelum) / Math.abs(sebelum)) * 100)
}

/**
 * Class names helper (sederhana)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Format waktu "HH:MM:SS" → "HH:MM"
 * Jika waktu null, fallback ke created_at (browser timezone)
 * @example formatJam("14:30:00") → "14:30"
 */
export function formatJam(waktu: string | null | undefined, createdAt?: string): string {
  if (waktu) return waktu.slice(0, 5)
  if (createdAt) {
    const d = new Date(createdAt)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return ''
}

/**
 * Jam dan menit sekarang dalam format HH:MM
 */
export function jamSekarang(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
