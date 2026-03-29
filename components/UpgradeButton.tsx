'use client'
import { useState } from 'react'
import { toast } from '@/components/Toast'

type Props = {
  priceId: string
  label?: string
  /** Style variant */
  variant?: 'primary' | 'outline'
  style?: React.CSSProperties
}

export default function UpgradeButton({ priceId, label = 'Passer au plan supérieur', variant = 'primary', style }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast.error(data.error ?? 'Impossible de lancer le paiement')
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '11px 24px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'var(--font-syne), sans-serif',
    cursor: loading ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'background 0.15s, opacity 0.15s',
    opacity: loading ? 0.7 : 1,
    ...(variant === 'primary'
      ? { background: '#ea580c', color: '#fff' }
      : { background: 'transparent', color: '#ea580c', border: '1px solid #ea580c' }),
    ...style,
  }

  return (
    <button onClick={handleClick} disabled={loading} style={base}>
      {loading ? (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="2" strokeDasharray="26" strokeDashoffset="8" strokeLinecap="round" />
          </svg>
          Chargement…
        </>
      ) : label}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </button>
  )
}
