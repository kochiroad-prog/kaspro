import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/openrouter'

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query || query.length < 2) return NextResponse.json({ filters: {} })

    const today = new Date().toISOString().slice(0, 10)
    const d = new Date()
    const firstOfMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const firstOfYear = `${d.getFullYear()}-01-01`
    d.setMonth(d.getMonth() - 1)
    const prevMonthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const prevMonthEnd = firstOfMonth

    const system = `Kamu adalah parser query pencarian transaksi keuangan Indonesia.
Hari ini: ${today}
Awal bulan ini: ${firstOfMonth}
Awal tahun ini: ${firstOfYear}
Bulan lalu: ${prevMonthStart} s/d ${prevMonthEnd}

Tugas: ubah query menjadi JSON filter. Kembalikan HANYA JSON valid, tanpa markdown, tanpa komentar.
Schema (sertakan hanya field yang relevan, null jika tidak):
{"tipe":"pemasukan"|"pengeluaran"|null,"dari":"YYYY-MM-DD"|null,"sampai":"YYYY-MM-DD"|null,"sort":"terbesar"|"terkecil"|"terbaru"|null,"limit":number|null}`

    const raw = await callAI(system, query, 150)

    // Bersihkan dan parse JSON
    let filters: Record<string, any> = {}
    try {
      const cleaned = raw
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .replace(/\/\/.*/g, '')
        .trim()
      filters = JSON.parse(cleaned)
    } catch {
      // Fallback: parse manual dari query
      const q = query.toLowerCase()
      if (q.includes('masuk') || q.includes('pemasukan')) filters.tipe = 'pemasukan'
      else if (q.includes('keluar') || q.includes('pengeluaran') || q.includes('beban')) filters.tipe = 'pengeluaran'
      if (q.includes('bulan ini')) { filters.dari = firstOfMonth; filters.sampai = today }
      else if (q.includes('bulan lalu')) { filters.dari = prevMonthStart; filters.sampai = prevMonthEnd }
      else if (q.includes('tahun ini')) { filters.dari = firstOfYear; filters.sampai = today }
      if (q.includes('terbesar') || q.includes('terbanyak')) filters.sort = 'terbesar'
      else if (q.includes('terkecil')) filters.sort = 'terkecil'
      const matchNum = q.match(/(\d+)\s*(transaksi|data|terakhir)/)
      if (matchNum) filters.limit = parseInt(matchNum[1])
    }

    return NextResponse.json({ filters })
  } catch (e: any) {
    return NextResponse.json({ filters: {}, error: e.message }, { status: 500 })
  }
}
