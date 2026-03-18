'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ArtisanLoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/artisan/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0D0D0B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span
            style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontSize: '28px',
              fontWeight: 800,
              letterSpacing: '0.15em',
              color: '#F0EDE6',
            }}
          >
            FORE<span style={{ color: '#F97316' }}>MAN</span>
          </span>
          <p
            style={{
              color: '#8A8880',
              fontSize: '14px',
              marginTop: '8px',
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}
          >
            Espace artisan
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#111110',
            border: '1px solid #1E1E1C',
            borderRadius: '12px',
            padding: '32px',
          }}
        >
          {!sent ? (
            <>
              <h2
                style={{
                  fontFamily: 'var(--font-syne), sans-serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#F0EDE6',
                  marginBottom: '8px',
                }}
              >
                Accès artisan
              </h2>
              <p
                style={{
                  color: '#8A8880',
                  fontSize: '13px',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  marginBottom: '24px',
                  lineHeight: '1.6',
                }}
              >
                Entrez votre email pour recevoir un lien de connexion.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      color: '#8A8880',
                      marginBottom: '6px',
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="vous@exemple.com"
                    style={{
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
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#F97316')}
                    onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
                  />
                </div>

                {error && (
                  <p style={{ fontSize: '13px', color: '#E85447', margin: 0, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
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
                  {loading ? 'Envoi...' : 'Recevoir mon lien'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>✉</div>
              <h2
                style={{
                  fontFamily: 'var(--font-syne), sans-serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#F0EDE6',
                  marginBottom: '12px',
                }}
              >
                Lien envoyé !
              </h2>
              <p
                style={{
                  color: '#8A8880',
                  fontSize: '14px',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  lineHeight: '1.6',
                }}
              >
                Vérifiez votre boîte mail à{' '}
                <strong style={{ color: '#F0EDE6' }}>{email}</strong>{' '}
                et cliquez sur le lien pour accéder à votre espace.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
