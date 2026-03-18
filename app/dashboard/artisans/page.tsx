'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Artisan } from '@/lib/supabase/artisans'

export default function ArtisansPage() {
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('artisans')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setArtisans(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
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
            Artisans
          </h1>
          <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            {loading ? '…' : `${artisans.length} artisan${artisans.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/dashboard/artisans/nouveau"
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
            letterSpacing: '0.01em',
          }}
        >
          + Nouvel artisan
        </Link>
      </div>

      {loading && (
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
          Chargement…
        </p>
      )}

      {!loading && artisans.length === 0 && (
        <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '80px 24px', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 20px', display: 'block' }}>
            <rect x="10" y="6" width="28" height="36" rx="2" stroke="#1E1E1C" strokeWidth="2"/>
            <circle cx="24" cy="20" r="7" stroke="#1E1E1C" strokeWidth="2"/>
            <path d="M24 29v4M16 42c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 600, color: '#8A8880', marginBottom: '8px' }}>
            Aucun artisan pour l&apos;instant
          </h2>
          <p style={{ color: '#7A7870', fontSize: '13px', marginBottom: '24px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            Ajoutez vos artisans pour les convoquer et suivre leurs interventions.
          </p>
          <Link
            href="/dashboard/artisans/nouveau"
            style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#F97316', color: '#0D0D0B', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            + Ajouter mon premier artisan
          </Link>
        </div>
      )}

      {!loading && artisans.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {artisans.map((artisan) => {
            const initials = artisan.nom.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
            return (
              <Link
                key={artisan.id}
                href={`/dashboard/artisans/${artisan.id}`}
                style={{ textDecoration: 'none', display: 'block', transition: 'all 0.25s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '12px', padding: '28px', height: '100%', boxSizing: 'border-box', transition: 'border-color 0.25s ease' }}>
                  {/* Initials */}
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(249,115,22,0.1)', color: '#F97316', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    {initials}
                  </div>
                  {/* Name + badge */}
                  <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 8px' }}>
                    {artisan.nom}
                  </h3>
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, backgroundColor: 'rgba(249,115,22,0.1)', color: '#F97316', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '14px' }}>
                    {artisan.metier}
                  </span>
                  {/* Contact */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>{artisan.email}</p>
                    <p style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>{artisan.telephone}</p>
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
