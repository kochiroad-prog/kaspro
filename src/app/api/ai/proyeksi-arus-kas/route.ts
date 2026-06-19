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

interface TagihanRutinItem {
  nama: string
  nominal: number
  tanggal_tiap_bulan: number
  jenis: string
  hari_lagi: number
}

export async function POST(req: NextRequest) {
  try {
    const {
      utangJatuhTempo,
      utangTerlambat,
      piutangOutstanding,
      tagihanRutinSegera = [],
      kasList,
      tanggalHariIni,
    }: {
      utangJatuhTempo: UtangItem[]
      utangTerlambat: UtangItem[]
      piutangOutstanding: PiutangItem[]
      tagihanRutinSegera: TagihanRutinItem[]
      kasList: KasItem[]
      tanggalHariIni: string
    } = await req.json()

    const totalSaldo = kasList.reduce((s: number, k: KasItem) => s + k.saldo, 0)
    const totalUtangJT = utangJatuhTempo.reduce((s: number, u: UtangItem) => s + u.nominal, 0)
    const totalUtangTerlambat = utangTerlambat.reduce((s: number, u: UtangItem) => s + u.nominal, 0)
    const totalPiutang = piutangOutstanding.reduce((s: number, p: PiutangItem) => s + p.nominal, 0)
    const totalTagihanRutin = tagihanRutinSegera.reduce((s: number, t: TagihanRutinItem) => s + t.nominal, 0)
    const totalKewajibanMendesak = totalUtangJT + totalUtangTerlambat + totalTagihanRutin
    const proyeksiSaldo = totalSaldo - totalKewajibanMendesak

    const formatRp = (n: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

    const utangLines = utangJatuhTempo.length === 0
      ? '  (tidak ada)'
      : utangJatuhTempo.map(u =>
          '  - ' + u.klien + ' | ' + formatRp(u.nominal) +
          ' | JT: ' + (u.jatuh_tempo ? new Date(u.jatuh_tempo).toLocaleDateString('id-ID') : '-') +
          ' | Tipe: ' + u.tipe + ' | ' + u.deskripsi
        ).join('\n')

    const terlambatLines = utangTerlambat.length === 0
      ? '  (tidak ada)'
      : utangTerlambat.map(u =>
          '  - ' + u.klien + ' | ' + formatRp(u.nominal) +
          ' | JT: ' + (u.jatuh_tempo ? new Date(u.jatuh_tempo).toLocaleDateString('id-ID') : '-') +
          ' | Tipe: ' + u.tipe + ' | ' + u.deskripsi
        ).join('\n')

    const piutangLines = piutangOutstanding.length === 0
      ? '  (tidak ada)'
      : piutangOutstanding.map(p =>
          '  - ' + p.klien + ' | ' + formatRp(p.nominal) +
          ' | JT: ' + (p.jatuh_tempo ? new Date(p.jatuh_tempo).toLocaleDateString('id-ID') : 'belum ditetapkan') +
          ' | Tipe: ' + p.tipe + ' | ' + p.deskripsi
        ).join('\n')

    const tagihanLines = tagihanRutinSegera.length === 0
      ? '  (tidak ada)'
      : tagihanRutinSegera.map(t =>
          '  - ' + t.nama + ' | ' + formatRp(t.nominal) +
          ' | Tgl ' + t.tanggal_tiap_bulan + ' tiap bulan' +
          ' | ' + (t.hari_lagi === 0 ? 'HARI INI' : t.hari_lagi + ' hari lagi') +
          ' | Jenis: ' + t.jenis
        ).join('\n')

    const kasLines = kasList.map((k: KasItem) =>
      '  ' + k.nama + ' (' + k.tipe + '): ' + formatRp(k.saldo)
    ).join('\n')

    const bagian1 = 'Kamu adalah AI CFO untuk aplikasi keuangan VALTO.\nHari ini: ' + tanggalHariIni
    const bagian2 = '\n\n=== SALDO KAS ===\n' + kasLines + '\nTOTAL SALDO: ' + formatRp(totalSaldo)
    const bagian3 = '\n\n=== TAGIHAN RUTIN - JATUH DALAM 7 HARI ===\n' + tagihanLines + '\nSUBTOTAL: ' + formatRp(totalTagihanRutin)
    const bagian4 = '\n\n=== UTANG JATUH TEMPO 7 HARI ===\n' + utangLines + '\nSUBTOTAL: ' + formatRp(totalUtangJT)
    const bagian5 = '\n\n=== UTANG TERLAMBAT ===\n' + terlambatLines + '\nSUBTOTAL: ' + formatRp(totalUtangTerlambat)
    const bagian6 = '\n\n=== PIUTANG BELUM TERTAGIH ===\n' + piutangLines + '\nSUBTOTAL: ' + formatRp(totalPiutang)
    const bagian7 = '\n\nTOTAL KEWAJIBAN MENDESAK: ' + formatRp(totalKewajibanMendesak)
    const bagian8 = '\nPROYEKSI SALDO SETELAH KEWAJIBAN: ' + formatRp(proyeksiSaldo)
    const instruksi = '\n\nBuatkan laporan proyeksi arus kas ringkas:\n' +
      '1. RINGKASAN POSISI KAS - saldo vs total kewajiban mendesak\n' +
      '2. PROYEKSI 7 HARI - rincian keluar (tagihan rutin + utang) vs potensi masuk (piutang)\n' +
      '3. KESEHATAN KAS - apakah saldo cukup? jika tidak, berapa kekurangan?\n' +
      '4. PRIORITAS TINDAKAN - urutan bayar/tagih paling mendesak\n' +
      '5. PERINGATAN RISIKO - kondisi kritis yang perlu segera diatasi\n\n' +
      'Gunakan bahasa Indonesia yang profesional, mudah dipahami pemilik bisnis. Gunakan emoji. Sertakan angka rupiah akurat.'

    const prompt = bagian1 + bagian2 + bagian3 + bagian4 + bagian5 + bagian6 + bagian7 + bagian8 + instruksi

    const result = await callAI(prompt, 1200)
    return NextResponse.json({ laporan: result })
  } catch (err) {
    console.error('proyeksi-arus-kas error:', err)
    return NextResponse.json({ error: 'Gagal generate proyeksi' }, { status: 500 })
  }
}
