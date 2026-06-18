import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/openrouter'

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query || query.length < 3) return NextResponse.json({ filters: {} })

    const today = new Date().toISOString().slice(0, 10)
    const firstOfMonth = today.slice(0, 8) + '01'
    const firstOfYear = today.slice(0, 4) + '-01-01'

    // Hitung "bulan lalu"
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    const prevMonthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const prevMonthEnd = today.slice(0, 8) + '01' // awal bulan ini = akhir bulan lalu range

    const system = `Kamu adalah parser query pencarian transaksi keuangan.
Hari ini: ${today}. Awal bulan ini: ${firstOfMonth}. Awal tahun ini: ${firstOfYear}.
Bulan lalu: ${prevMonthStart} sampai ${prevMonthEnd}.

Ubah query user menjadi JSON filter berikut (hanya sertakan field yang relevan):
{
  "tipe": "pemasukan" | "pengeluaran" | null,
  "dari": "YYYY-MM-DD" | null,
  "sampai": "YYYY-MM-DD" | null,
  "sort": "terbesar" | "terkecil" | "terbaru" | null,
  "limit": number | null
}

Balas HANYA JSON, tanpa markdown, tanpa penjelasan.`

    const result = await callAI(system, query, 128)

    // Parse JSON dari hasil AI
    const cleaned = result.replace(/```json|```/g, '').trim()
    const filters = JSON.parse(cleaned)

    return NextResponse.json({ filters })
  } catch (e: any) {
    return NextResponse.json({ filters: {}, error: e.message }, { status: 500 })
  }
}
