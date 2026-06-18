import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/openrouter'

export async function POST(req: NextRequest) {
  try {
    const { catatan, tipe, coaList } = await req.json()
    if (!catatan || catatan.length < 3 || !coaList?.length) {
      return NextResponse.json({ coa_id: null })
    }

    const daftar = (coaList as { id: string; kode: string; nama: string }[])
      .map(c => `- id: "${c.id}", kode: ${c.kode}, nama: "${c.nama}"`)
      .join('\n')

    const system = `Kamu adalah akuntan Indonesia yang ahli Chart of Accounts (CoA).
Pilih SATU akun CoA paling sesuai untuk transaksi ${tipe === 'pemasukan' ? 'pendapatan/pemasukan' : 'beban/pengeluaran'}.
Balas HANYA dengan id akun yang dipilih, tanpa teks lain.

Daftar akun:
${daftar}`

    const result = await callAI(system, `Keterangan transaksi: "${catatan}"`, 64)
    const coa_id = result.replace(/"/g, '').trim()
    const valid = (coaList as { id: string }[]).find(c => c.id === coa_id)

    return NextResponse.json({ coa_id: valid ? coa_id : null })
  } catch (e: any) {
    return NextResponse.json({ coa_id: null, error: e.message })
  }
}
