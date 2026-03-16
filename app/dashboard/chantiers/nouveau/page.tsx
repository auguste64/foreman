'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createChantier } from '@/lib/supabase/chantiers'

const STATUTS = ['En cours', 'En pause', 'Terminé'] as const

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

  const [form, setForm] = useState({
    nom: '',
    adresse: '',
    client: '',
    date_debut: '',
    statut: 'En cours' as typeof STATUTS[number],
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
          style={{
            fontSize: '13px',
            color: '#8A8880',
            textDecoration: 'none',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px',
          }}
        >
          ← Retour aux chantiers
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
              onFocus={(e) => (e.target.style.borderColor = '#E8C547')}
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
              onFocus={(e) => (e.target.style.borderColor = '#E8C547')}
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
              onFocus={(e) => (e.target.style.borderColor = '#E8C547')}
              onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Date de début *</label>
              <input
                type="date"
                value={form.date_debut}
                onChange={set('date_debut')}
                required
                style={{
                  ...inputStyle,
                  colorScheme: 'dark',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#E8C547')}
                onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
              />
            </div>

            <div>
              <label style={labelStyle}>Statut</label>
              <select
                value={form.statut}
                onChange={set('statut')}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 16px',
                  backgroundColor: '#111110',
                  border: '1px solid #1E1E1C',
                  borderRadius: '6px',
                  color: '#F0EDE6',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23E8C547' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#E8C547'; e.target.style.boxShadow = '0 0 0 2px rgba(232,197,71,0.15)' }}
                onBlur={(e) => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s} style={{ backgroundColor: '#111110' }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
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
              className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(232,197,71,0.4)] active:translate-y-0 active:shadow-none"
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: loading ? '#9E8630' : '#E8C547',
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
              className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(232,197,71,0.4)] active:translate-y-0 active:shadow-none"
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
    </div>
  )
}
