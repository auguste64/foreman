'use client'
import { useState } from 'react'

type Props = {
  onConfirm: (date: Date) => void
  onCancel?: () => void
  label?: string
  initialDate?: Date
  minDate?: Date
}

const DAYS_HEADER = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function getMonthCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const total = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= total; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function DatePicker({ onConfirm, onCancel, label, initialDate, minDate }: Props) {
  const fallbackMin = new Date(); fallbackMin.setHours(0, 0, 0, 0)
  const min = minDate ?? null

  const [anchor, setAnchor] = useState(() => {
    const d = new Date(initialDate ?? new Date())
    d.setDate(1)
    return d
  })
  const [selected, setSelected] = useState<Date | null>(initialDate ?? null)

  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const cells = getMonthCells(year, month)

  const isDisabled = (d: Date) => !!min && d < min

  return (
    <div style={{
      background: '#111110', border: '1px solid #1E1E1C', borderRadius: '16px',
      padding: '24px', width: '320px', boxSizing: 'border-box',
      boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
    }}>
      {label && (
        <p style={{ fontSize: '11px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          {label}
        </p>
      )}

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <button
          onClick={() => setAnchor(new Date(year, month - 1, 1))}
          style={{ background: 'none', border: 'none', color: '#8A8880', cursor: 'pointer', fontSize: '18px', padding: '2px 8px', borderRadius: '6px', lineHeight: 1 }}
        >‹</button>
        <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '14px', fontWeight: 600, color: '#F0EDE6' }}>
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={() => setAnchor(new Date(year, month + 1, 1))}
          style={{ background: 'none', border: 'none', color: '#8A8880', cursor: 'pointer', fontSize: '18px', padding: '2px 8px', borderRadius: '6px', lineHeight: 1 }}
        >›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {DAYS_HEADER.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, color: i >= 5 ? '#3A3A37' : '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', padding: '3px 0' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '16px' }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const isWeekend = d.getDay() === 0 || d.getDay() === 6
          const disabled = isDisabled(d)
          const isSelected = selected ? toDateStr(d) === toDateStr(selected) : false
          const isToday = toDateStr(d) === toDateStr(new Date())
          return (
            <button
              key={i}
              onClick={() => !disabled && setSelected(d)}
              style={{
                width: '100%', aspectRatio: '1 / 1', border: 'none', outline: 'none',
                borderRadius: '6px',
                background: isSelected ? '#ea580c' : isToday ? 'rgba(234,88,12,0.1)' : 'transparent',
                color: disabled ? '#2A2A27' : isWeekend ? '#4A4A48' : isSelected ? '#0D0D0B' : '#F0EDE6',
                fontSize: '12px', cursor: disabled ? 'default' : 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: isSelected ? 700 : 400,
                transition: 'all 0.15s',
                animation: isSelected ? 'pulse-orange 1.8s ease-in-out infinite' : 'none',
                boxSizing: 'border-box',
              }}
              onMouseEnter={e => { if (!disabled && !isSelected) e.currentTarget.style.background = 'rgba(234,88,12,0.08)' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(234,88,12,0.1)' : 'transparent' }}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>

      {/* Confirm area */}
      {selected ? (
        <div>
          <div style={{ background: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px' }}>
            <p style={{ fontSize: '11px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Date sélectionnée
            </p>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#F0EDE6', fontFamily: 'var(--font-syne), sans-serif', margin: 0, textTransform: 'capitalize' }}>
              {selected.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => onConfirm(selected)}
            style={{ width: '100%', padding: '11px', background: '#ea580c', border: 'none', borderRadius: '8px', color: '#0D0D0B', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.2s', marginBottom: onCancel ? '8px' : 0 }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(234,88,12,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Confirmer
          </button>
        </div>
      ) : (
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#4A4A48', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
          Cliquez sur une date pour sélectionner
        </p>
      )}

      {onCancel && (
        <button
          onClick={onCancel}
          style={{ width: '100%', padding: '9px', background: 'transparent', border: '1px solid #1E1E1C', borderRadius: '8px', color: '#8A8880', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', marginTop: selected ? '0' : '10px' }}
        >
          Annuler
        </button>
      )}
    </div>
  )
}

/** Overlay wrapper — centres DatePicker over the page */
export function DatePickerOverlay({ onConfirm, onCancel, label, initialDate, minDate }: Props) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9500 }}
      onClick={onCancel}
    >
      <div onClick={e => e.stopPropagation()}>
        <DatePicker onConfirm={onConfirm} onCancel={onCancel} label={label} initialDate={initialDate} minDate={minDate} />
      </div>
    </div>
  )
}

/** Helper: format a YYYY-MM-DD string as display text */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Helper: convert Date to YYYY-MM-DD string */
export function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
