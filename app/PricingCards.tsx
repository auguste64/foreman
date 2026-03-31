'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PRICE_ESSENTIEL = process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL!
const PRICE_PRO = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!

const CHECK_ICON_DEFAULT = (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="7.5" fill="none" stroke="#333" />
    <polyline points="4.5,8 7,10.5 11.5,5.5" fill="none" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const CHECK_ICON_ACCENT = (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="7.5" fill="none" stroke="#ea580c" opacity="0.4" />
    <polyline points="4.5,8 7,10.5 11.5,5.5" fill="none" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export default function PricingCards() {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const featuresEssentiel = ['Comptes rendus PDF + email', 'Répertoire artisans & clients', 'Planning / calendrier']
  const featuresComplet = ['Comptes rendus PDF + email', 'Répertoire artisans & clients', 'Planning / calendrier', 'Comptabilité (devis & factures)', 'Analyse & statistiques', 'Toutes les futures fonctionnalités']

  async function handleCheckout(priceId: string, plan: string) {
    setLoadingPlan(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      if (res.status === 401) {
        router.push(`/login?redirect=pricing&plan=${plan}`)
        return
      }

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', maxWidth: '860px', margin: '40px auto 0', padding: '0 24px', justifyContent: 'center', flexWrap: 'wrap' }}>

      {/* Plan Essentiel */}
      <div
        className="anim d1"
        style={{
          flex: '1 1 360px', maxWidth: '400px', padding: '36px 40px',
          background: 'rgba(10,10,9,0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.10)', borderRadius: '20px',
          display: 'flex', flexDirection: 'column',
          animation: 'halo-pulse-subtle 4s ease-in-out infinite',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A8880', marginBottom: '8px' }}>Essentiel</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
          <span style={{ fontSize: '48px', fontWeight: 500, lineHeight: 1, color: '#F0EDE6', fontFamily: 'var(--font-syne), sans-serif' }}>11,90€</span>
          <span style={{ fontSize: '18px', color: '#8A8880' }}>/mois</span>
        </div>
        <div style={{ fontSize: '13px', color: '#8A8880', marginBottom: '24px' }}>Sans engagement · Résiliable à tout moment</div>
        <hr style={{ border: 'none', borderTop: '1px solid #1E1E1C', margin: '0 0 24px 0' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px', flex: 1 }}>
          {featuresEssentiel.map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#F0EDE6' }}>
              {CHECK_ICON_DEFAULT}
              {f}
            </div>
          ))}
        </div>
        <button
          onClick={() => handleCheckout(PRICE_ESSENTIEL, 'essentiel')}
          disabled={loadingPlan !== null}
          style={{
            display: 'block', textAlign: 'center', padding: '14px 32px',
            background: 'transparent', color: '#ea580c',
            border: '1px solid #ea580c', borderRadius: '10px',
            fontSize: '15px', fontWeight: 700,
            fontFamily: 'var(--font-syne), sans-serif', textDecoration: 'none',
            cursor: loadingPlan !== null ? 'not-allowed' : 'pointer',
            opacity: loadingPlan !== null && loadingPlan !== 'essentiel' ? 0.5 : 1,
            animation: 'btn-glow 3s ease-in-out infinite',
            width: '100%',
          }}
        >
          {loadingPlan === 'essentiel' ? 'Chargement...' : 'Commencer →'}
        </button>
      </div>

      {/* Plan Pro */}
      <div
        className="anim d2"
        style={{
          flex: '1 1 360px', maxWidth: '400px', padding: '36px 40px',
          background: 'rgba(10,10,9,0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(234,88,12,0.6)', borderRadius: '20px',
          display: 'flex', flexDirection: 'column', position: 'relative',
          animation: 'halo-pulse 3s ease-in-out infinite',
        }}
      >
        <div style={{
          position: 'absolute', top: '20px', right: '20px',
          background: '#ea580c', color: '#0D0D0B',
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '4px 14px', borderRadius: '20px',
          animation: 'badge-glow 2s ease-in-out infinite',
        }}>Tout inclus</div>
        <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ea580c', marginBottom: '8px' }}>Pro</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
          <span style={{ fontSize: '48px', fontWeight: 500, lineHeight: 1, color: '#F0EDE6', fontFamily: 'var(--font-syne), sans-serif' }}>18,90€</span>
          <span style={{ fontSize: '18px', color: '#8A8880' }}>/mois</span>
        </div>
        <div style={{ fontSize: '13px', color: '#8A8880', marginBottom: '24px' }}>Sans engagement · Résiliable à tout moment</div>
        <hr style={{ border: 'none', borderTop: '1px solid #2a2a27', margin: '0 0 24px 0' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px', flex: 1 }}>
          {featuresComplet.map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#F0EDE6' }}>
              {CHECK_ICON_ACCENT}
              {f}
            </div>
          ))}
        </div>
        <button
          onClick={() => handleCheckout(PRICE_PRO, 'pro')}
          disabled={loadingPlan !== null}
          style={{
            display: 'block', textAlign: 'center', padding: '14px 32px',
            background: '#ea580c', color: '#fff',
            border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: 700,
            fontFamily: 'var(--font-syne), sans-serif', textDecoration: 'none',
            cursor: loadingPlan !== null ? 'not-allowed' : 'pointer',
            opacity: loadingPlan !== null && loadingPlan !== 'pro' ? 0.5 : 1,
            animation: 'btn-glow 2s ease-in-out infinite',
            width: '100%',
          }}
        >
          {loadingPlan === 'pro' ? 'Chargement...' : 'Commencer →'}
        </button>
      </div>

    </div>
  )
}
