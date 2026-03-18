'use client'

import { useEffect, useRef, useState } from 'react'

type Option = { value: string; label: string; color?: string }

type Props = {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  compact?: boolean
}

export default function CustomSelect({ value, onChange, options, placeholder = 'Sélectionner…', compact = false }: Props) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const selected = options.find(o => o.value === value)

  const triggerBorderColor = open ? '#F97316' : hovered ? '#2E2E2C' : '#1E1E1C'
  const padding = compact ? '6px 10px' : '10px 14px'
  const fontSize = compact ? 12 : 14

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: '#111110',
          border: `1px solid ${triggerBorderColor}`,
          borderRadius: 8,
          padding,
          color: selected ? '#F0EDE6' : '#8A8880',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          boxShadow: open ? '0 0 0 2px rgba(249,115,22,0.15)' : 'none',
          fontFamily: 'var(--font-dm-sans), sans-serif',
          fontSize,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          userSelect: 'none',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1 }}>
          {selected?.color && (
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: selected.color, flexShrink: 0 }} />
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected ? selected.label : placeholder}
          </span>
        </div>
        <span style={{
          color: '#8A8880',
          fontSize: compact ? 10 : 12,
          marginLeft: 6,
          flexShrink: 0,
          display: 'inline-block',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        }}>▾</span>
      </div>

      {/* Dropdown panel */}
      <div style={{
        position: 'absolute',
        zIndex: 50,
        top: 'calc(100% + 4px)',
        left: 0,
        right: 0,
        backgroundColor: '#111110',
        border: '1px solid #1E1E1C',
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        maxHeight: open ? 320 : 0,
        transition: 'max-height 0.2s ease',
        pointerEvents: open ? 'auto' : 'none',
      }}>
        {options.map(option => (
          <OptionRow
            key={option.value}
            option={option}
            isSelected={option.value === value}
            fontSize={fontSize}
            onClick={() => { onChange(option.value); setOpen(false) }}
          />
        ))}
      </div>
    </div>
  )
}

function OptionRow({ option, isSelected, fontSize, onClick }: {
  option: Option
  isSelected: boolean
  fontSize: number
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 14px',
        color: isSelected ? '#F97316' : '#F0EDE6',
        cursor: 'pointer',
        fontSize,
        fontFamily: 'var(--font-dm-sans), sans-serif',
        backgroundColor: isSelected || hovered ? '#1E1E1C' : 'transparent',
        fontWeight: isSelected ? 600 : 400,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'background-color 0.1s',
      }}
    >
      {option.color && (
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: option.color, flexShrink: 0 }} />
      )}
      {option.label}
    </div>
  )
}
