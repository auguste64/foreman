'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createCompteRendu } from '@/lib/supabase/comptes-rendus'
import type { CompteRenduWithChantier } from '@/lib/supabase/comptes-rendus'
import { toast } from '@/components/Toast'
import { useIsMobile } from '@/lib/useIsMobile'

export default function ComptesRendusPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [items, setItems] = useState<CompteRenduWithChantier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [duplicating, setDuplicating] = useState<Set<string>>(new Set())

  async function handleDuplicate(cr: CompteRenduWithChantier, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (duplicating.has(cr.id)) return
    setDuplicating(prev => new Set(prev).add(cr.id))
    try {
      const newCr = await createCompteRendu({
        chantier_id: cr.chantier_id,
        date_visite: new Date().toISOString().split('T')[0],
        date_prochaine_visite: null,
        progression: cr.progression,
        observations: cr.observations,
        travaux_a_faire: cr.travaux_a_faire,
        artisans_presents: cr.artisans_presents,
        photos: cr.photos,
      })
      toast.success('CR dupliqué')
      router.push(`/dashboard/comptes-rendus/${newCr.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la duplication')
      setDuplicating(prev => { const s = new Set(prev); s.delete(cr.id); return s })
    }
  }

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
    <div className="page-enter" style={{ flex: 1, padding: isMobile ? '16px' : '40px', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
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
            backgroundColor: '#ea580c',
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
          placeholder="Rechercher par chantier ou numéro CR…"
          style={{ width: '100%', padding: '10px 14px 10px 38px', backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '8px', color: '#F0EDE6', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', boxSizing: 'border-box' }}
          onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 2px rgba(234,88,12,0.12)' }}
          onBlur={e => { e.target.style.borderColor = '#1E1E1C'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {loading && (
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      )}

      {!loading && items.length === 0 && (
        <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '80px 24px', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 20px', display: 'block' }}>
            <rect x="8" y="6" width="32" height="36" rx="2" stroke="#1E1E1C" strokeWidth="2"/>
            <path d="M14 16h20M14 22h16M14 28h10" stroke="#ea580c" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="36" cy="36" r="8" fill="#111110" stroke="#ea580c" strokeWidth="2"/>
            <path d="M33 36h6M36 33v6" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '16px', fontWeight: 600, color: '#8A8880', marginBottom: '8px' }}>
            Aucun compte rendu pour l&apos;instant
          </h2>
          <p style={{ color: '#7A7870', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '24px' }}>
            Rédigez votre premier compte rendu de visite de chantier.
          </p>
          <Link
            href="/dashboard/comptes-rendus/nouveau"
            style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            + Créer mon premier CR
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (() => {
        const q = search.toLowerCase().trim()
        const filtered = q
          ? items.filter((cr, _, arr) => {
              const chantierNom = (cr.chantiers as any)?.nom ?? ''
              if (chantierNom.toLowerCase().includes(q)) return true
              // match CR number within group: count position in same chantier
              const groupItems = arr.filter(x => x.chantier_id === cr.chantier_id)
              const idx = groupItems.indexOf(cr)
              return `cr #${idx + 1}`.includes(q) || `${idx + 1}`.includes(q)
            })
          : items

        if (filtered.length === 0) return (
          <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
            <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
              Aucun compte rendu ne correspond à &quot;{search}&quot;.
            </p>
          </div>
        )

        const grouped = filtered.reduce((acc, cr) => {
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
                  <span style={{ padding: '2px 8px', backgroundColor: 'rgba(249,115,22,0.1)', color: '#ea580c', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    {group.items.length} CR
                  </span>
                </div>

                {/* Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {group.items.map((cr, index) => (
                    <div
                      key={cr.id}
                      onClick={() => router.push(`/dashboard/comptes-rendus/${cr.id}`)}
                      style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'all 0.15s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(6px)'; e.currentTarget.style.background = 'rgba(249,115,22,0.03)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; }}
                    >
                      {/* Index badge */}
                      <span style={{ padding: '2px 8px', backgroundColor: 'rgba(249,115,22,0.08)', color: '#ea580c', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}>
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

                      {/* Date + Duplicate */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <div style={{ fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', textAlign: 'right' }}>
                          <div>{new Date(cr.date_visite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          {cr.date_prochaine_visite && (
                            <div style={{ fontSize: '12px', color: '#ea580c', marginTop: '2px' }}>
                              Prochaine réunion : {new Date(cr.date_prochaine_visite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={e => handleDuplicate(cr, e)}
                          disabled={duplicating.has(cr.id)}
                          title="Dupliquer ce CR"
                          style={{ padding: '6px 8px', backgroundColor: 'transparent', border: '1px solid #1E1E1C', borderRadius: '6px', color: '#8A8880', cursor: duplicating.has(cr.id) ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
                          onMouseEnter={e => { if (!duplicating.has(cr.id)) { e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c'; e.currentTarget.style.backgroundColor = 'rgba(234,88,12,0.08)' }}}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#8A8880'; e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M11 5V3.5A1.5 1.5 0 009.5 2H3.5A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
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
