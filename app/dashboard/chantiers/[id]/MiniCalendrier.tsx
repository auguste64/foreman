'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createEvenement, deleteEvenement, TYPE_COLORS, TYPE_LABELS, TYPES } from '@/lib/supabase/planning'
import { toast } from '@/components/Toast'
import type { Evenement, TypeEvenement, CreateEvenementInput } from '@/lib/supabase/planning'
import type { Artisan } from '@/lib/supabase/artisans'

// ─── Helpers ────────────────────────────────────────────────────────────────

const JOURS = ['L','M','M','J','V','S','D']
const MOIS  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

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

function toDatetimeLocal(y: number, m: number, day: number): string {
  const p = (n: number) => n.toString().padStart(2,'0')
  return `${y}-${p(m+1)}-${p(day)}T09:00`
}

function toISO(val: string): string { return val ? new Date(val).toISOString() : '' }

function fmtDT(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ─── Shared input styles ─────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 12px', backgroundColor: '#0D0D0B',
  border: '1px solid #1E1E1C', borderRadius: '8px', color: '#F0EDE6',
  fontSize: '13px', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif',
  boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '11px', color: '#8A8880', marginBottom: '5px',
  fontFamily: 'var(--font-dm-sans), sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em',
}
const f = (e: React.FocusEvent<HTMLElement>) => { (e.target as HTMLElement).style.borderColor = '#ea580c' }
const b = (e: React.FocusEvent<HTMLElement>) => { (e.target as HTMLElement).style.borderColor = '#1E1E1C' }

// ─── Component ───────────────────────────────────────────────────────────────

interface Props { chantierId: string }

