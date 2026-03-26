'use client'

import { useEffect, useRef, useState } from 'react'

type Option = { value: string; label: string }

type Props = {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  fontSize?: number
}

export default function ArtisanAutocomplete({
  value,
  onChange,
  options,
  placeholder = '— Artisan —',
  fontSize = 13,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync display text when value changes externally
  const selectedLabel = options.find(o => o.value === value)?.label ?? value

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  function handleSelect(opt: Option) {
    onChange(opt.value)
    setOpen(false)
    setQuery('')
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setOpen(false)
    setQuery('')
  }

  const borderColor = open ? '#ea580c' : '#1E1E1C'
  const boxShadow = open ? '0 0 0 2px rgba(249,115,22,0.15)' : 'none'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Input trigger */}
      <div
        style={{
          backgroundColor: '#111110',
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          padding: '8px 32px 8px 12px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'text',
          boxShadow,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          minWidth: 0,
        }}
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
      >
        {open ? (
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={selectedLabel || placeholder}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#F0EDE6',
              fontSize,
              fontFamily: 'var(--font-dm-sans), sans-serif',
              width: '100%',
              padding: 0,
            }}
          />
        ) : (
          <span
            style={{
              color: value ? '#F0EDE6' : '#8A8880',
              fontSize,
              fontFamily: 'var(--font-dm-sans), sans-serif',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {value ? selectedLabel : placeholder}
          </span>
        )}
      </div>

      {/* Clear / chevron icon */}
      <span
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          cursor: value ? 'pointer' : 'default',
          color: '#8A8880',
          fontSize: 11,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
        }}
        onClick={value ? handleClear : () => { setOpen(o => !o); inputRef.current?.focus() }}
      >
        {value ? '×' : '▾'}
      </span>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            zIndex: 100,
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#111110',
            border: '1px solid #1E1E1C',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '10px 14px', color: '#8A8880', fontSize, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              Aucun artisan trouvé
            </div>
          ) : (
            filtered.map(opt => (
              <OptionRow
                key={opt.value}
                opt={opt}
                isSelected={opt.value === value}
                fontSize={fontSize}
                onSelect={() => handleSelect(opt)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function OptionRow({ opt, isSelected, fontSize, onSelect }: {
  opt: Option
  isSelected: boolean
  fontSize: number
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseDown={e => { e.preventDefault(); onSelect() }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '9px 14px',
        color: isSelected ? '#ea580c' : '#F0EDE6',
        cursor: 'pointer',
        fontSize,
        fontFamily: 'var(--font-dm-sans), sans-serif',
        backgroundColor: isSelected || hovered ? '#1E1E1C' : 'transparent',
        fontWeight: isSelected ? 600 : 400,
        transition: 'background-color 0.1s',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {opt.label}
    </div>
  )
}
