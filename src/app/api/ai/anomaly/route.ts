import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/openrouter'

export interface Anomaly {
  id: string
  tanggal: string
  jumlah: number
  kategori: string
  catatan: string
  alasan: string
  severity: 'warning' | 'high'
}

export async function POST(req: NextRequest) {
  try {
    const { transaksi } = await req.json()
    if (!transaksi || transaksi.length < 5) {
      return NextResponse.json({ anomalies: [] })
    }

    // Statistik per kategori untuk 30 hari terakhir
    const stats: Record<string, { jumlah: number[]; total: number }> = {}
    for (const tx of transaksi) {
      const kat = tx.kategori?.nama ?? 'Lainnya'
      if (!stats[kat]) stats[kat] = { jumlah: [], total: 0 }
      stats[kat].jumlah.push(tx.jumlah)
      stats[kat].total++
    }

    // Hitung rata-rata dan std dev per kategori
    const ringkasan = Object.entries(stats).map(([nama, s]) => {
      const avg = s.jumlah.reduce((a, b) => a + b, 0) / s.jumlah.length
      const std = Math.sqrt(s.jumlah.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / s.jumlah.length)
      return { nama, avg: Math.round(avg), std: Math.round(std), count: s.total }
    })

    // Temukan kandidat anomali (> rata-rata + 2*std atau > 5x rata-rata)
    const kandidat = transaksi.filter((tx: any) => {
      const kat = tx.kategori?.nama ?? 'Lainnya'
      const s = stats[kat]
      if (!s || s.jumlah.length < 2) return false
      const avg = s.jumlah.reduce((a: number, b: number) => a + b, 0) / s.jumlah.length
      return tx.jumlah > avg * 3
    }).slice(0, 5) // max 5 kandidat

    if (kandidat.length === 0) return NextResponse.json({ anomalies: [] })

    const listKandidat = kandidat.map((tx: any) =>
      `- id: "${tx.id}", tanggal: ${tx.tanggal}, jumlah: Rp${tx.jumlah.toLocaleString('id-ID')}, kategori: "${tx.kategori?.nama ?? 'Lainnya'}", catatan: "${tx.catatan ?? '-'}"`
    ).join('\n')

    const listStats = ringkasan.map(s =>
      `- ${s.nama}: rata-rata Rp${s.avg.toLocaleString('id-ID')}, transaksi: ${s.count}x`
    ).join('\n')

    const system = `Kamu adalah sistem deteksi anomali transaksi keuangan bisnis Indonesia.
Analisis transaksi berikut dan tentukan mana yang benar-benar anomali (tidak wajar).
Balas HANYA JSON array. Sertakan hanya transaksi yang benar-benar mencurigakan.
Format: [{"id":"...","alasan":"penjelasan singkat bahasa Indonesia","severity":"warning"|"high"}]
Jika tidak ada anomali nyata, balas: []`

    const user = `Statistik rata-rata per kategori (30 hari):\n${listStats}\n\nKandidat anomali:\n${listKandidat}`

    const result = await callAI(system, user, 512)
    const cleaned = result.replace(/```json|```/g, '').trim()
    const aiFlags: { id: string; alasan: string; severity: 'warning' | 'high' }[] = JSON.parse(cleaned)

    // Gabungkan dengan data transaksi asli
    const anomalies: Anomaly[] = aiFlags.map(flag => {
      const tx = kandidat.find((t: any) => t.id === flag.id)
      if (!tx) return null
      return {
        id: tx.id,
        tanggal: tx.tanggal,
        jumlah: tx.jumlah,
        kategori: tx.kategori?.nama ?? 'Lainnya',
        catatan: tx.catatan ?? '-',
        alasan: flag.alasan,
        severity: flag.severity,
      }
    }).filter(Boolean)

    return NextResponse.json({ anomalies })
  } catch (e: any) {
    return NextResponse.json({ anomalies: [], error: e.message }, { status: 500 })
  }
}
