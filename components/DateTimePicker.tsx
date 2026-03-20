'use client'
import { useState } from 'react'

type Props = {
  onConfirm: (date: Date, heureDebut: string, heureFin: string) => void
  onCancel?: () => void
  takenSlots?: { [day: number]: number[] }
  label?: string
  initialDate?: Date
}

const DAYS_HEADER = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const slots: string[] = []
for (let h = 7; h < 20; h++) {
  for (let m = 0; m < 60; m += 15) {
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
  }
}

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

function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function formatDiff(debut: string, fin: string): string {
  const diff = toMins(fin) - toMins(debut)
  if (diff <= 0) return ''
  const h = Math.floor(diff / 60)
  const m = diff % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h${m.toString().padStart(2, '0')}`
}

const selectStyle: React.CSSProperties = {
  background: '#111110',
  border: '1px solid #1E1E1C',
  borderRadius: '8px',
  color: '#F0EDE6',
  fontSize: '13px',
  padding: '8px 32px 8px 12px',
  width: '100%',
  cursor: 'pointer',
  outline: 'none',
  fontFamily: 'var(--font-dm-sans), sans-serif',
  appearance: 'none',
  WebkitAppearance: 'none',
}

function SelectArrow() {
  return (
    <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="8" viewBox="0 0 12 8" fill="none">
      <path d="M1 1l5 5 5-5" stroke="#8A8880" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function DateTimePicker({ onConfirm, onCancel, takenSlots = {}, label, initialDate }: Props) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [anchor, setAnchor] = useState(() => new Date(initialDate ?? new Date()))
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate ?? null)
  const [heureDebut, setHeureDebut] = useState('')
  const [heureFin, setHeureFin] = useState('')

  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const cells = getMonthCells(year, month)

  const duration = heureDebut && heureFin ? formatDiff(heureDebut, heureFin) : ''
  const canConfirmSlot = !!heureDebut && !!heureFin && toMins(heureFin) > toMins(heureDebut)

  function selectDay(d: Date) {
    setSelectedDate(d)
    setHeureDebut('')
    setHeureFin('')
    setStep(2)
  }

  function isTaken(slot: string): boolean {
    if (!selectedDate) return false
    const h = parseInt(slot.split(':')[0])
    return (takenSlots[selectedDate.getDate()] ?? []).includes(h)
  }

  const dot = (n: number) => (
    <div key={n} style={{
      width: n === step ? '20px' : '8px', height: '8px', borderRadius: '4px',
      background: n < step ? '#22c55e' : n === step ? '#ea580c' : '#1E1E1C',
      transition: 'all 0.3s ease',
      boxShadow: n === step ? '0 0 10px rgba(234,88,12,0.5)' : 'none',
    }} />
  )

  return (
    <div style={{ background: '#111110', border: '1px solid #1E1E1C', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '420px', boxSizing: 'border-box' }}>

      {/* Progress dots */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
        {[1, 2, 3].map(dot)}
      </div>

      {/* ── STEP 1 : Calendrier ─────────────────────────────────────────── */}
      {step === 1 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button onClick={() => setAnchor(new Date(year, month - 1, 1))} style={{ background: 'none', border: 'none', color: '#8A8880', cursor: 'pointer', fontSize: '18px', padding: '4px 10px', borderRadius: '6px', lineHeight: 1 }}>‹</button>
            <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 600, color: '#F0EDE6' }}>{MONTHS[month]} {year}</span>
            <button onClick={() => setAnchor(new Date(year, month + 1, 1))} style={{ background: 'none', border: 'none', color: '#8A8880', cursor: 'pointer', fontSize: '18px', padding: '4px 10px', borderRadius: '6px', lineHeight: 1 }}>›</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '6px' }}>
            {DAYS_HEADER.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: i >= 5 ? '#3A3A37' : '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />
              const isWeekend = d.getDay() === 0 || d.getDay() === 6
              const isPast = d < today
              const isSelected = selectedDate?.getTime() === d.getTime()
              const isToday = d.getTime() === today.getTime()
              return (
                <button key={i} onClick={() => !isPast && selectDay(d)} style={{
                  width: '100%', aspectRatio: '1 / 1', border: 'none', outline: 'none', borderRadius: '8px',
                  background: isSelected ? '#ea580c' : isToday ? 'rgba(234,88,12,0.12)' : 'transparent',
                  color: isPast ? '#2A2A27' : isWeekend ? '#4A4A48' : isSelected ? '#0D0D0B' : '#F0EDE6',
                  fontSize: '13px', cursor: isPast ? 'default' : 'pointer',
                  fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: isSelected ? 700 : 400,
                  transition: 'all 0.15s', boxSizing: 'border-box',
                  animation: isSelected ? 'pulse-orange 1.8s ease-in-out infinite' : 'none',
                }}
                  onMouseEnter={e => { if (!isPast && !isSelected) e.currentTarget.style.background = 'rgba(234,88,12,0.08)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(234,88,12,0.12)' : 'transparent' }}
                >{d.getDate()}</button>
              )
            })}
          </div>

          {onCancel && (
            <button onClick={onCancel} style={{ marginTop: '16px', width: '100%', padding: '10px', background: 'transparent', border: '1px solid #1E1E1C', borderRadius: '8px', color: '#8A8880', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              Annuler
            </button>
          )}
        </>
      )}

      {/* ── STEP 2 : Horaires ───────────────────────────────────────────── */}
      {step === 2 && selectedDate && (
        <>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 4px', textTransform: 'capitalize' }}>
              {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p style={{ fontSize: '12px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>Choisir les horaires</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            {/* Heure de début */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Début
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={heureDebut}
                  onChange={e => {
                    const v = e.target.value
                    setHeureDebut(v)
                    if (heureFin && toMins(heureFin) <= toMins(v)) setHeureFin('')
                  }}
                  style={selectStyle}
                >
                  <option value="">--:--</option>
                  {slots.map(s => (
                    <option key={s} value={s} disabled={isTaken(s)} style={{ backgroundColor: '#111110', color: isTaken(s) ? '#3A3A37' : '#F0EDE6' }}>
                      {s}{isTaken(s) ? ' (indisponible)' : ''}
                    </option>
                  ))}
                </select>
                <SelectArrow />
              </div>
            </div>

            {/* Heure de fin */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Fin
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={heureFin}
                  onChange={e => setHeureFin(e.target.value)}
                  style={selectStyle}
                  disabled={!heureDebut}
                >
                  <option value="">--:--</option>
                  {slots.filter(s => !heureDebut || toMins(s) > toMins(heureDebut)).map(s => (
                    <option key={s} value={s} disabled={isTaken(s)} style={{ backgroundColor: '#111110', color: isTaken(s) ? '#3A3A37' : '#F0EDE6' }}>
                      {s}{isTaken(s) ? ' (indisponible)' : ''}
                    </option>
                  ))}
                </select>
                <SelectArrow />
              </div>
            </div>
          </div>

          {/* Durée */}
          {duration && (
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(234,88,12,0.1)', border: '1px solid rgba(234,88,12,0.25)', borderRadius: '20px', fontSize: '12px', color: '#ea580c', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 600 }}>
                Durée : {duration}
              </span>
            </div>
          )}

          <button
            onClick={() => canConfirmSlot && setStep(3)}
            disabled={!canConfirmSlot}
            style={{ width: '100%', padding: '11px', background: canConfirmSlot ? '#ea580c' : '#1A1A18', border: `1px solid ${canConfirmSlot ? '#ea580c' : '#1E1E1C'}`, borderRadius: '8px', color: canConfirmSlot ? '#0D0D0B' : '#3A3A37', fontSize: '13px', fontWeight: 600, cursor: canConfirmSlot ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-dm-sans), sans-serif', transition: 'all 0.2s', marginBottom: '8px' }}
          >
            Continuer →
          </button>

          <button onClick={() => setStep(1)} style={{ width: '100%', padding: '9px', background: 'transparent', border: '1px solid #1E1E1C', borderRadius: '8px', color: '#8A8880', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            ← Changer de date
          </button>
        </>
      )}

      {/* ── STEP 3 : Confirmation ───────────────────────────────────────── */}
      {step === 3 && selectedDate && heureDebut && heureFin && (
        <>
          <div style={{ background: '#0D0D0B', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            {label && (
              <p style={{ fontSize: '11px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                {label}
              </p>
            )}
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#F0EDE6', fontFamily: 'var(--font-syne), sans-serif', margin: '0 0 8px', textTransform: 'capitalize' }}>
              {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p style={{ fontSize: '15px', color: '#ea580c', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 600, margin: '0 0 4px' }}>
              {heureDebut} — {heureFin}
            </p>
            <p style={{ fontSize: '12px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
              Durée : {formatDiff(heureDebut, heureFin)}
            </p>
          </div>

          <button
            onClick={() => onConfirm(selectedDate, heureDebut, heureFin)}
            style={{ width: '100%', padding: '13px', background: '#ea580c', border: 'none', borderRadius: '10px', color: '#0D0D0B', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '8px', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(234,88,12,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Confirmer
          </button>
          <button onClick={() => setStep(2)} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #1E1E1C', borderRadius: '8px', color: '#8A8880', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            ← Modifier les horaires
          </button>
        </>
      )}
    </div>
  )
}
