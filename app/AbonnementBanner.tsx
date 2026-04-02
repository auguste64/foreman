'use client'

import { useSearchParams } from 'next/navigation'

type BannerConfig = {
  message: string
  cta: string
}

const BANNERS: Record<string, BannerConfig> = {
  requis: {
    message: 'Un abonnement est requis pour accéder au dashboard.',
    cta: 'Choisir un plan',
  },
  upgrade: {
    message: 'Passez au plan Pro pour accéder à cette fonctionnalité.',
    cta: 'Passer au Pro',
  },
}

export default function AbonnementBanner() {
  const params = useSearchParams()

  const abonnement = params.get('abonnement')
  const upgrade = params.get('upgrade')

  const key = abonnement === 'requis' ? 'requis' : upgrade === 'true' ? 'upgrade' : null
  if (!key) return null

  const { message, cta } = BANNERS[key]

  return (
    <div style={{
      position: 'fixed', top: '70px', left: 0, right: 0, zIndex: 99,
      background: '#111110',
      borderBottom: '1px solid #ea580c',
      padding: '14px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px',
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '14px', color: '#F0EDE6', fontFamily: 'var(--font-jakarta), sans-serif' }}>
        {message}
      </span>
      <a
        href="#tarifs"
        style={{
          fontSize: '13px', fontWeight: 700, color: '#ea580c',
          fontFamily: 'var(--font-syne), sans-serif',
          border: '1px solid #ea580c', borderRadius: '8px',
          padding: '6px 16px', textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {cta}
      </a>
    </div>
  )
}
