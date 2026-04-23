'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Contrat } from '@/lib/supabase/contrats'
import { useIsMobile } from '@/lib/useIsMobile'
import { usePlan } from '@/lib/usePlan'
import UpgradeGate from '@/components/UpgradeGate'

function fmtDate(d: string | null) {
  if (!d) return '—'
  const s = d.includes('T') ? d : d + 'T12:00:00'
  return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export default function ContratsPage() {
  const { isPro } = usePlan()
  const isMobile = useIsMobile()
  const [contrats, setContrats] = useState<Contrat[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('contrats')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setContrats(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = search.trim()
    ? contrats.filter(c =>
        c.nom_client.toLowerCase().includes(search.toLowerCase()) ||
        c.nom_moe.toLowerCase().includes(search.toLowerCase()) ||
        c.adresse_chantier.toLowerCase().includes(search.toLowerCase())
      )
    : contrats

  if (!isPro) return <UpgradeGate feature="Contrats MOE" requiredPlan="pro" />

  return (
    <div className="page-enter" style={{ flex: 1, padding: isMobile ? '16px' : '40px', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
            Contrats MOE
          </h1>
          <p style={{ color: '#8A8880', fontSize: '14px', marginTop: '6px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            {loading ? '…' : `${contrats.length} contrat${contrats.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/dashboard/contrats/nouveau"
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(249,115,22,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
          style={{ padding: '10px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', letterSpacing: '0.01em', transition: 'all 0.2s ease' }}
        >
          + Nouveau contrat
        </Link>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '32px' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="7" cy="7" r="4.5" stroke="#8A8880" strokeWidth="1.5"/>
          <path d="M11 11l3 3" stroke="#8A8880" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un contrat…"
          style={{ width: '100%', padding: '10px 14px 10px 38px', backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px', color: '#F0EDE6', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' }}
          onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(234,88,12,0.12)' }}
          onBlur={e => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {loading && (
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      )}

      {!loading && contrats.length > 0 && search.trim() && filtered.length === 0 && (
        <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
            Aucun contrat ne correspond à &quot;{search}&quot;.
          </p>
        </div>
      )}

      {!loading && contrats.length === 0 && (
        <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '80px 24px', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 20px', display: 'block' }}>
            <rect x="10" y="4" width="28" height="40" rx="2" stroke="#1E1E1C" strokeWidth="2"/>
            <path d="M18 16h12" stroke="#ea580c" strokeWidth="2" strokeLinecap="round"/>
            <path d="M18 24h12" stroke="#1E1E1C" strokeWidth="2" strokeLinecap="round"/>
            <path d="M18 32h8" stroke="#1E1E1C" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 600, color: '#8A8880', marginBottom: '8px' }}>
            Aucun contrat pour l&apos;instant
          </h2>
          <p style={{ color: '#7A7870', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '24px' }}>
            Créez votre premier contrat de maîtrise d&apos;oeuvre.
          </p>
          <Link
            href="/dashboard/contrats/nouveau"
            style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            + Créer mon premier contrat
          </Link>
        </div>
      )}

      {!loading && contrats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? '12px' : '24px' }}>
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/contrats/${c.id}`}
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
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                  <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 700, color: '#F0EDE6', margin: 0, lineHeight: 1.3 }}>
                    {c.nom_client}
                  </h3>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', backgroundColor: 'rgba(249,115,22,0.1)', color: '#ea580c', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    MOE
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 4px' }}>
                  {c.adresse_chantier}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <p style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
                    {fmtDate(c.date_contrat)}
                  </p>
                  <p style={{ fontSize: '14px', color: '#ea580c', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, margin: 0 }}>
                    {fmtEur(c.budget_estimatif)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
