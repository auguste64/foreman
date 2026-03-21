'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Artisan } from '@/lib/supabase/artisans'
import GoogleContactsModal from '@/components/GoogleContactsModal'
import SortPills from '@/components/SortPills'
import { useIsMobile } from '@/lib/useIsMobile'

type SortArtisan = 'date_desc' | 'date_asc' | 'nom_asc' | 'nom_desc' | 'metier'

export default function ArtisansPage() {
  const isMobile = useIsMobile()
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [loading, setLoading] = useState(true)
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [sort, setSort] = useState<SortArtisan>('date_desc')
  const [search, setSearch] = useState('')

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
    <div className="page-enter" style={{ flex: 1, padding: isMobile ? '16px' : '40px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <SortPills
            value={sort}
            onChange={v => setSort(v as SortArtisan)}
            options={[
              { key: 'nom', label: 'Nom', hasDirection: true, defaultDir: 'asc' },
              { key: 'date', label: 'Date', hasDirection: true, defaultDir: 'desc' },
              { key: 'metier', label: 'Métier' },
            ]}
          />
          <button
            onClick={() => setShowGoogleModal(true)}
            style={{ padding: '10px 16px', backgroundColor: 'transparent', color: '#ea580c', border: '1px solid #ea580c', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            ↓ Importer des contacts
          </button>
          <Link
            href="/dashboard/artisans/nouveau"
            className="transition-all duration-200 hover:scale-105 hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] active:scale-95"
            style={{ padding: '10px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', letterSpacing: '0.01em' }}
          >
            + Nouvel artisan
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
          placeholder="Rechercher par nom ou métier…"
          style={{ width: '100%', padding: '10px 14px 10px 38px', backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px', color: '#F0EDE6', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' }}
          onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(234,88,12,0.12)' }}
          onBlur={e => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
        />
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
            <path d="M24 29v4M16 42c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#ea580c" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 600, color: '#8A8880', marginBottom: '8px' }}>
            Aucun artisan pour l&apos;instant
          </h2>
          <p style={{ color: '#7A7870', fontSize: '13px', marginBottom: '24px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            Ajoutez vos artisans pour les convoquer et suivre leurs interventions.
          </p>
          <Link
            href="/dashboard/artisans/nouveau"
            style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            + Ajouter mon premier artisan
          </Link>
        </div>
      )}

      {!loading && artisans.length > 0 && (() => {
        const q = search.toLowerCase().trim()
        const filtered = q
          ? artisans.filter(a => a.nom.toLowerCase().includes(q) || a.metier.toLowerCase().includes(q))
          : artisans

        if (filtered.length === 0) return (
          <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
            <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
              Aucun artisan ne correspond à &quot;{search}&quot;.
            </p>
          </div>
        )

        return (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '12px' : '20px' }}>
          {[...filtered].sort((a, b) => {
            if (sort === 'nom_asc')  return a.nom.localeCompare(b.nom, 'fr')
            if (sort === 'nom_desc') return b.nom.localeCompare(a.nom, 'fr')
            if (sort === 'date_asc') return a.created_at.localeCompare(b.created_at)
            if (sort === 'metier')   return a.metier.localeCompare(b.metier, 'fr')
            return b.created_at.localeCompare(a.created_at)
          }).map((artisan) => {
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
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(249,115,22,0.1)', color: '#ea580c', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    {initials}
                  </div>
                  {/* Name + badge */}
                  <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 8px' }}>
                    {artisan.nom}
                  </h3>
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, backgroundColor: 'rgba(249,115,22,0.1)', color: '#ea580c', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '14px' }}>
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
        )
      })()}

      {showGoogleModal && (
        <GoogleContactsModal
          onClose={() => setShowGoogleModal(false)}
          onImported={() => {
            const supabase = createClient()
            supabase.from('artisans').select('*').order('created_at', { ascending: false })
              .then(({ data }) => setArtisans(data ?? []))
          }}
        />
      )}
    </div>
  )
}
