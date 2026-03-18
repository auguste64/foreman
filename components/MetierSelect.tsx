'use client'

import { useState } from 'react'

export const METIERS = [
  'Maçon', 'Carreleur', 'Plombier', 'Électricien', 'Menuisier', 'Charpentier',
  'Couvreur', 'Peintre', 'Plâtrier', 'Isolation / Plaquiste', 'Chauffagiste',
  'Climatisation / VMC', 'Serrurier / Métallier', 'Vitrier', 'Paysagiste',
  'Terrassier', 'Démolition', 'Géomètre', "Bureau d'études", 'Coordinateur OPC',
]

type Props = {
  value: string
  onChange: (value: string) => void
  /** true = mini-form inside a dropdown (smaller padding, border #2A2A28) */
  compact?: boolean
  required?: boolean
}

export default function MetierSelect({ value, onChange, compact = false, required = false }: Props) {
  const [open, setOpen] = useState(false)
  const [isCustom, setIsCustom] = useState(() => value !== '' && !METIERS.includes(value))

  const pad    = compact ? '8px 10px'         : '10px 14px'
  const fs     = compact ? '13px'             : '14px'
  const bdBase = compact ? '1px solid #2A2A28' : '1px solid #1E1E1C'
  const bdOpen = compact ? '1px solid #2A2A28' : '1px solid #ea580c'
  const radius = compact ? '6px'              : '8px'

  function selectMetier(m: string) {
    onChange(m)
    setIsCustom(false)
    setOpen(false)
  }

  function selectCustom() {
    setIsCustom(true)
    onChange('')
    setOpen(false)
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: pad, backgroundColor: '#0D0D0B',
          border: open ? bdOpen : bdBase,
          borderRadius: open ? `${radius} ${radius} 0 0` : radius,
          color: value ? '#F0EDE6' : '#8A8880',
          fontSize: fs, fontFamily: 'var(--font-dm-sans), sans-serif',
          cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box',
          outline: 'none',
        }}
      >
        <span>{value || 'Métier'}</span>
        <span style={{
          fontSize: '9px', color: '#8A8880', display: 'inline-block',
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s',
        }}>▼</span>
      </button>

      {open && (
        <div style={{
          border: '1px solid #2A2A28', borderTop: 'none',
          borderRadius: `0 0 ${radius} ${radius}`,
          backgroundColor: '#1A1A18', maxHeight: '200px', overflowY: 'auto',
        }}>
          {METIERS.map((m, i) => (
            <button
              key={m}
              type="button"
              onClick={() => selectMetier(m)}
              style={{
                width: '100%', display: 'block', padding: pad, textAlign: 'left',
                backgroundColor: value === m ? '#232320' : 'transparent',
                borderTop: i > 0 ? '1px solid #2A2A28' : 'none',
                border: 'none', borderRadius: 0,
                color: value === m ? '#ea580c' : '#F0EDE6',
                fontSize: fs, fontFamily: 'var(--font-dm-sans), sans-serif', cursor: 'pointer',
              }}
              onMouseEnter={(e) => { if (value !== m) e.currentTarget.style.backgroundColor = '#2A2A28' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = value === m ? '#232320' : 'transparent' }}
            >{m}</button>
          ))}
          <button
            type="button"
            onClick={selectCustom}
            style={{
              width: '100%', display: 'block', padding: pad, textAlign: 'left',
              backgroundColor: isCustom ? '#232320' : 'transparent',
              borderTop: '1px solid #2A2A28', border: 'none', borderRadius: 0,
              color: '#8A8880', fontStyle: 'italic',
              fontSize: fs, fontFamily: 'var(--font-dm-sans), sans-serif', cursor: 'pointer',
            }}
            onMouseEnter={(e) => { if (!isCustom) e.currentTarget.style.backgroundColor = '#2A2A28' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isCustom ? '#232320' : 'transparent' }}
          >Autre — saisir un métier</button>
        </div>
      )}

      {isCustom && (
        <input
          autoFocus
          required={required}
          placeholder="Saisir un métier…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%', marginTop: '4px', padding: pad,
            backgroundColor: '#0D0D0B', border: bdBase, borderRadius: radius,
            color: '#F0EDE6', fontSize: fs, outline: 'none',
            fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  )
}
