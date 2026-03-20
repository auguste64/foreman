'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createChantier } from '@/lib/supabase/chantiers'
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

  const [form, setForm] = useState({
    nom: '',
    adresse: '',
    client: '',
    date_debut: '',
    statut: 'En cours' as const,
  })

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await createChantier(form)
      toast.success('Chantier créé')
      router.push('/dashboard/chantiers')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setLoading(false)
    }
  }

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
          <div>
            <label style={labelStyle}>Nom du chantier *</label>
            <input
              type="text"
              value={form.nom}
              onChange={set('nom')}
              required
              placeholder="Ex : Villa Dupont — Rénovation complète"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#ea580c')}
              onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
            />
          </div>

          <div>
            <label style={labelStyle}>Adresse *</label>
            <input
              type="text"
              value={form.adresse}
              onChange={set('adresse')}
              required
              placeholder="Ex : 12 rue de la Paix, 75001 Paris"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#ea580c')}
              onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
            />
          </div>

          <div>
            <label style={labelStyle}>Nom du client *</label>
            <input
              type="text"
              value={form.client}
              onChange={set('client')}
              required
              placeholder="Ex : M. et Mme Dupont"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#ea580c')}
              onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
            />
          </div>

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
