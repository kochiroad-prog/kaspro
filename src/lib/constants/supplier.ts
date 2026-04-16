// Konstanta Supplier — BUKAN 'use server', bebas diimport di client & server
export const JENIS_SUPPLIER = [
  'Barang',
  'Jasa',
  'Bahan Baku',
  'Distributor',
  'Grosir',
  'Retailer',
  'Kontraktor',
  'Lainnya',
]

export type JenisSupplier = typeof JENIS_SUPPLIER[number]
