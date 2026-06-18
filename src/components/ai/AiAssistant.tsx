'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Apa itu Chart of Accounts?',
  'Cara mencatat biaya sewa kantor?',
  'Bedanya laba kotor dan laba bersih?',
  'Tips atur arus kas UMKM',
]

export default function AiAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages([...newMessages, { role: 'assistant', content: data.answer }])
    } catch (e: any) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: '⚠️ Gagal menghubungi AI. Pastikan OPENROUTER_API_KEY sudah diset di Vercel.',
      }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed z-[60] shadow-lg flex items-center justify-center transition-transform active:scale-90"
        style={{
          bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
          right: '16px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: open ? 'var(--exp)' : 'var(--brand)',
          color: '#fff',
          fontSize: '22px',
        }}
        aria-label="Asisten AI"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed z-[60] flex flex-col shadow-2xl"
          style={{
            bottom: 'calc(136px + env(safe-area-inset-bottom, 0px))',
            right: '12px',
            width: 'min(360px, calc(100vw - 24px))',
            height: 'min(480px, calc(100vh - 200px))',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--brand)' }}
          >
            <span className="text-lg">🤖</span>
            <div>
              <p className="text-sm font-bold text-white leading-none">Asisten VALTO</p>
              <p className="text-xs text-white/70 mt-0.5">Tanya seputar keuangan & akuntansi</p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="ml-auto text-xs text-white/60 hover:text-white"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
                  Halo! Ada yang bisa saya bantu?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-xs p-2.5 rounded-xl transition-all"
                      style={{
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="text-sm px-3 py-2 rounded-2xl max-w-[85%]"
                  style={m.role === 'user'
                    ? { background: 'var(--brand)', color: '#fff', borderBottomRightRadius: '4px' }
                    : { background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderBottomLeftRadius: '4px' }
                  }
                >
                  {m.content.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < m.content.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div
                  className="text-sm px-4 py-2.5 rounded-2xl"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderBottomLeftRadius: '4px' }}
                >
                  <span className="flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-2 p-3 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Tanya tentang keuangan..."
              disabled={loading}
              className="flex-1 text-sm rounded-xl px-3 py-2 outline-none"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
              style={{ background: 'var(--brand)', color: '#fff' }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}
