'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Chantier } from '@/lib/supabase/chantiers'

const STATUT_COLORS: Record<Chantier['statut'], { bg: string; text: string }> = {
  'En cours': { bg: '#1a2e1a', text: '#4ade80' },
  'Terminé':  { bg: '#1a1a2e', text: '#818cf8' },
  'En pause': { bg: '#2e2a1a', text: '#fbbf24' },
}

export default function ChantiersPage() {
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('chantiers')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setChantiers(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontSize: '24px',
              fontWeight: 700,
              color: '#F0EDE6',
              margin: 0,
            }}
          >
            Chantiers
          </h1>
          <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            {loading ? '…' : `${chantiers.length} chantier${chantiers.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/dashboard/chantiers/nouveau"
          className="transition-all duration-200 hover:scale-105 hover:shadow-[0_0_25px_rgba(232,197,71,0.5)] active:scale-95"
          style={{
            padding: '10px 20px',
            backgroundColor: '#E8C547',
            color: '#0D0D0B',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            letterSpacing: '0.01em',
          }}
        >
          + Nouveau chantier
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
          Chargement…
        </p>
      )}

      {/* Empty state */}
      {!loading && chantiers.length === 0 && (
        <div
          style={{
            backgroundColor: '#111110',
            border: '1px dashed #1E1E1C',
            borderRadius: '12px',
            padding: '80px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#1E1E1C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '20px',
            }}
          >
            ⬡
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontSize: '18px',
              fontWeight: 600,
              color: '#F0EDE6',
              marginBottom: '8px',
            }}
          >
            Aucun chantier pour l&apos;instant
          </h2>
          <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            Créez votre premier chantier pour commencer.
          </p>
        </div>
      )}

      {/* List */}
      {!loading && chantiers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {chantiers.map((c) => {
            const colors = STATUT_COLORS[c.statut] ?? STATUT_COLORS['En cours']
            return (
              <Link
                key={c.id}
                href={`/dashboard/chantiers/${c.id}`}
                className="transition-all duration-300 hover:scale-[1.02] hover:border-[#E8C547] hover:shadow-[0_0_30px_rgba(232,197,71,0.2)] cursor-pointer"
                style={{
                  backgroundColor: '#111110',
                  border: '1px solid #1E1E1C',
                  borderRadius: '10px',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E8C547')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E1E1C')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-syne), sans-serif',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#F0EDE6',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {c.nom}
                    </span>
                    <span
                      style={{
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 500,
                        fontFamily: 'var(--font-dm-sans), sans-serif',
                        backgroundColor: colors.bg,
                        color: colors.text,
                        flexShrink: 0,
                      }}
                    >
                      {c.statut}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '20px',
                      fontSize: '13px',
                      color: '#8A8880',
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                    }}
                  >
                    <span>{c.client}</span>
                    <span>{c.adresse}</span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#8A8880',
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    flexShrink: 0,
                  }}
                >
                  {new Date(c.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