export default function MiniCalendrier({ chantierId }: Props) {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [loading, setLoading] = useState(true)

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateEvenementInput & { date_debut_local: string; date_fin_local: string }>({
    chantier_id: chantierId, titre: '', type: 'visite_architecte',
    date_debut: '', date_fin: null, artisan_id: null, notes: null,
    date_debut_local: '', date_fin_local: '',
  })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Detail modal
  const [selected, setSelected] = useState<Evenement | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const dateStart = new Date(year, month, 1).toISOString()
      const dateEnd   = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
      const { data } = await supabase
        .from('evenements').select('*')
        .eq('chantier_id', chantierId)
        .gte('date_debut', dateStart).lte('date_debut', dateEnd)
        .order('date_debut', { ascending: true })
      setEvenements(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [chantierId, year, month])

  useEffect(() => { loadEvents() }, [loadEvents])

  useEffect(() => {
    createClient().from('artisans').select('*').order('nom')
      .then(r => setArtisans((r.data ?? []) as Artisan[]))
  }, [])

  function navigate(dir: 1 | -1) {
    if (dir === 1) {
      if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
    } else {
      if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
    }
  }

  function openCreate(prefillDate?: string) {
    setForm({
      chantier_id: chantierId, titre: '', type: 'visite_architecte',
      date_debut: '', date_fin: null, artisan_id: null, notes: null,
      date_debut_local: prefillDate ?? '', date_fin_local: '',
    })
    setCreateError(null)
    setShowCreate(true)
  }

  async function handleCreate() {
    if (!form.titre || !form.date_debut_local) { setCreateError('Titre et date requis.'); return }
    setCreating(true); setCreateError(null)
    try {
      const ev = await createEvenement({
        ...form,
        date_debut: toISO(form.date_debut_local),
        date_fin: form.date_fin_local ? toISO(form.date_fin_local) : null,
        artisan_id: form.artisan_id || null,
        notes: form.notes || null,
      })
      setEvenements(prev => [...prev, ev].sort((a,b) => a.date_debut.localeCompare(b.date_debut)))
      setShowCreate(false)
      toast.success('Événement créé')
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!selected) return
    setDeleting(true)
    try {
      await deleteEvenement(selected.id)
      setEvenements(prev => prev.filter(e => e.id !== selected.id))
      setSelected(null)
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const grid = getMonthGrid(year, month)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={() => navigate(-1)} style={{ padding: '3px 8px', background: 'transparent', border: 'none', color: '#8A8880', cursor: 'pointer', fontSize: '14px' }}>←</button>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', minWidth: '120px', textAlign: 'center' }}>
            {MOIS[month]} {year}
          </span>
          <button onClick={() => navigate(1)} style={{ padding: '3px 8px', background: 'transparent', border: 'none', color: '#8A8880', cursor: 'pointer', fontSize: '14px' }}>→</button>
        </div>
        <button
          onClick={() => openCreate()}
          style={{ padding: '6px 12px', backgroundColor: '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}
        >
          + Ajouter
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#8A8880', fontSize: '12px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      ) : (
        <>
          {/* Day name headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '1px' }}>
            {JOURS.map((j, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '10px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', padding: '4px 0' }}>
                {j}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#1E1E1C', border: '1px solid #1E1E1C', borderRadius: '8px', overflow: 'hidden' }}>
            {grid.map((day, i) => {
              const isCurrentMonth = day.getMonth() === month
              const dayEvents = evenements.filter(ev => isSameDay(new Date(ev.date_debut), day))
              const today = isToday(day)
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (dayEvents.length > 0) { setSelected(dayEvents[0]); setConfirmDelete(false) }
                    else openCreate(toDatetimeLocal(day.getFullYear(), day.getMonth(), day.getDate()))
                  }}
                  style={{
                    backgroundColor: '#111110', padding: '4px 2px', textAlign: 'center',
                    opacity: isCurrentMonth ? 1 : 0.35, cursor: 'pointer', minHeight: '36px',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#141413' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#111110' }}
                >
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', margin: '0 auto 3px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: today ? '#ea580c' : 'transparent',
                    fontSize: '11px', fontWeight: today ? 700 : 400,
                    color: today ? '#0D0D0B' : '#F0EDE6',
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                  }}>
                    {day.getDate()}
                  </div>
                  {/* Event dots */}
                  {dayEvents.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', flexWrap: 'wrap' }}>
                      {dayEvents.slice(0, 3).map(ev => (
                        <div key={ev.id} style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: TYPE_COLORS[ev.type].text, flexShrink: 0 }} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Events list for current month */}
          {evenements.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {evenements.map(ev => {
                const c = TYPE_COLORS[ev.type]
                return (
                  <div
                    key={ev.id}
                    onClick={() => { setSelected(ev); setConfirmDelete(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                      backgroundColor: '#0D0D0B', border: '1px solid #1E1E1C', borderLeft: `3px solid ${c.text}`,
                      borderRadius: '6px', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = c.text }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; (e.currentTarget as HTMLElement).style.borderLeftColor = c.text }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.titre}
                      </p>
                      <p style={{ fontSize: '11px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '2px 0 0' }}>
                        {new Date(ev.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {TYPE_LABELS[ev.type]}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Create modal ───────────────────────────────────────────────── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setShowCreate(false)}>
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px', maxWidth: '480px', width: '100%', margin: '0 24px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '17px', fontWeight: 600, color: '#F0EDE6', marginBottom: '18px' }}>
              Nouvel événement
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <div>
                <label style={lbl}>Titre *</label>
                <input type="text" value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
                  placeholder="Ex : Réunion de chantier" style={inp} onFocus={f} onBlur={b} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={lbl}>Type *</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as TypeEvenement }))}
                    style={{ ...inp, cursor: 'pointer' }} onFocus={f} onBlur={b}>
                    {TYPES.map(t => <option key={t} value={t} style={{ backgroundColor: '#111110' }}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Date début *</label>
                  <input type="datetime-local" value={form.date_debut_local}
                    onChange={e => setForm(p => ({ ...p, date_debut_local: e.target.value }))}
                    style={{ ...inp, colorScheme: 'dark' }} onFocus={f} onBlur={b} />
                </div>
              </div>
              <div>
                <label style={lbl}>Date fin</label>
                <input type="datetime-local" value={form.date_fin_local}
                  onChange={e => setForm(p => ({ ...p, date_fin_local: e.target.value }))}
                  style={{ ...inp, colorScheme: 'dark' }} onFocus={f} onBlur={b} />
              </div>
              {form.type === 'presence_artisan' && (
                <div>
                  <label style={lbl}>Artisan</label>
                  <select value={form.artisan_id ?? ''} onChange={e => setForm(p => ({ ...p, artisan_id: e.target.value || null }))}
                    style={{ ...inp, cursor: 'pointer' }} onFocus={f} onBlur={b}>
                    <option value="">— Sélectionner —</option>
                    {artisans.map(a => <option key={a.id} value={a.id} style={{ backgroundColor: '#111110' }}>{a.nom} · {a.metier}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={lbl}>Notes</label>
                <textarea value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value || null }))}
                  rows={2} style={{ ...inp, resize: 'vertical' } as React.CSSProperties} onFocus={f} onBlur={b} />
              </div>
            </div>
            {createError && <p style={{ fontSize: '12px', color: '#E85447', marginTop: '10px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{createError}</p>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
              <button onClick={handleCreate} disabled={creating}
                style={{ flex: 1, padding: '9px', backgroundColor: creating ? '#9E8630' : '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {creating ? 'Création...' : 'Créer'}
              </button>
              <button onClick={() => setShowCreate(false)}
                style={{ flex: 1, padding: '9px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail modal ───────────────────────────────────────────────── */}
      {selected && !confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setSelected(null)}>
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px', maxWidth: '400px', width: '100%', margin: '0 24px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '10px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 6px' }}>{selected.titre}</h3>
                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, backgroundColor: TYPE_COLORS[selected.type].bg, color: TYPE_COLORS[selected.type].text, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                  {TYPE_LABELS[selected.type]}
                </span>
              </div>
              <button onClick={() => setConfirmDelete(true)}
                style={{ padding: '5px 10px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.color = '#E85447'; e.currentTarget.style.borderColor = '#E85447' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#8A8880'; e.currentTarget.style.borderColor = '#1E1E1C' }}>
                Supprimer
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 4px' }}>{fmtDT(selected.date_debut)}</p>
            {selected.notes && <p style={{ fontSize: '13px', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '8px 0 0', lineHeight: '1.5' }}>{selected.notes}</p>}
            <button onClick={() => setSelected(null)}
              style={{ marginTop: '20px', width: '100%', padding: '8px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ── Delete confirm ─────────────────────────────────────────────── */}
      {selected && confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setConfirmDelete(false)}>
          <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px', maxWidth: '380px', width: '100%', margin: '0 24px' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 600, color: '#F0EDE6', marginBottom: '10px' }}>Supprimer cet événement ?</h3>
            <p style={{ color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '20px' }}>
              <strong style={{ color: '#F0EDE6' }}>{selected.titre}</strong> sera définitivement supprimé.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleDelete} disabled={deleting}
                style={{ flex: 1, padding: '9px', backgroundColor: '#E85447', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
              <button onClick={() => setConfirmDelete(false)}
                style={{ flex: 1, padding: '9px', backgroundColor: 'transparent', color: '#8A8880', border: '1px solid #1E1E1C', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
