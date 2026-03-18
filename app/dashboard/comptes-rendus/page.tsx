'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { CompteRenduWithChantier } from '@/lib/supabase/comptes-rendus'

export default function ComptesRendusPage() {
  const [items, setItems] = useState<CompteRenduWithChantier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('comptes_rendus')
      .select('*, chantiers(nom, client, adresse)')
      .order('date_visite', { ascending: false })
      .then(({ data }) => {
        setItems((data ?? []) as CompteRenduWithChantier[])
        setLoading(false)
      })
  }, [])

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
            Comptes rendus
          </h1>
          <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            {loading ? '…' : `${items.length} compte${items.length !== 1 ? 's' : ''} rendu${items.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/dashboard/comptes-rendus/nouveau"
          className="transition-all duration-200 hover:scale-105 hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] active:scale-95"
          style={{
            padding: '10px 20px',
            backgroundColor: '#F97316',
            color: '#0D0D0B',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: 'var(--font-dm-sans), sans-serif',
          }}
        >
          + Nouveau compte rendu
        </Link>
      </div>

      {loading && (
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      )}

      {!loading && items.length === 0 && (
        <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '80px 24px', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 20px', display: 'block' }}>
            <rect x="8" y="6" width="32" height="36" rx="2" stroke="#1E1E1C" strokeWidth="2"/>
            <path d="M14 16h20M14 22h16M14 28h10" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="36" cy="36" r="8" fill="#111110" stroke="#F97316" strokeWidth="2"/>
            <path d="M33 36h6M36 33v6" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 600, color: '#8A8880', marginBottom: '8px' }}>
            Aucun compte rendu pour l&apos;instant
          </h2>
          <p style={{ color: '#7A7870', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '24px' }}>
            Rédigez votre premier compte rendu de visite de chantier.
          </p>
          <Link
            href="/dashboard/comptes-rendus/nouveau"
            style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#F97316', color: '#0D0D0B', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            + Créer mon premier CR
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (() => {
        const grouped = items.reduce((acc, cr) => {
          const key = cr.chantier_id
          if (!acc[key]) acc[key] = { chantier: cr.chantiers, items: [] }
          acc[key].items.push(cr)
          return acc
        }, {} as Record<string, { chantier: any, items: any[] }>)

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {Object.entries(grouped).map(([key, group]) => (
              <div key={key} style={{ marginBottom: '40px' }}>
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #1E1E1C' }}>
                  <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 700, color: '#F0EDE6' }}>
                    {group.chantier?.nom ?? '—'}
                  </span>
                  <span style={{ padding: '2px 8px', backgroundColor: 'rgba(249,115,22,0.1)', color: '#F97316', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    {group.items.length} CR
                  </span>
                </div>

                {/* Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {group.items.map((cr, index) => (
                    <Link
                      key={cr.id}
                      href={`/dashboard/comptes-rendus/${cr.id}`}
                      style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '20px', textDecoration: 'none', transition: 'all 0.15s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(6px)'; e.currentTarget.style.background = 'rgba(249,115,22,0.03)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; }}
                    >
                      {/* Index badge */}
                      <span style={{ padding: '2px 8px', backgroundColor: 'rgba(249,115,22,0.08)', color: '#F97316', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}>
                        CR #{index + 1}
                      </span>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                          <span>{cr.chantiers?.client ?? '—'}</span>
                          {cr.artisans_presents?.length > 0 && (
                            <span>{cr.artisans_presents.length} artisan{cr.artisans_presents.length !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <div style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0, textAlign: 'right' }}>
                        <div>{new Date(cr.date_visite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        {cr.date_prochaine_visite && (
                          <div style={{ fontSize: '12px', color: '#F97316', marginTop: '2px' }}>
                            Prochaine réunion : {new Date(cr.date_prochaine_visite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      })()}
    </div>
  )
}
