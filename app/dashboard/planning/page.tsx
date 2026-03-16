'use client'

import { useEffect, useState, useCallback, useRef, Children } from 'react'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  createEvenement, updateEvenement, deleteEvenement,
  TYPE_COLORS, TYPE_LABELS, TYPES,
} from '@/lib/supabase/planning'
import type { Evenement, TypeEvenement, CreateEvenementInput } from '@/lib/supabase/planning'
import type { Chantier } from '@/lib/supabase/chantiers'
import type { Artisan } from '@/lib/supabase/artisans'

// ─── StyledSelect ──────────────────────────────────────────────────────────

function StyledSelect({ value, onChange, children, placeholder }: {
  value: string
  onChange: (v: string) => void
  children: ReactNode
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const options = Children.toArray(children).filter((c: any) => c.props?.value !== undefined)
  const selected = options.find((c: any) => c.props.value === value) as any

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '12px 16px', background: '#111110',
          border: `1px solid ${open ? '#E8C547' : '#1E1E1C'}`,
          boxShadow: open ? '0 0 0 2px rgba(232,197,71,0.15)' : 'none',
          borderRadius: '6px', color: selected ? '#F0EDE6' : '#7A7870',
          fontSize: '14px', cursor: 'pointer', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          transition: 'all 0.2s ease', userSelect: 'none',
          boxSizing: 'border-box',
        }}
      >
        <span>{selected ? selected.props.children : placeholder ?? 'Sélectionner...'}</span>
        <span style={{ color: '#E8C547', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', fontSize: '10px' }}>▼</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#111110', border: '1px solid #E8C547',
          borderRadius: '6px', zIndex: 999, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'dropdownIn 0.15s ease both',
        }}>
          {options.map((opt: any, i: number) => (
            <div
              key={i}
              onClick={() => { onChange(opt.props.value); setOpen(false) }}
              style={{
                padding: '11px 16px', fontSize: '14px', cursor: 'pointer',
                color: opt.props.value === value ? '#E8C547' : '#F0EDE6',
                background: opt.props.value === value ? 'rgba(232,197,71,0.08)' : 'transparent',
                transition: 'all 0.15s ease',
                borderBottom: i < options.length - 1 ? '1px solid #1E1E1C' : 'none',
                fontFamily: 'var(--font-dm-sans), sans-serif',
              }}
              onMouseEnter={e => { if (opt.props.value !== value) (e.currentTarget as HTMLElement).style.background = 'rgba(232,197,71,0.04)' }}
              onMouseLeave={e => { if (opt.props.value !== value) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {opt.props.children}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Calendar helpers ──────────────────────────────────────────────────────

const JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function mondayOf(date: Date): Date {
  const d = new Date(date); d.setHours(0,0,0,0)
  const dow = d.getDay(); const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff); return d
}

function getWeekDays(date: Date): Date[] {
  const mon = mondayOf(date)
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
}

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  let dow = first.getDay(); if (dow === 0) dow = 7
  const start = new Date(first); start.setDate(1 - (dow - 1))
  return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isToday(d: Date) { return isSameDay(d, new Date()) }

function fmtDT(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso); const p = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function toISO(val: string): string { return val ? new Date(val).toISOString() : '' }

function dayDatetimeLocal(day: Date): string {
  const p = (n: number) => n.toString().padStart(2,'0')
  return `${day.getFullYear()}-${p(day.getMonth()+1)}-${p(day.getDate())}T09:00`
}

// ─── Shared styles (module-level, stable) ──────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', backgroundColor: '#0D0D0B',
  border: '1px solid #1E1E1C', borderRadius: '8px', color: '#F0EDE6',
  fontSize: '14px', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif',
  boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '12px', color: '#8A8880', marginBottom: '6px',
  fontFamily: 'var(--font-dm-sans), sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em',
}
const onFocus = (e: React.FocusEvent<HTMLElement>) => { (e.target as HTMLElement).style.borderColor = '#E8C547' }
const onBlur  = (e: React.FocusEvent<HTMLElement>) => { (e.target as HTMLElement).style.borderColor = '#1E1E1C' }

// ─── Form state ────────────────────────────────────────────────────────────
// Plain strings throughout — no nulls in the form, only coerced on submit.

type FormState = {
  titre: string
  type: TypeEvenement
  chantier_id: string      // '' → null
  artisan_id: string       // '' → null
  date_debut_local: string
  date_fin_local: string   // '' → null
  notes: string            // '' → null
}

function emptyForm(): FormState {
  return { titre: '', type: 'reunion', chantier_id: '', artisan_id: '', date_debut_local: '', date_fin_local: '', notes: '' }
}

function formToInput(f: FormState): CreateEvenementInput {
  return {
    titre: f.titre,
    type: f.type,
    chantier_id: f.chantier_id || null,
    artisan_id: f.artisan_id || null,
    date_debut: toISO(f.date_debut_local),
    date_fin: f.date_fin_local ? toISO(f.date_fin_local) : null,
    notes: f.notes || null,
  }
}

function eventToForm(ev: Evenement): FormState {
  return {
    titre: ev.titre,
    type: ev.type,
    chantier_id: ev.chantier_id ?? '',
    artisan_id: ev.artisan_id ?? '',
    date_debut_local: toDatetimeLocal(ev.date_debut),
    date_fin_local: toDatetimeLocal(ev.date_fin),
    notes: ev.notes ?? '',
  }
}

// ─── EventPill — module-level, never recreated ─────────────────────────────

function EventPill({
  ev, small = false, onOpen,
}: {
  ev: Evenement
  small?: boolean
  onOpen: (ev: Evenement) => void
}) {
  const c = TYPE_COLORS[ev.type]
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onOpen(ev) }}
      title={ev.titre}
      style={{
        padding: small ? '1px 6px' : '3px 8px',
        backgroundColor: c.bg, borderLeft: `2px solid ${c.text}`,
        borderRadius: '3px', fontSize: '11px', color: c.text,
        fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 500,
        cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        marginBottom: '2px',
      }}
    >
      {ev.titre}
    </div>
  )
}

