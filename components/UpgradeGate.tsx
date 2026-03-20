'use client'

import { usePlan } from '@/lib/usePlan'

const PLAN_LABELS: Record<'essentiel' | 'complet', string> = {
  essentiel: 'Essentiel',
  complet:   'Pro',
}

export default function UpgradeGate({
  feature,
  requiredPlan,
  children,
}: {
  feature: string
  requiredPlan: 'essentiel' | 'complet'
  children?: React.ReactNode
}) {
  const { isEssentiel, isComplet, loading } = usePlan()

  if (loading) return null

  const hasAccess = requiredPlan === 'essentiel' ? isEssentiel : isComplet
  if (hasAccess) return children ? <>{children}</> : null

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px',
    }}>
      <div style={{
        background: '#111110',
        border: '1px solid #1E1E1C',
        borderRadius: '12px',
        padding: '48px',
        textAlign: 'center',
        maxWidth: '420px',
        width: '100%',
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ display: 'block', margin: '0 auto 20px' }}>
          <rect x="5" y="11" width="14" height="10" rx="2" stroke="#ea580c" strokeWidth="1.5" />
          <path d="M8 11V7a4 4 0 018 0v4" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1.5" fill="#ea580c" />
        </svg>

        <div style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#F0EDE6',
          fontFamily: 'var(--font-syne), sans-serif',
          marginBottom: '10px',
        }}>
          Fonctionnalité réservée au plan {PLAN_LABELS[requiredPlan]}
        </div>

        <div style={{
          fontSize: '14px',
          color: '#8A8880',
          lineHeight: 1.7,
          marginBottom: '28px',
          fontFamily: 'var(--font-dm-sans), sans-serif',
        }}>
          {feature} est disponible à partir du plan {PLAN_LABELS[requiredPlan]}.
        </div>

        <a
          href="/tarifs"
          style={{
            display: 'inline-block',
            background: '#ea580c',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            padding: '12px 28px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontFamily: 'var(--font-syne), sans-serif',
          }}
        >
          Passer au plan {PLAN_LABELS[requiredPlan]} →
        </a>
      </div>
    </div>
  )
}
