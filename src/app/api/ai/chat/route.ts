import { NextResponse } from 'next/server'
import { callAIChat, type ChatMessage } from '@/lib/ai/openrouter'

const SYSTEM = `Kamu adalah asisten keuangan VALTO — aplikasi kas & akuntansi bisnis untuk pengusaha Indonesia.

Tugasmu:
- Jawab pertanyaan seputar keuangan, akuntansi, pajak, arus kas, dan manajemen bisnis
- Bantu pengguna memahami laporan keuangan (laba rugi, neraca, arus kas)
- Berikan saran praktis pengelolaan keuangan bisnis UMKM
- Jelaskan istilah akuntansi dengan bahasa sederhana

Aturan:
- Selalu jawab dalam Bahasa Indonesia yang ramah dan mudah dipahami
- Jawaban ringkas dan langsung ke inti (maks 3-4 paragraf pendek)
- Jika ditanya di luar topik keuangan/bisnis, arahkan kembali dengan sopan
- Gunakan format poin/bullet jika ada langkah-langkah`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json() as { messages: ChatMessage[] }
    if (!messages?.length) return NextResponse.json({ error: 'Pesan kosong' }, { status: 400 })

    const answer = await callAIChat(SYSTEM, messages, 512)
    return NextResponse.json({ answer })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Gagal menghubungi AI' }, { status: 500 })
  }
}
