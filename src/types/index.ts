// ============================================================
// KasPro - TypeScript Types
// ============================================================

export type TipeTransaksi = 'pemasukan' | 'pengeluaran'
export type TipeKas = 'tunai' | 'bank' | 'ewallet' | 'lainnya'
export type StatusProyek = 'aktif' | 'selesai' | 'dibatalkan'
export type UserRole = 'owner' | 'admin' | 'staff'
export type UserPlan = 'free' | 'pro' | 'enterprise'

// ---- Database Row Types ----

export interface Profile {
  id: string
  nama: string
  email: string
  nama_bisnis: string
  role: UserRole
  plan: UserPlan
  created_at: string
  updated_at: string
}

export interface Kas {
  id: string
  user_id: string
  nama: string
  tipe: TipeKas
  saldo: number
  aktif: boolean
  warna: string
  created_at: string
  updated_at: string
}

export interface Kategori {
  id: string
  user_id: string
  nama: string
  tipe: TipeTransaksi
  ikon: string
  warna: string
  created_at: string
}

export interface UnitBisnis {
  id: string
  user_id: string
  nama: string
  alamat: string
  deskripsi: string
  aktif: boolean
  created_at: string
}

export interface Proyek {
  id: string
  user_id: string
  nama: string
  nama_client: string
  deskripsi: string
  tgl_mulai: string | null
  tgl_selesai: string | null
  status: StatusProyek
  created_at: string
}

export interface Transaksi {
  id: string
  user_id: string
  kas_id: string
  kategori_id: string | null
  unit_bisnis_id: string | null
  proyek_id: string | null
  tipe: TipeTransaksi
  jumlah: number
  catatan: string
  tanggal: string
  created_at: string
  updated_at: string
  // Joined fields
  kas?: Pick<Kas, 'id' | 'nama' | 'tipe'>
  kategori?: Pick<Kategori, 'id' | 'nama' | 'ikon'>
  unit_bisnis?: Pick<UnitBisnis, 'id' | 'nama'>
  proyek?: Pick<Proyek, 'id' | 'nama'>
}

export interface Transfer {
  id: string
  user_id: string
  dari_kas_id: string
  ke_kas_id: string
  jumlah: number
  catatan: string
  tanggal: string
  created_at: string
  // Joined
  dari_kas?: Pick<Kas, 'id' | 'nama'>
  ke_kas?: Pick<Kas, 'id' | 'nama'>
}

// ---- Form / Input Types ----

export interface TransaksiInput {
  kas_id: string
  kategori_id: string
  unit_bisnis_id?: string
  proyek_id?: string
  tipe: TipeTransaksi
  jumlah: number
  catatan: string
  tanggal: string
}

export interface KasInput {
  nama: string
  tipe: TipeKas
  saldo_awal?: number
}

export interface KategoriInput {
  nama: string
  tipe: TipeTransaksi
  ikon?: string
}

export interface TransferInput {
  dari_kas_id: string
  ke_kas_id: string
  jumlah: number
  catatan?: string
  tanggal: string
}

export interface UnitBisnisInput {
  nama: string
  alamat?: string
  deskripsi?: string
}

export interface ProyekInput {
  nama: string
  nama_client?: string
  deskripsi?: string
  tgl_mulai?: string
  tgl_selesai?: string
}

// ---- Dashboard / Report Types ----

export interface DashboardStats {
  total_saldo: number
  pemasukan_hari_ini: number
  pengeluaran_hari_ini: number
  keuntungan_hari_ini: number
  pemasukan_bulan_ini: number
  pengeluaran_bulan_ini: number
  keuntungan_bulan_ini: number
}

export interface LaporanBulanan {
  bulan: string       // format: 'YYYY-MM'
  label: string       // format: 'Jan 2026'
  pemasukan: number
  pengeluaran: number
  keuntungan: number
}

export interface LaporanKategori {
  kategori_id: string
  nama: string
  ikon: string
  total: number
  persentase: number
}

export interface LaporanUnitBisnis {
  unit_bisnis_id: string
  nama: string
  pemasukan: number
  pengeluaran: number
  keuntungan: number
  margin: number
}

// ---- API Response ----

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}
