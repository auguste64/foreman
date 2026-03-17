'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Chantier } from '@/lib/supabase/chantiers'

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  'En cours': { bg: 'rgba(74,222,128,0.1)', text: '#4ade80' },
  'Terminé':  { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8' },
  'En pause': { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24' },
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
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
            Chantiers
          </h1>
          <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            {loading ? '…' : `${chantiers.length} chantier${chantiers.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/dashboard/chantiers/nouveau"
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(232,197,71,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          style={{ padding: '10px 20px', backgroundColor: '#E8C547', color: '#0D0D0B', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', letterSpacing: '0.01em', transition: 'all 0.2s ease' }}
        >
          + Nouveau chantier
        </Link>
      </div>

      {loading && (
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      )}

      {!loading && chantiers.length === 0 && (
        <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#1E1E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '20px' }}>⬡</div>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', marginBottom: '8px' }}>
            Aucun chantier pour l&apos;instant
          </h2>
          <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            Créez votre premier chantier pour commencer.
          </p>
        </div>
      )}

      {!loading && chantiers.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {chantiers.map((c) => {
            const colors = STATUT_COLORS[c.statut] ?? STATUT_COLORS['En cours']
            return (
              <Link
                key={c.id}
                href={`/dashboard/chantiers/${c.id}`}
                style={{ textDecoration: 'none', display: 'block', transition: 'all 0.25s ease' }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.borderColor = 'rgba(232,197,71,0.4)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = '#1E1E1C'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px', height: '100%', boxSizing: 'border-box', transition: 'border-color 0.25s ease' }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                    <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 700, color: '#F0EDE6', margin: 0, lineHeight: 1.3 }}>
                      {c.nom}
                    </h3>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', backgroundColor: colors.bg, color: colors.text, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {c.statut}
                    </span>
                  </div>

                  {/* Meta */}
                  <p style={{ fontSize: '13px', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 4px' }}>
                    {c.adresse}
                  </p>
                  <p style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 20px' }}>
                    {new Date(c.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>

                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
