'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Chantier } from '@/lib/supabase/chantiers'
import SortPills from '@/components/SortPills'
import { useIsMobile } from '@/lib/useIsMobile'

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
  const isMobile = useIsMobile()
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortChantier>('date_desc')
  const [search, setSearch] = useState('')

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

  const filtered = search.trim()
    ? chantiers.filter(c => c.nom.toLowerCase().includes(search.toLowerCase()))
    : chantiers

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'nom_asc')  return a.nom.localeCompare(b.nom, 'fr')
    if (sort === 'nom_desc') return b.nom.localeCompare(a.nom, 'fr')
    if (sort === 'date_asc') return a.created_at.localeCompare(b.created_at)
    if (sort === 'statut')   return a.statut.localeCompare(b.statut, 'fr')
    return b.created_at.localeCompare(a.created_at) // date_desc
  })

  return (
    <div className="page-enter" style={{ flex: 1, padding: isMobile ? '16px' : '40px', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
            Chantiers
          </h1>
          <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            {loading ? '…' : `${chantiers.length} chantier${chantiers.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: '32px' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="7" cy="7" r="4.5" stroke="#8A8880" strokeWidth="1.5"/>
          <path d="M11 11l3 3" stroke="#8A8880" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un chantier…"
          style={{ width: '100%', padding: '10px 14px 10px 38px', backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px', color: '#F0EDE6', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' }}
          onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(234,88,12,0.12)' }}
          onBlur={e => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {loading && (
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      )}

      {!loading && chantiers.length > 0 && search.trim() && sorted.length === 0 && (
        <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
            Aucun chantier ne correspond à &quot;{search}&quot;.
          </p>
        </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? '12px' : '24px' }}>
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: '#1E1E1C', borderRadius: '4px', height: '4px', overflow: 'hidden', flex: 1 }}>
                      <div
                        style={{ height: '100%', background: '#ea580c', borderRadius: '4px', width: '0%', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        ref={(el) => { if (el) setTimeout(() => { el.style.width = avancement + '%' }, 100 + index * 80) }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0, minWidth: '28px', textAlign: 'right' }}>
                      {avancement}%
                    </span>
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
