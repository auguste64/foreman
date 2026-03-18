'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createArtisan } from '@/lib/supabase/artisans'
import { useToast } from '@/components/ToastProvider'
import MetierSelect from '@/components/MetierSelect'

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

export default function NouvelArtisanPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    metier: '',
  })

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await createArtisan(form)
      showToast('Artisan ajouté')
      router.push('/dashboard/artisans')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setLoading(false)
    }
  }

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link
          href="/dashboard/artisans"
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
          ← Retour aux artisans
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
          Nouvel artisan
        </h1>
      </div>

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
            <label style={labelStyle}>Nom complet *</label>
            <input
              type="text"
              value={form.nom}
              onChange={set('nom')}
              required
              placeholder="Ex : Jean Martin"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#F97316')}
              onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
            />
          </div>

          <div>
            <label style={labelStyle}>Métier *</label>
            <MetierSelect
              value={form.metier}
              onChange={(v) => setForm((prev) => ({ ...prev, metier: v }))}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                placeholder="jean@exemple.com"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#F97316')}
                onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
              />
            </div>
            <div>
              <label style={labelStyle}>Téléphone *</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={set('telephone')}
                required
                placeholder="06 00 00 00 00"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#F97316')}
                onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
              />
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
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: loading ? '#9E8630' : '#F97316',
                color: '#0D0D0B',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                transition: 'background-color 0.15s',
              }}
            >
              {loading ? 'Création...' : "Créer l'artisan"}
            </button>
            <Link
              href="/dashboard/artisans"
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
