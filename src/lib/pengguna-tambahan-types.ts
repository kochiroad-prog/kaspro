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
  }
}

export function defaultPermisiMenu(): PermisiMenu {
  const defaultLaporan: PermisiMenuLaporan = { aktif: false, unduh_excel: false, unduh_pdf: false, kirim_excel_email: false, kirim_pdf_email: false }
  return {
    buku_piutang: { aktif: false, melihat_saldo: false, catat_piutang: false, ubah_hapus_piutang: false, unduh_excel: false, unduh_pdf: false, kirim_excel_email: false, kirim_pdf_email: false },
    laporan_harian: { ...defaultLaporan },
    laporan_bulanan: { ...defaultLaporan },
    laporan_tahunan: { ...defaultLaporan },
    laporan_custom: { ...defaultLaporan },
    peralatan: { aktif: false, e_invoice: false, catatan: false },
  }
}
