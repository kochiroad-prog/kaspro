'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getAbsenClient() {
  const url = process.env.ABSEN_SUPABASE_URL
  const key = process.env.ABSEN_SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('ABSEN_SUPABASE_URL atau ABSEN_SUPABASE_SERVICE_KEY belum diset di env')
  return createSupabaseClient(url, key)
}

export interface RekapGajiKaryawan {
  payroll_id: string
  employee_id: string
  nama: string
  perusahaan: string
  bulan: number
  tahun: number
  hari_efektif: number
  hari_absen: number
  gaji_pokok: number
  total_gaji: number
  status: string
  catatan: string | null
}

export async function getRekapGaji(bulan: number, tahun: number): Promise<{ data: RekapGajiKaryawan[] | null; error: string | null }> {
  try {
    const absen = getAbsenClient()

    const { data, error } = await absen
      .from('payroll')
      .select(`
        id,
        employee_id,
        bulan,
        tahun,
        hari_efektif,
        hari_absen,
        gaji_pokok,
        total_gaji,
        status,
        catatan,
        employees!inner(nama, perusahaan)
      `)
      .eq('bulan', bulan)
      .eq('tahun', tahun)

    if (error) return { data: null, error: error.message }

    const mapped: RekapGajiKaryawan[] = (data || []).map((row: any) => ({
      payroll_id: row.id,
      employee_id: row.employee_id,
      nama: row.employees?.nama ?? '-',
      perusahaan: row.employees?.perusahaan ?? '-',
      bulan: row.bulan,
      tahun: row.tahun,
      hari_efektif: row.hari_efektif ?? 0,
      hari_absen: row.hari_absen ?? 0,
      gaji_pokok: row.gaji_pokok ?? 0,
      total_gaji: row.total_gaji ?? 0,
      status: row.status ?? 'Draft',
      catatan: row.catatan ?? null,
    })).sort((a, b) => a.perusahaan.localeCompare(b.perusahaan) || a.nama.localeCompare(b.nama))

    return { data: mapped, error: null }
  } catch (e: any) {
    return { data: null, error: e.message }
  }
}

export async function bayarGajiKaryawan(
  namaKaryawan: string,
  perusahaan: string,
  totalGaji: number,
  kasId: string,
  kategoriId: string,
  bulan: number,
  tahun: number
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const bulanStr = new Date(tahun, bulan - 1, 1).toLocaleString('id-ID', { month: 'long' })

  const { error } = await supabase
    .from('transaksi')
    .insert({
      user_id: user.id,
      kas_id: kasId,
      kategori_id: kategoriId,
      tipe: 'pengeluaran',
      jumlah: totalGaji,
      catatan: `[Gaji] ${namaKaryawan} - ${perusahaan} ${bulanStr} ${tahun}`,
      tanggal: new Date().toISOString().split('T')[0],
    })

  if (error) return { error: error.message }
  return { error: null }
}

export async function bayarSemuaGajiPerusahaan(
  karyawanList: Array<{ nama: string; perusahaan: string; total_gaji: number }>,
  kasId: string,
  kategoriId: string,
  bulan: number,
  tahun: number
): Promise<{ berhasil: number; gagal: number; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { berhasil: 0, gagal: 0, error: 'Unauthorized' }

  const bulanStr = new Date(tahun, bulan - 1, 1).toLocaleString('id-ID', { month: 'long' })
  const today = new Date().toISOString().split('T')[0]

  const rows = karyawanList.map(k => ({
    user_id: user.id,
    kas_id: kasId,
    kategori_id: kategoriId,
    tipe: 'pengeluaran',
    jumlah: k.total_gaji,
    catatan: `[Gaji] ${k.nama} - ${k.perusahaan} ${bulanStr} ${tahun}`,
    tanggal: today,
  }))

  const { error } = await supabase.from('transaksi').insert(rows)
  if (error) return { berhasil: 0, gagal: karyawanList.length, error: error.message }

  return { berhasil: karyawanList.length, gagal: 0, error: null }
}
