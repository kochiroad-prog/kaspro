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
  waktu: string | null
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
  waktu?: string | null
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

// ============================================================
// KasPro V2.0 - Akuntansi Types
// ============================================================

export type TipeAkun = 'header' | 'sub_header' | 'detail'
export type SaldoNormal = 'debit' | 'kredit'
export type StatusJurnal = 'draft' | 'posted' | 'void'
export type AksiAudit = 'create' | 'update' | 'delete' | 'post' | 'void'

// Chart of Accounts (CoA) 7-digit
export interface ChartOfAccounts {
  id: string
  user_id: string
  kode: string              // Format: X.X.XX.XXX
  nama: string
  tipe_akun: TipeAkun
  klasifikasi: number       // 1-9
  saldo_normal: SaldoNormal
  parent_kode: string | null
  is_kas: boolean
  kas_id: string | null
  aktif: boolean
  deskripsi: string
  created_at: string
  updated_at: string
}

// Jurnal Memorial (Double-Entry)
export interface JurnalMemorial {
  id: string
  user_id: string
  nomor: string             // JM-YYYYMM-XXX
  tanggal: string
  keterangan: string
  reff: string
  total_debit: number
  total_kredit: number
  is_balanced: boolean
  status: StatusJurnal
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  details?: JurnalMemorialDetail[]
}

// Jurnal Memorial Detail (Line Items)
export interface JurnalMemorialDetail {
  id: string
  jurnal_id: string
  user_id: string
  coa_id: string
  kode_akun: string
  nama_akun: string
  debit: number
  kredit: number
  keterangan: string
  kode_kas: string          // 'kosongan' atau kas_id
  urutan: number
  created_at: string
  // Joined
  coa?: Pick<ChartOfAccounts, 'id' | 'kode' | 'nama' | 'klasifikasi'>
}

// Mapping Kategori V1 -> CoA V2
export interface KategoriCoaMapping {
  id: string
  user_id: string
  kategori_id: string
  coa_id: string
  created_at: string
}

// Audit Trail
export interface AuditTrail {
  id: string
  user_id: string
  tabel: string
  record_id: string
  aksi: AksiAudit
  data_lama: any
  data_baru: any
  keterangan: string
  created_at: string
}

// ---- V2.0 Form / Input Types ----

export interface CoaInput {
  kode: string
  nama: string
  tipe_akun: TipeAkun
  klasifikasi: number
  saldo_normal: SaldoNormal
  parent_kode?: string
  is_kas?: boolean
  kas_id?: string
  deskripsi?: string
}

export interface JurnalMemorialInput {
  tanggal: string
  keterangan: string
  reff?: string
  details: JurnalDetailInput[]
}

export interface JurnalDetailInput {
  coa_id: string
  kode_akun: string
  nama_akun: string
  debit: number
  kredit: number
  keterangan?: string
  kode_kas?: string        // 'kosongan' or kas_id
}

// ---- V2.0 Dashboard / Report Types ----

export interface NeracaData {
  total_aset: number
  total_kewajiban: number
  total_ekuitas: number
  balanced: boolean
}

export interface LabaRugiData {
  pendapatan: number
  hpp: number
  laba_kotor: number
  beban_operasional: number
  laba_operasional: number
  pendapatan_lain: number
  beban_lain: number
  laba_bersih: number
}

export interface DashboardStatsV2 extends DashboardStats {
  // V2.0 additions
  total_aset: number
  total_kewajiban: number
  total_ekuitas: number
  laba_bersih_bulan_ini: number
}

export interface CoaSearchResult {
  coa_id: string
  kode: string
  nama: string
  deskripsi: string
  similarity: number
}

export interface SaldoAkun {
  coa_id: string
  kode: string
  nama: string
  klasifikasi: number
  saldo: number
}

// ---- API Response ----

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}
