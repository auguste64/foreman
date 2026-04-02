'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePlan } from '@/lib/usePlan'

const PRICE_ESSENTIEL = process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL!
const PRICE_PRO = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!

const ESSENTIEL_FEATURES = [
  'Chantiers',
  'Comptes rendus',
  'Artisans',
  'Planning',
  'Clients',
  'Paramètres',
]

const PRO_FEATURES = [
  'Tout l\'Essentiel +',
  'Comptabilité (devis, factures, honoraires)',
  'Documents & Contrats',
  'Finances & Analytics',
  'Statistiques avancées',
]

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="7" cy="7" r="7" fill="rgba(234,88,12,0.15)" />
      <path d="M4 7l2 2 4-4" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function UpgradePage() {
  const router = useRouter()
  const { plan, loading } = usePlan()
  const [loadingPrice, setLoadingPrice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleChoose(priceId: string) {
    setError(null)
    setLoadingPrice(priceId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Une erreur est survenue.')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Impossible de contacter le serveur.')
    } finally {
      setLoadingPrice(null)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0B',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8880', fontSize: 13, fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto 24px' }}
        >
          ← Retour
        </button>
        <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 28, color: '#F0EDE6', margin: '0 0 10px', letterSpacing: '-0.01em' }}>
          Choisissez votre plan
        </h1>
        <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 15, color: '#8A8880', margin: 0 }}>
          Accédez à toutes les fonctionnalités pour gérer vos chantiers efficacement.
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 780,
      }}>
        {/* Essentiel */}
        <PlanCard
          name="Essentiel"
          price="11,90€"
          features={ESSENTIEL_FEATURES}
          priceId={PRICE_ESSENTIEL}
          isCurrent={!loading && plan === 'essentiel'}
          isRecommended={false}
          loading={loadingPrice === PRICE_ESSENTIEL}
          onChoose={() => handleChoose(PRICE_ESSENTIEL)}
        />

        {/* Pro */}
        <PlanCard
          name="Pro"
          price="18,90€"
          features={PRO_FEATURES}
          priceId={PRICE_PRO}
          isCurrent={!loading && plan === 'pro'}
          isRecommended
          loading={loadingPrice === PRICE_PRO}
          onChoose={() => handleChoose(PRICE_PRO)}
        />
      </div>

      {error && (
        <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 13, color: '#dc2626', marginTop: 24 }}>
          {error}
        </p>
      )}
    </div>
  )
}

function PlanCard({
  name,
  price,
  features,
  isCurrent,
  isRecommended,
  loading,
  onChoose,
}: {
  name: string
  price: string
  features: string[]
  priceId: string
  isCurrent: boolean
  isRecommended: boolean
  loading: boolean
  onChoose: () => void
}) {
  return (
    <div style={{
      background: '#111110',
      border: `1px solid ${isRecommended ? '#ea580c' : '#1E1E1C'}`,
      borderRadius: 16,
      padding: '36px 32px',
      width: '100%',
      maxWidth: 340,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      boxShadow: isRecommended ? '0 0 32px rgba(234,88,12,0.12)' : 'none',
    }}>
      {/* Badge Recommandé */}
      {isRecommended && (
        <div style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ea580c',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          padding: '4px 14px',
          borderRadius: 20,
          fontFamily: 'var(--font-syne)',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}>
          Recommandé
        </div>
      )}

      {/* Plan name */}
      <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 13, color: '#ea580c', letterSpacing: '0.1em', marginBottom: 12 }}>
        {name.toUpperCase()}
      </div>

      {/* Price */}
      <div style={{ marginBottom: 28 }}>
        <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 36, color: '#F0EDE6' }}>
          {price}
        </span>
        <span style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 14, color: '#8A8880', marginLeft: 6 }}>
          / mois
        </span>
      </div>

      {/* Features */}
      <ul style={{ listStyle: 'none', margin: '0 0 32px', padding: 0, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 14, color: '#C8C4BC', lineHeight: 1.5 }}>
            <CheckIcon />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrent ? (
        <div style={{
          textAlign: 'center',
          padding: '13px 0',
          borderRadius: 8,
          border: '1px solid #2A2A27',
          fontFamily: 'var(--font-syne)',
          fontWeight: 600,
          fontSize: 14,
          color: '#8A8880',
        }}>
          Plan actuel
        </div>
      ) : (
        <button
          onClick={onChoose}
          disabled={loading}
          style={{
            background: isRecommended ? '#ea580c' : 'transparent',
            color: isRecommended ? '#fff' : '#F0EDE6',
            border: isRecommended ? 'none' : '1px solid #2A2A27',
            borderRadius: 8,
            padding: '13px 0',
            fontFamily: 'var(--font-syne)',
            fontWeight: 600,
            fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.15s, background 0.15s',
            width: '100%',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          {loading ? 'Redirection…' : 'Choisir ce plan'}
        </button>
      )}
    </div>
  )
}
