'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Chantier } from '@/lib/supabase/chantiers'
import SortPills from '@/components/SortPills'

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  'En cours': { bg: 'rgba(74,222,128,0.1)', text: '#4ade80' },
  'Terminé':  { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8' },
  'En pause': { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24' },
}

const AVANCEMENT: Record<string, number> = {
  'En cours': 60,
  'Terminé': 100,
  'En pause': 30,
}

type SortChantier = 'date_desc' | 'date_asc' | 'nom_asc' | 'nom_desc' | 'statut'

export default function ChantiersPage() {
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortChantier>('date_desc')

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

  const sorted = [...chantiers].sort((a, b) => {
    if (sort === 'nom_asc')  return a.nom.localeCompare(b.nom, 'fr')
    if (sort === 'nom_desc') return b.nom.localeCompare(a.nom, 'fr')
    if (sort === 'date_asc') return a.created_at.localeCompare(b.created_at)
    if (sort === 'statut')   return a.statut.localeCompare(b.statut, 'fr')
    return b.created_at.localeCompare(a.created_at) // date_desc
  })

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SortPills
            value={sort}
            onChange={v => setSort(v as SortChantier)}
            options={[
              { key: 'nom', label: 'Nom', hasDirection: true, defaultDir: 'asc' },
              { key: 'date', label: 'Date', hasDirection: true, defaultDir: 'desc' },
              { key: 'statut', label: 'Statut' },
            ]}
          />
        <Link
          href="/dashboard/chantiers/nouveau"
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(249,115,22,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          style={{ padding: '10px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', letterSpacing: '0.01em', transition: 'all 0.2s ease' }}
        >
          + Nouveau chantier
        </Link>
        </div>
      </div>

      {loading && (
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      )}

      {!loading && chantiers.length === 0 && (
        <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '80px 24px', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 20px', display: 'block' }}>
            <rect x="4" y="24" width="40" height="20" rx="2" stroke="#1E1E1C" strokeWidth="2"/>
            <path d="M12 24V17a2 2 0 012-2h20a2 2 0 012 2v7" stroke="#1E1E1C" strokeWidth="2"/>
            <path d="M20 34v-6h8v6" stroke="#ea580c" strokeWidth="2"/>
            <path d="M2 24h44" stroke="#ea580c" strokeWidth="2"/>
            <rect x="8" y="28" width="6" height="6" rx="1" fill="#ea580c" opacity="0.4"/>
            <rect x="34" y="28" width="6" height="6" rx="1" fill="#ea580c" opacity="0.4"/>
          </svg>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 600, color: '#8A8880', marginBottom: '8px' }}>
            Aucun chantier pour l&apos;instant
          </h2>
          <p style={{ color: '#7A7870', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '24px' }}>
            Créez votre premier chantier pour commencer à gérer vos projets.
          </p>
          <Link
            href="/dashboard/chantiers/nouveau"
            style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            + Créer mon premier chantier
          </Link>
        </div>
      )}

      {!loading && chantiers.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {sorted.map((c, index) => {
            const colors = STATUT_COLORS[c.statut] ?? STATUT_COLORS['En cours']
            const avancement = AVANCEMENT[c.statut] ?? 20
            return (
              <Link
                key={c.id}
                href={`/dashboard/chantiers/${c.id}`}
                style={{ textDecoration: 'none', display: 'block', transition: 'all 0.25s ease' }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.borderColor = '#ea580c'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(249,115,22,0.1)'
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
                  <p style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 12px' }}>
                    {new Date(c.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>

                  <div style={{ background: '#1E1E1C', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                    <div
                      style={{ height: '100%', background: '#ea580c', borderRadius: '4px', width: '0%', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      ref={(el) => { if (el) setTimeout(() => { el.style.width = avancement + '%' }, 100 + index * 80) }}
                    />
                  </div>

                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
