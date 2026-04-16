'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const AI_ENDPOINT = '/api/chat'

const QUICK_PROMPTS = [
  'Bagaimana cara input transaksi?',
  'Apa itu jurnal memorial?',
  'Cara membuat laporan bulanan?',
  'Apa perbedaan debit dan kredit?',
]

export default function AiChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Halo! Saya asisten Praecox 👋\n\nSaya siap membantu Anda memahami cara penggunaan aplikasi ini — mulai dari mencatat transaksi, jurnal akuntansi, laporan keuangan, hingga pengaturan akun.\n\nAda yang bisa saya bantu?',
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionId] = useState(() => `session_${Date.now()}`)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, messages])

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setError('')

    try {
      if (!AI_ENDPOINT) {
        // Demo mode jika endpoint belum dikonfigurasi
        await new Promise(r => setTimeout(r, 800))
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `🔧 **Mode Demo** — AI endpoint belum dikonfigurasi.\n\nUntuk mengaktifkan AI, tambahkan variabel berikut ke file \`.env.local\`:\n\`\`\`\nNEXT_PUBLIC_AI_CHAT_URL=https://your-langgraph-vps.com/api/chat\n\`\`\`\n\nSetelah dikonfigurasi, saya akan terhubung ke LangGraph Anda dan siap menjawab pertanyaan tentang aplikasi ini.`,
          timestamp: new Date(),
        }])
        setLoading(false)
        return
      }

      const res = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: msg,
          context: 'Praecox - Aplikasi Manajemen Keuangan Bisnis',
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const reply = data.reply ?? data.message ?? data.output ?? data.response ?? 'Maaf, tidak ada respons dari server.'

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }])
    } catch (err: any) {
      setError('Gagal terhubung ke AI. Pastikan server LangGraph Anda aktif.')
      console.error('AI Chat error:', err)
    } finally {
      setLoading(false)
    }
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* ── Floating Button ───────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{
          background: open
            ? 'var(--exp)'
            : 'linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)',
          boxShadow: '0 8px 32px rgba(0,212,255,0.35)',
        }}
        title={open ? 'Tutup AI Chat' : 'Buka AI Konsultan'}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <span className="text-2xl select-none">🤖</span>
        )}
      </button>

      {/* ── Chat Panel ────────────────────────────────── */}
      <div
        className="fixed bottom-24 right-6 z-50 flex flex-col transition-all duration-300 origin-bottom-right"
        style={{
          width: '360px',
          maxHeight: '520px',
          transform: open ? 'scale(1)' : 'scale(0.8)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)' }}>
          <div className="text-2xl">🤖</div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Asisten Praecox</p>
            <p className="text-xs text-white/70">Konsultan Aplikasi · LangGraph AI</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-white/70">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          style={{ maxHeight: '320px', background: 'var(--app-bg, #f8fafc)' }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1"
                  style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-2))' }}>
                  🤖
                </div>
              )}
              <div className={`max-w-[78%]`}>
                <div
                  className="px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: m.role === 'user'
                      ? 'linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)'
                      : 'var(--card-bg)',
                    color: m.role === 'user' ? 'white' : 'var(--text)',
                    border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                    borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  }}
                >
                  {m.content}
                </div>
                <p className="text-xs mt-0.5 px-1"
                  style={{ color: 'var(--text-muted)', textAlign: m.role === 'user' ? 'right' : 'left' }}>
                  {formatTime(m.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-2))' }}>🤖</div>
              <div className="px-4 py-3 rounded-2xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '4px 16px 16px 16px' }}>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--brand)', animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--brand)', animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--brand)', animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-xs p-2 rounded-lg text-center" style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 2 && !loading && (
          <div className="px-3 py-2 flex gap-2 flex-wrap flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            {QUICK_PROMPTS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs px-2.5 py-1.5 rounded-full border font-medium hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--brand)', color: 'var(--brand)', background: 'var(--nav-active-bg)' }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Tanya sesuatu tentang aplikasi..."
            className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
            style={{
              background: 'var(--app-bg, #f1f5f9)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
            style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-2))' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
