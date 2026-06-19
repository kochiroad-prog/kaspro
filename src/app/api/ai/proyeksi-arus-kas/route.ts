import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/openrouter'

interface UtangItem {
  klien: string
  nominal: number
  jatuh_tempo: string | null
  tipe: string
  deskripsi: string
}

interface PiutangItem {
  klien: string
  nominal: number
  jatuh_tempo: string | null
  tipe: string
  deskripsi: string
}

interface KasItem {
  nama: string
  saldo: number
  tipe: string
}

export async function POST(req: NextRequest) {
  try {
    const {
      utangJatuhTempo,   // utang yang JT dalam 7 hari ke depan
      utangTerlambat,    // utang yang JT sudah lewat, belum lunas
      piutangOutstanding, // semua piutang belum lunas
      kasList,           // saldo per kas
      tanggalHariIni,
    }: {
      utangJatuhTempo: UtangItem[]
      utangTerlambat: UtangItem[]
      piutangOutstanding: PiutangItem[]
      kasList: KasItem[]
      tanggalHariIni: string
    } = await req.json()

    const totalSaldo = kasList.reduce((s: number, k: KasItem) => s + k.saldo, 0)
    const totalUtangJT = utangJatuhTempo.reduce((s: number, u: UtangItem) => s + u.nominal, 0)
    const totalUtangTerlambat = utangTerlambat.reduce((s: number, u: UtangItem) => s + u.nominal, 0)
    const totalPiutang = piutangOutstanding.reduce((s: number, p: PiutangItem) => s + p.nominal, 0)

    const formatRp = (n: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

    const formatUtangList = (items: UtangItem[]) =>
      items.length === 0
        ? '  (tidak ada)'
        : items.map(u =>
            `  - ${u.klien} | ${formatRp(u.nominal)} | JT: ${u.jatuh_tempo ? new Date(u.jatuh_tempo).toLocaleDateString('id-ID') : '-'} | Tipe: ${u.tipe} | ${u.deskripsi}`
          ).join('\n')

    const formatPiutangList = (items: PiutangItem[]) =>
      items.length === 0
        ? '  (tidak ada)'
        : items.map(p =>
            `  - ${p.klien} | ${formatRp(p.nominal)} | JT: ${p.jatuh_tempo ? new Date(p.jatuh_tempo).toLocaleDateString('id-ID') : 'belum ditetapkan'} | Tipe: ${p.tipe} | ${p.deskripsi}`
          ).join('\n')

    const prompt = `Kamu adalah AI CFO (Chief Financial Officer) untuk aplikasi keuangan VALTO.
Hari ini: ${tanggalHariIni}

DATA KEUANGAN REAL-TIME:

=== SALDO KAS ===
${kasList.map((k: KasItem) => `  ${k.nama} (${k.tipe}): ${formatRp(k.saldo)}`).join('\n')}
TOTAL SALDO: ${formatRp(totalSaldo)}

=== UTANG JATUH TEMPO 7 HARI KE DEPAN (HARUS DIBAYAR) ===
${formatUtangList(utangJatuhTempo)}
SUBTOTAL: ${formatRp(totalUtangJT)}

=== UTANG TERLAMBAT / MELEWATI JATUH TEMPO ===
${formatUtangList(utangTerlambat)}
SUBTOTAL: ${formatRp(totalUtangTerlambat)}

=== PIUTANG BELUM TERTAGIH (POTENSI MASUK) ===
${formatPiutangList(piutangOutstanding)}
SUBTOTAL: ${formatRp(totalPiutang)}

Buatkan laporan proyeksi arus kas dalam format yang jelas dan ringkas. Sertakan:
1. RINGKASAN POSISI KAS — saldo saat ini vs total kewajiban mendesak
2. PROYEKSI 7 HARI KE DEPAN — berapa yang harus keluar, berapa yang bisa masuk
3. KESEHATAN KAS — apakah saldo cukup untuk menutup semua kewajiban jatuh tempo?
4. PRIORITAS TINDAKAN — apa yang harus dilakukan pertama (bayar siapa, tagih siapa)
5. PERINGATAN RISIKO — jika ada kondisi yang perlu diwaspadai

Gunakan bahasa Indonesia yang profesional namun mudah dipahami pemilik bisnis. Gunakan emoji untuk keterbacaan. Sertakan angka rupiah yang akurat.`

    const result = await callAI(prompt, 1200)
    return NextResponse.json({ laporan: result })
  } catch (err) {
    console.error('proyeksi-arus-kas error:', err)
    return NextResponse.json({ error: 'Gagal generate proyeksi' }, { status: 500 })
  }
}
