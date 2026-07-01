export type PeranPengguna = 'Read Only' | 'Writer' | 'Supervisor' | 'Manager' | 'Custom'

export interface PermisiKas {
  kas_id: string
  nama_kas: string
  aktif: boolean
  melihat_saldo: boolean
  mencatat_transaksi: boolean
  mengedit_transaksi: boolean
  unduh_excel: boolean
  unduh_pdf: boolean
  kirim_excel_email: boolean
  kirim_pdf_email: boolean
}

export interface PermisiMenuLaporan {
  aktif: boolean
  unduh_excel: boolean
  unduh_pdf: boolean
  kirim_excel_email: boolean
  kirim_pdf_email: boolean
}

export interface PermisiMenu {
  buku_piutang: {
    aktif: boolean
    melihat_saldo: boolean
    catat_piutang: boolean
    ubah_hapus_piutang: boolean
    unduh_excel: boolean
    unduh_pdf: boolean
    kirim_excel_email: boolean
    kirim_pdf_email: boolean
  }
  laporan_harian: PermisiMenuLaporan
  laporan_bulanan: PermisiMenuLaporan
  laporan_tahunan: PermisiMenuLaporan
  laporan_custom: PermisiMenuLaporan
  peralatan: {
    aktif: boolean
    e_invoice: boolean
    catatan: boolean
    supplier: boolean
  }
  akuntansi: {
    aktif: boolean
    chart_of_accounts: boolean
    jurnal_memorial: boolean
    neraca: boolean
    laba_rugi: boolean
  }
}

/**
 * Cek apakah sub-user boleh melakukan aksi tulis tertentu ("mencatat_transaksi" atau
 * "mengedit_transaksi") pada sebuah kas.
 * - permisiCustom === null → tidak ada pembatasan (owner / peran non-Custom) → selalu true.
 * - permisiCustom !== null → harus ada entri utk kas_id tsb, aktif=true, dan flag aksi-nya true.
 */
export function canWriteKas(
  permisiCustom: PermisiKas[] | null,
  kasId: string | null | undefined,
  action: 'mencatat_transaksi' | 'mengedit_transaksi'
): boolean {
  if (permisiCustom === null) return true
  if (!kasId) return false
  const perm = permisiCustom.find(p => p.kas_id === kasId)
  return !!perm && perm.aktif && !!perm[action]
}

export function defaultPermisiMenu(): PermisiMenu {
  const defaultLaporan: PermisiMenuLaporan = { aktif: false, unduh_excel: false, unduh_pdf: false, kirim_excel_email: false, kirim_pdf_email: false }
  return {
    buku_piutang: { aktif: false, melihat_saldo: false, catat_piutang: false, ubah_hapus_piutang: false, unduh_excel: false, unduh_pdf: false, kirim_excel_email: false, kirim_pdf_email: false },
    laporan_harian: { ...defaultLaporan },
    laporan_bulanan: { ...defaultLaporan },
    laporan_tahunan: { ...defaultLaporan },
    laporan_custom: { ...defaultLaporan },
    peralatan: { aktif: false, e_invoice: false, catatan: false, supplier: false },
    akuntansi: { aktif: false, chart_of_accounts: false, jurnal_memorial: false, neraca: false, laba_rugi: false },
  }
}
