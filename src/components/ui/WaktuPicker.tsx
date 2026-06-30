'use client'

import { useState } from 'react'

interface Props {
  defaultValue?: string  // format "HH:MM"
  name: string
}

const JAM = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MENIT = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

export default function WaktuPicker({ defaultValue, name }: Props) {
  const [jam, setJam]     = useState(defaultValue?.slice(0, 2) ?? '00')
  const [menit, setMenit] = useState(defaultValue?.slice(3, 5) ?? '00')

  return (
    <div className="flex items-center gap-1">
      <select
        value={jam}
        onChange={e => setJam(e.target.value)}
        className="input text-center px-2"
        style={{ width: '4rem' }}
      >
        {JAM.map(j => <option key={j} value={j}>{j}</option>)}
      </select>
      <span className="font-bold text-lg" style={{ color: 'var(--text-muted)' }}>:</span>
      <select
        value={menit}
        onChange={e => setMenit(e.target.value)}
        className="input text-center px-2"
        style={{ width: '4rem' }}
      >
        {MENIT.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      {/* Hidden input yang dikirim ke action */}
      <input type="hidden" name={name} value={`${jam}:${menit}`} />
    </div>
  )
}
