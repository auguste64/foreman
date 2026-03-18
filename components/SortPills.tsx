'use client'

import React from 'react'

type Option = {
  key: string
  label: string
  hasDirection?: boolean
  defaultDir?: 'asc' | 'desc'
}

type Props = {
  value: string
  onChange: (v: string) => void
  options: Option[]
}

export default function SortPills({ value, onChange, options }: Props) {
  // Parse current value into key + direction
  const activeKey = options.find(o => {
    if (!o.hasDirection) return value === o.key
    return value === `${o.key}_asc` || value === `${o.key}_desc`
  })?.key ?? options[0].key

  const activeDir = value.endsWith('_asc') ? 'asc' : value.endsWith('_desc') ? 'desc' : null

  function handleClick(opt: Option) {
    if (!opt.hasDirection) {
      onChange(opt.key)
      return
    }
    if (activeKey === opt.key) {
      // Toggle direction
      onChange(`${opt.key}_${activeDir === 'asc' ? 'desc' : 'asc'}`)
    } else {
      // Activate with default direction
      onChange(`${opt.key}_${opt.defaultDir ?? 'desc'}`)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '11px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', whiteSpace: 'nowrap' }}>
        Trier par
      </span>
      {options.map(opt => {
        const isActive = activeKey === opt.key
        const showDir = isActive && opt.hasDirection && activeDir
        return (
          <button
            key={opt.key}
            onClick={() => handleClick(opt)}
            style={{
              padding: '5px 12px',
              fontSize: '11px',
              borderRadius: '20px',
              fontWeight: 600,
              fontFamily: 'var(--font-dm-sans), sans-serif',
              cursor: 'pointer',
              border: isActive ? '1px solid #ea580c' : '1px solid #1E1E1C',
              backgroundColor: isActive ? 'rgba(234,88,12,0.15)' : 'transparent',
              color: isActive ? '#ea580c' : '#8A8880',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}{showDir ? (activeDir === 'asc' ? ' ↑' : ' ↓') : ''}
          </button>
        )
      })}
    </div>
  )
}
