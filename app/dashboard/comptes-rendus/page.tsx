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
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
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
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#1E1E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '20px' }}>
            ≡
          </div>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', marginBottom: '8px' }}>
            Aucun compte rendu
          </h2>
          <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            Créez votre premier compte rendu de visite.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((cr) => (
            <Link
              key={cr.id}
              href={`/dashboard/comptes-rendus/${cr.id}`}
              className="transition-all duration-300 hover:scale-[1.02] hover:border-[#E8C547] hover:shadow-[0_0_30px_rgba(232,197,71,0.2)] cursor-pointer"
              style={{
                backgroundColor: '#111110',
                border: '1px solid #1E1E1C',
                borderRadius: '10px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                textDecoration: 'none',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E8C547')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E1E1C')}
            >
              {/* Progression circle */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '2px solid #E8C547',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '13px', fontWeight: 700, color: '#E8C547' }}>
                  {cr.progression}%
                </span>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '15px', fontWeight: 600, color: '#F0EDE6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cr.chantiers?.nom ?? '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                  <span>{cr.chantiers?.client ?? '—'}</span>
                  {cr.artisans_presents?.length > 0 && (
                    <span>{cr.artisans_presents.length} artisan{cr.artisans_presents.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: '120px', flexShrink: 0 }}>
                <div style={{ height: '4px', backgroundColor: '#1E1E1C', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '4px', backgroundColor: '#E8C547', borderRadius: '2px', width: `${cr.progression}%` }} />
                </div>
              </div>

              {/* Date */}
              <div style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0, textAlign: 'right' }}>
                <div>{new Date(cr.date_visite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                {cr.date_prochaine_visite && (
                  <div style={{ fontSize: '12px', color: '#E8C547', marginTop: '2px' }}>
                    Prochaine : {new Date(cr.date_prochaine_visite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
