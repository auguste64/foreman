'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createChantier } from '@/lib/supabase/chantiers'
import { getClients, clientDisplayName } from '@/lib/supabase/clients'
import type { Client } from '@/lib/supabase/clients'
import { toast } from '@/components/Toast'
import { DatePickerOverlay, formatDateDisplay, dateToStr } from '@/components/DatePicker'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  backgroundColor: '#0D0D0B',
  border: '1px solid #1E1E1C',
  borderRadius: '8px',
  color: '#F0EDE6',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'var(--font-dm-sans), sans-serif',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  color: '#8A8880',
  marginBottom: '6px',
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

export default function NouveauChantierPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [clientMode, setClientMode] = useState<'select' | 'free'>('select')

  const [form, setForm] = useState({
    nom: '',
    adresse: '',
    client: '',
    date_debut: '',
    statut: 'En cours' as 'En cours' | 'En pause' | 'Terminé',
    budget_estimatif: '' as string,
    description: '',
  })

  useEffect(() => {
    getClients().then(setClients).catch(() => {})
  }, [])

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await createChantier({
        nom: form.nom,
        adresse: form.adresse,
        client: form.client,
        date_debut: form.date_debut,
        statut: form.statut,
        budget_estimatif: form.budget_estimatif !== '' ? Number(form.budget_estimatif) : null,
        description: form.description || null,
      })
      toast.success('Chantier créé')
      router.push('/dashboard/chantiers')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setLoading(false)
    }
  }

  const focusBorder = (e: React.FocusEvent<HTMLElement>) => { (e.target as HTMLElement).style.borderColor = '#ea580c' }
  const blurBorder  = (e: React.FocusEvent<HTMLElement>) => { (e.target as HTMLElement).style.borderColor = '#1E1E1C' }

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <Link
          href="/dashboard/chantiers"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 16 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
        >
          <span style={{ color: '#ea580c' }}>←</span>
          Retour aux chantiers
        </Link>
        <h1
          style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontSize: '24px',
            fontWeight: 700,
            color: '#F0EDE6',
            margin: 0,
          }}
        >
          Nouveau chantier
        </h1>
      </div>

      {/* Form */}
      <div
        style={{
          backgroundColor: '#111110',
          border: '1px solid #1E1E1C',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '560px',
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Nom */}
          <div>
            <label style={labelStyle}>Nom du chantier *</label>
            <input
              type="text"
              value={form.nom}
              onChange={set('nom')}
              required
              placeholder="Ex : Villa Dupont — Rénovation complète"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          {/* Adresse */}
          <div>
            <label style={labelStyle}>Adresse *</label>
            <input
              type="text"
              value={form.adresse}
              onChange={set('adresse')}
              required
              placeholder="Ex : 12 rue de la Paix, 75001 Paris"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          {/* Client */}
          <div>
            <label style={labelStyle}>Nom du client *</label>
            {clientMode === 'select' ? (
              <select
                value={form.client}
                required
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setClientMode('free')
                    setForm(prev => ({ ...prev, client: '' }))
                  } else {
                    setForm(prev => ({ ...prev, client: e.target.value }))
                  }
                }}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', colorScheme: 'dark', color: form.client ? '#F0EDE6' : '#8A8880' } as React.CSSProperties}
                onFocus={focusBorder}
                onBlur={blurBorder}
              >
                <option value="" style={{ backgroundColor: '#0D0D0B' }}>Sélectionner un client…</option>
                {clients.map(c => {
                  const name = clientDisplayName(c)
                  return (
                    <option key={c.id} value={name} style={{ backgroundColor: '#0D0D0B', color: '#F0EDE6' }}>
                      {name}
                    </option>
                  )
                })}
                <option value="__new__" style={{ backgroundColor: '#0D0D0B', color: '#ea580c' }}>
                  + Nouveau client (saisie libre)
                </option>
              </select>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="text"
                  value={form.client}
                  onChange={set('client')}
                  required
                  placeholder="Ex : M. et Mme Dupont"
                  style={inputStyle}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setClientMode('select'); setForm(prev => ({ ...prev, client: '' })) }}
                  style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#8A8880', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', padding: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ea580c' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#8A8880' }}
                >
                  ← Choisir depuis la liste
                </button>
              </div>
            )}
          </div>

          {/* Date de début */}
          <div>
            <label style={labelStyle}>Date de début *</label>
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#ea580c')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E1E1C')}
            >
              <span style={{ color: form.date_debut ? '#F0EDE6' : '#8A8880' }}>
                {form.date_debut ? formatDateDisplay(form.date_debut) : 'Choisir une date…'}
              </span>
              <span style={{ color: '#ea580c', fontSize: '12px' }}>▼</span>
            </button>
          </div>

          {/* Statut */}
          <div>
            <label style={labelStyle}>Statut initial</label>
            <select
              value={form.statut}
              onChange={set('statut')}
              style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', colorScheme: 'dark' } as React.CSSProperties}
              onFocus={focusBorder}
              onBlur={blurBorder}
            >
              <option value="En cours"  style={{ backgroundColor: '#0D0D0B' }}>En cours</option>
              <option value="En pause"  style={{ backgroundColor: '#0D0D0B' }}>En pause</option>
              <option value="Terminé"   style={{ backgroundColor: '#0D0D0B' }}>Terminé</option>
            </select>
          </div>

          {/* Budget */}
          <div>
            <label style={labelStyle}>Budget estimatif (€)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.budget_estimatif}
              onChange={set('budget_estimatif')}
              placeholder="Ex : 85000"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="Nature des travaux, contexte, remarques…"
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: '#E85447', margin: 0, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="submit"
              disabled={loading}
              className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:translate-y-0 active:shadow-none"
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: loading ? '#9E8630' : '#ea580c',
                color: '#0D0D0B',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
              }}
            >
              {loading ? 'Création...' : 'Créer le chantier'}
            </button>
            <Link
              href="/dashboard/chantiers"
              className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:translate-y-0 active:shadow-none"
              style={{
                padding: '12px 20px',
                backgroundColor: 'transparent',
                color: '#8A8880',
                border: '1px solid #1E1E1C',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>

      {showDatePicker && (
        <DatePickerOverlay
          label="Date de début"
          initialDate={form.date_debut ? new Date(form.date_debut + 'T12:00:00') : undefined}
          onCancel={() => setShowDatePicker(false)}
          onConfirm={(date) => { setForm(prev => ({ ...prev, date_debut: dateToStr(date) })); setShowDatePicker(false) }}
        />
      )}
    </div>
  )
}