// ─── EventFormFields — module-level, never recreated ──────────────────────

function EventFormFields({
  form, onChange, chantiers, artisans,
}: {
  form: FormState
  onChange: (field: keyof FormState, value: string) => void
  chantiers: Chantier[]
  artisans: Artisan[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={lbl}>Titre *</label>
        <input
          type="text"
          value={form.titre}
          onChange={e => onChange('titre', e.target.value)}
          placeholder="Ex : Réunion de chantier"
          style={inp}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={lbl}>Type *</label>
          <StyledSelect value={form.type} onChange={v => onChange('type', v)}>
            <option value="reunion">Réunion de chantier</option>
            <option value="presence_artisan">Présence artisan</option>
            <option value="prochaine_visite">Prochaine visite</option>
          </StyledSelect>
        </div>
        <div>
          <label style={lbl}>Chantier</label>
          <StyledSelect value={form.chantier_id} onChange={v => onChange('chantier_id', v)} placeholder="— Aucun —">
            {chantiers.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </StyledSelect>
        </div>
      </div>

      {form.type === 'presence_artisan' && (
        <div>
          <label style={lbl}>Artisan</label>
          <select
            value={form.artisan_id}
            onChange={e => onChange('artisan_id', e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', background: '#111110',
              border: '1px solid #1E1E1C', borderRadius: '6px', color: '#F0EDE6',
              fontSize: '14px', appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23E8C547' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
              paddingRight: '36px', cursor: 'pointer', outline: 'none',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#E8C547'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(232,197,71,0.15)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <option value="">— Sélectionner —</option>
            {artisans.map(a => (
              <option key={a.id} value={a.id} style={{ backgroundColor: '#111110' }}>{a.nom} · {a.metier}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={lbl}>Date de début *</label>
          <input
            type="datetime-local"
            value={form.date_debut_local}
            onChange={e => onChange('date_debut_local', e.target.value)}
            style={{ ...inp, colorScheme: 'dark' }}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>
        <div>
          <label style={lbl}>Date de fin</label>
          <input
            type="datetime-local"
            value={form.date_fin_local}
            onChange={e => onChange('date_fin_local', e.target.value)}
            style={{ ...inp, colorScheme: 'dark' }}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>
      </div>

      <div>
        <label style={lbl}>Notes</label>
        <textarea
          value={form.notes}
          onChange={e => onChange('notes', e.target.value)}
          rows={3}
          placeholder="Informations complémentaires…"
          style={{ ...inp, resize: 'vertical', lineHeight: '1.5' } as React.CSSProperties}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
    </div>
  )
}

// ─── MonthView — module-level ──────────────────────────────────────────────

function MonthView({
  anchor, evenements, onOpenDetail, onDayClick,
}: {
  anchor: Date
  evenements: Evenement[]
  onOpenDetail: (ev: Evenement) => void
  onDayClick: (dtLocal: string) => void
}) {
  const grid = getMonthGrid(anchor.getFullYear(), anchor.getMonth())
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '1px' }}>
        {JOURS_COURTS.map(j => (
          <div key={j} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '11px', color: '#8A8880',
            fontFamily: 'var(--font-dm-sans), sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {j}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px',
        backgroundColor: '#1E1E1C', border: '1px solid #1E1E1C', borderRadius: '8px', overflow: 'hidden' }}>
        {grid.map((day, i) => {
          const isCurrentMonth = day.getMonth() === anchor.getMonth()
          const dayEvents = evenements.filter(ev => isSameDay(new Date(ev.date_debut), day))
          const today = isToday(day)
          return (
            <div
              key={i}
              onClick={() => onDayClick(dayDatetimeLocal(day))}
              style={{ backgroundColor: '#111110', minHeight: '96px', padding: '6px',
                opacity: isCurrentMonth ? 1 : 0.4, cursor: 'pointer', transition: 'background-color 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#141413' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#111110' }}
            >
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '4px',
                backgroundColor: today ? '#E8C547' : 'transparent',
                fontSize: '12px', fontWeight: today ? 700 : 400,
                color: today ? '#0D0D0B' : '#F0EDE6',
                fontFamily: 'var(--font-dm-sans), sans-serif',
              }}>
                {day.getDate()}
              </div>
              {dayEvents.slice(0, 2).map(ev => (
                <EventPill key={ev.id} ev={ev} small onOpen={onOpenDetail} />
              ))}
              {dayEvents.length > 2 && (
                <div style={{ fontSize: '10px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', paddingLeft: '4px' }}>
                  +{dayEvents.length - 2} autre{dayEvents.length - 2 > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── WeekView — module-level ───────────────────────────────────────────────

function WeekView({
  anchor, evenements, onOpenDetail, onDayClick,
}: {
  anchor: Date
  evenements: Evenement[]
  onOpenDetail: (ev: Evenement) => void
  onDayClick: (dtLocal: string) => void
}) {
  const days = getWeekDays(anchor)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
      {days.map((day, i) => {
        const dayEvents = evenements.filter(ev => isSameDay(new Date(ev.date_debut), day))
        const today = isToday(day)
        return (
          <div key={i} style={{ backgroundColor: '#111110',
            border: `1px solid ${today ? '#E8C547' : '#1E1E1C'}`,
            borderRadius: '10px', overflow: 'hidden', minHeight: '200px' }}>
            <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid #1E1E1C',
              backgroundColor: today ? '#1a1a0d' : 'transparent' }}>
              <div style={{ fontSize: '11px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif',
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {JOURS_COURTS[i]}
              </div>
              <div style={{ fontSize: today ? '20px' : '18px', fontWeight: today ? 700 : 400,
                color: today ? '#E8C547' : '#F0EDE6', fontFamily: 'var(--font-syne), sans-serif', lineHeight: 1.2 }}>
                {day.getDate()}
              </div>
              <div style={{ fontSize: '10px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {MOIS[day.getMonth()].slice(0,3)}
              </div>
            </div>
            <div style={{ padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {dayEvents.map(ev => <EventPill key={ev.id} ev={ev} onOpen={onOpenDetail} />)}
              {dayEvents.length === 0 && (
                <div
                  onClick={() => onDayClick(dayDatetimeLocal(day))}
                  style={{ fontSize: '11px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif',
                    textAlign: 'center', padding: '12px 0', cursor: 'pointer', opacity: 0.5 }}
                >
                  + ajouter
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export default function PlanningPage() {
  const [view, setView]       = useState<'month' | 'week'>('month')
  const [anchor, setAnchor]   = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d })
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [chantiers, setChantiers]   = useState<Chantier[]>([])
  const [artisans, setArtisans]     = useState<Artisan[]>([])
  const [loading, setLoading]       = useState(true)

  // Create modal
  const [showCreate, setShowCreate]   = useState(false)
  const [createForm, setCreateForm]   = useState<FormState>(emptyForm)
  const [creating, setCreating]       = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Detail / edit modal
  const [selected, setSelected]       = useState<Evenement | null>(null)
  const [editMode, setEditMode]       = useState(false)
  const [editForm, setEditForm]       = useState<FormState>(emptyForm)
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [detailError, setDetailError]    = useState<string | null>(null)

  // ── Load reference data once
  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('chantiers').select('*').order('nom').then(r => setChantiers((r.data ?? []) as Chantier[])),
      supabase.from('artisans').select('*').order('nom').then(r => setArtisans((r.data ?? []) as Artisan[])),
    ])
  }, [])

  // ── Load events
  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      let dateStart: string, dateEnd: string
      if (view === 'month') {
        dateStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1).toISOString()
        dateEnd   = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59).toISOString()
      } else {
        const days = getWeekDays(anchor)
        const endDay = new Date(days[6]); endDay.setHours(23,59,59)
        dateStart = days[0].toISOString(); dateEnd = endDay.toISOString()
      }
      const { data, error } = await supabase
        .from('evenements').select('*')
        .gte('date_debut', dateStart).lte('date_debut', dateEnd)
        .order('date_debut', { ascending: true })
      if (!error) setEvenements(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [view, anchor])

  useEffect(() => { loadEvents() }, [loadEvents])

  // ── Navigation
  function navigate(dir: 1 | -1) {
    setAnchor(prev => {
      const d = new Date(prev)
      if (view === 'month') d.setMonth(d.getMonth() + dir)
      else d.setDate(d.getDate() + 7 * dir)
      return d
    })
  }

  function navLabel() {
    if (view === 'month') return `${MOIS[anchor.getMonth()]} ${anchor.getFullYear()}`
    const days = getWeekDays(anchor)
    const s = days[0], e = days[6]
    if (s.getMonth() === e.getMonth()) return `${s.getDate()} – ${e.getDate()} ${MOIS[s.getMonth()]} ${s.getFullYear()}`
    return `${s.getDate()} ${MOIS[s.getMonth()].slice(0,3)} – ${e.getDate()} ${MOIS[e.getMonth()].slice(0,3)} ${s.getFullYear()}`
  }

  // ── Stable callbacks passed to sub-components
  const handleOpenDetail = useCallback((ev: Evenement) => {
    setSelected(ev)
    setEditMode(false)
    setConfirmDelete(false)
    setDetailError(null)
    setEditForm(eventToForm(ev))
  }, [])

  const handleDayClick = useCallback((dtLocal: string) => {
    setCreateForm({ ...emptyForm(), date_debut_local: dtLocal })
    setCreateError(null)
    setShowCreate(true)
  }, [])

  // Stable onChange handlers — functional updates, no deps
  const handleCreateChange = useCallback((field: keyof FormState, value: string) => {
    setCreateForm(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleEditChange = useCallback((field: keyof FormState, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }, [])

  // ── CRUD
  async function handleCreate() {
    if (!createForm.titre || !createForm.date_debut_local) {
      setCreateError('Titre et date de début requis.')
      return
    }
    setCreating(true); setCreateError(null)
    try {
      const ev = await createEvenement(formToInput(createForm))
      setEvenements(prev => [...prev, ev].sort((a,b) => a.date_debut.localeCompare(b.date_debut)))
      setShowCreate(false)
      setCreateForm(emptyForm())
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setCreating(false)
    }
  }

  async function handleSave() {
    if (!selected || !editForm.titre || !editForm.date_debut_local) {
      setDetailError('Titre et date requis.')
      return
    }
    setSaving(true); setDetailError(null)
    try {
      const updated = await updateEvenement(selected.id, formToInput(editForm))
      setEvenements(prev => prev.map(e => e.id === updated.id ? updated : e))
      setSelected(updated)
      setEditMode(false)
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selected) return
    setDeleting(true)
    try {
      await deleteEvenement(selected.id)
      setEvenements(prev => prev.filter(e => e.id !== selected.id))
      setSelected(null)
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : 'Erreur')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
            Planning
          </h1>
          <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '4px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            {evenements.length} événement{evenements.length !== 1 ? 's' : ''} sur la période
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px', overflow: 'hidden' }}>
            {(['month', 'week'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '7px 14px', border: 'none', cursor: 'pointer', fontSize: '13px',
                fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 500,
                backgroundColor: view === v ? '#E8C547' : 'transparent',
                color: view === v ? '#0D0D0B' : '#8A8880', transition: 'all 0.15s',
              }}>
                {v === 'month' ? 'Mois' : 'Semaine'}
              </button>
            ))}
          </div>
          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px', padding: '4px' }}>
            <button onClick={() => navigate(-1)} style={{ padding: '4px 10px', backgroundColor: 'transparent', border: 'none', color: '#8A8880', cursor: 'pointer', fontSize: '16px', borderRadius: '4px' }}>←</button>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', minWidth: '160px', textAlign: 'center' }}>
              {navLabel()}
            </span>
            <button onClick={() => navigate(1)} style={{ padding: '4px 10px', backgroundColor: 'transparent', border: 'none', color: '#8A8880', cursor: 'pointer', fontSize: '16px', borderRadius: '4px' }}>→</button>
          </div>
          <button
            onClick={() => { setCreateForm(emptyForm()); setCreateError(null); setShowCreate(true) }}
            style={{ padding: '8px 16px', backgroundColor: '#E8C547', color: '#0D0D0B', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            + Nouvel événement
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {TYPES.map(t => {
          const c = TYPE_COLORS[t]
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: c.text }} />
              <span style={{ fontSize: '12px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{TYPE_LABELS[t]}</span>
            </div>
          )
        })}
      </div>

      {/* Calendar */}
      {loading ? (
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      ) : view === 'month' ? (
        <MonthView anchor={anchor} evenements={evenements} onOpenDetail={handleOpenDetail} onDayClick={handleDayClick} />
      ) : (
        <WeekView anchor={anchor} evenements={evenements} onOpenDetail={handleOpenDetail} onDayClick={handleDayClick} />
      )}

      {/* ── Create modal ─────────────────────────────────────────────────── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setShowCreate(false)}>
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '32px', maxWidth: '520px', width: '100%', margin: '0 24px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', marginBottom: '20px' }}>
              Nouvel événement
            </h2>
            <EventFormFields
              form={createForm}
              onChange={handleCreateChange}
              chantiers={chantiers}
              artisans={artisans}
            />
            {createError && (
              <p style={{ fontSize: '13px', color: '#E85447', marginTop: '12px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{createError}</p>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={handleCreate} disabled={creating}
                style={{ flex: 1, padding: '10px', backgroundColor: creating ? '#9E8630' : '#E8C547', color: '#0D0D0B', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {creating ? 'Création...' : 'Créer'}
              </button>
              <button onClick={() => setShowCreate(false)}
                style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail / Edit modal ──────────────────────────────────────────── */}
      {selected && !confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => { setSelected(null); setEditMode(false) }}>
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '32px', maxWidth: '520px', width: '100%', margin: '0 24px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>

            {!editMode ? (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 8px' }}>{selected.titre}</h2>
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, backgroundColor: TYPE_COLORS[selected.type].bg, color: TYPE_COLORS[selected.type].text, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                      {TYPE_LABELS[selected.type]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => setEditMode(true)}
                      style={{ padding: '7px 14px', backgroundColor: '#1E1E1C', color: '#F0EDE6', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                      Modifier
                    </button>
                    <button onClick={() => setConfirmDelete(true)}
                      style={{ padding: '7px 14px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#E85447'; e.currentTarget.style.borderColor = '#E85447' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#8A8880'; e.currentTarget.style.borderColor = '#1E1E1C' }}>
                      Supprimer
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {([
                    { label: 'Début', value: fmtDT(selected.date_debut) },
                    { label: 'Fin', value: fmtDT(selected.date_fin) },
                    selected.chantier_id ? { label: 'Chantier', value: chantiers.find(c => c.id === selected.chantier_id)?.nom ?? selected.chantier_id } : null,
                    selected.artisan_id  ? { label: 'Artisan',  value: artisans.find(a => a.id === selected.artisan_id)?.nom ?? selected.artisan_id }   : null,
                    selected.notes       ? { label: 'Notes',    value: selected.notes } : null,
                  ] as ({ label: string; value: string } | null)[]).filter(Boolean).map(item => item && (
                    <div key={item.label}>
                      <span style={{ ...lbl, marginBottom: '2px' }}>{item.label}</span>
                      <p style={{ color: '#F0EDE6', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, lineHeight: '1.5' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setSelected(null); setEditMode(false) }}
                  style={{ marginTop: '24px', width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                  Fermer
                </button>
              </>
            ) : (
              <>
                <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', marginBottom: '20px' }}>
                  Modifier l&apos;événement
                </h2>
                <EventFormFields
                  form={editForm}
                  onChange={handleEditChange}
                  chantiers={chantiers}
                  artisans={artisans}
                />
                {detailError && (
                  <p style={{ fontSize: '13px', color: '#E85447', marginTop: '12px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{detailError}</p>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={handleSave} disabled={saving}
                    style={{ flex: 1, padding: '10px', backgroundColor: saving ? '#9E8630' : '#E8C547', color: '#0D0D0B', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                  <button onClick={() => setEditMode(false)}
                    style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Delete confirm ───────────────────────────────────────────────── */}
      {selected && confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setConfirmDelete(false)}>
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '32px', maxWidth: '400px', width: '100%', margin: '0 24px' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', marginBottom: '12px' }}>Supprimer cet événement ?</h2>
            <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '28px', lineHeight: '1.5' }}>
              <strong style={{ color: '#F0EDE6' }}>{selected.titre}</strong> sera définitivement supprimé.
            </p>
            {detailError && <p style={{ fontSize: '13px', color: '#E85447', marginBottom: '12px' }}>{detailError}</p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleDelete} disabled={deleting}
                style={{ flex: 1, padding: '10px', backgroundColor: '#E85447', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Suppression...' : 'Oui, supprimer'}
              </button>
              <button onClick={() => setConfirmDelete(false)}
                style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
