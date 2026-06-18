import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/openrouter'

export async function POST(req: NextRequest) {
  try {
    const { catatan, tipe, kategoriList } = await req.json()

    if (!catatan || catatan.length < 3) {
      return NextResponse.json({ kategori_id: null })
    }

    const daftarKategori = (kategoriList as { id: string; nama: string; ikon: string }[])
      .map(k => `- id: "${k.id}", nama: "${k.nama}"`)
      .join('\n')

    const system = `Kamu adalah sistem kategorisasi transaksi keuangan bisnis di Indonesia.
Tugasmu: pilih SATU kategori yang paling sesuai dari daftar berikut untuk transaksi ${tipe === 'pemasukan' ? 'pemasukan (uang masuk)' : 'pengeluaran (uang keluar)'}.
Balas HANYA dengan id kategori yang dipilih, tanpa teks tambahan apapun.

Daftar kategori:
${daftarKategori}`

    const user = `Keterangan transaksi: "${catatan}"`

    const result = await callAI(system, user, 64)

    // Validasi bahwa hasil adalah id yang valid
    const valid = (kategoriList as { id: string }[]).find(k => k.id === result.replace(/"/g, '').trim())

    return NextResponse.json({ kategori_id: valid ? valid.id : null })
  } catch (e: any) {
    return NextResponse.json({ kategori_id: null, error: e.message }, { status: 500 })
  }
}
