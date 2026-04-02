'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CtaButton({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  function handleClick() {
    if (loading) return
    setLoading(true)
    setError(false)

    const timeout = setTimeout(() => {
      setLoading(false)
      setError(true)
    }, 8000)

    router.push('/login')

    // Nettoie le timeout si la navigation réussit (composant démonté)
    return () => clearTimeout(timeout)
  }

  if (error) {
    return (
      <button
        onClick={() => { setError(false) }}
        className={className}
        style={{ transition: 'opacity 0.2s ease, transform 0.2s ease' }}
      >
        Une erreur est survenue, réessayez
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
      style={{
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        opacity: loading ? 0.75 : 1,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {loading && (
        <span style={{
          width: 13,
          height: 13,
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: '#fff',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'cta-spin 0.7s linear infinite',
          flexShrink: 0,
        }} />
      )}
      {loading ? 'Redirection...' : children}
      <style>{`@keyframes cta-spin { to { transform: rotate(360deg) } }`}</style>
    </button>
  )
}
