'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Email ou mot de passe incorrect.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError("Impossible de créer le compte. " + error.message)
      } else {
        setSuccess('Compte créé ! Vérifiez votre email pour confirmer votre inscription.')
      }
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
        {/* Logo */}
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
            THE <span style={{ color: '#ea580c' }}>BUILDER</span>
          </span>
          <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '8px' }}>
            Gestion de chantier pour architectes
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: '#111110',
            border: '1px solid #1E1E1C',
            borderRadius: '12px',
            padding: '32px',
          }}
        >
          {/* Mode toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#0D0D0B',
              borderRadius: '8px',
              padding: '4px',
              marginBottom: '28px',
            }}
          >
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null) }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.15s',
                  backgroundColor: mode === m ? '#1E1E1C' : 'transparent',
                  color: mode === m ? '#F0EDE6' : '#8A8880',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                }}
              >
                {m === 'login' ? 'Connexion' : 'Créer un compte'}
              </button>
            ))}
          </div>

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
                }}
                onFocus={(e) => (e.target.style.borderColor = '#ea580c')}
                onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
              />
            </div>

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
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
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
                }}
                onFocus={(e) => (e.target.style.borderColor = '#ea580c')}
                onBlur={(e) => (e.target.style.borderColor = '#1E1E1C')}
              />
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: '#E85447', margin: 0 }}>{error}</p>
            )}
            {success && (
              <p style={{ fontSize: '13px', color: '#47E8A0', margin: 0 }}>{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                padding: '12px',
                backgroundColor: loading ? 'rgba(234,88,12,0.5)' : '#ea580c',
                color: '#0D0D0B',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                letterSpacing: '0.02em',
                transition: 'background-color 0.15s',
                minHeight: '44px',
              }}
            >
              {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
