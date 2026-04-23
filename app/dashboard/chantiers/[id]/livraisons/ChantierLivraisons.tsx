'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getLivraisons, LIVRAISON_STATUT } from '@/lib/supabase/livraisons'
import { usePlan } from '@/lib/usePlan'
import type { Chantier } from '@/lib/supabase/chantiers'
import type { LivraisonWithChantier } from '@/lib/supabase/livraisons'

function fmt(iso: string | null | undefined) {
  if (!iso) return '—'
  const s = iso.includes('T') ? iso : iso + 'T12:00:00'
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ChantierLivraisons({ chantier }: { chantier: Chantier }) {
  const pathname = usePathname()
  const { isPro } = usePlan()
  const [livraisons, setLivraisons] = useState<LivraisonWithChantier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLivraisons(chantier.id).then(data => {
      setLivraisons(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [chantier.id])

  const STATUTS_CHANTIER = ['En cours', 'En pause', 'Terminé'] as const
  type StatutChantier = typeof STATUTS_CHANTIER[number]
  const STATUT_COLORS: Record<StatutChantier, { bg: string; text: string }> = {
    'En cours': { bg: '#1a2e1a', text: '#4ade80' },
    'Terminé':  { bg: '#1a1a2e', text: '#818cf8' },
    'En pause': { bg: '#2e2a1a', text: '#fbbf24' },
  }
  const colors = STATUT_COLORS[chantier.statut as StatutChantier] ?? STATUT_COLORS['En cours']

  const tabItems = [
    { label: 'Infos',          href: `/dashboard/chantiers/${chantier.id}`,                 pro: false },
    { label: 'Lots & Devis',   href: `/dashboard/chantiers/${chantier.id}/lots`,             pro: true },
    { label: 'Devis',          href: `/dashboard/chantiers/${chantier.id}/devis`,            pro: true },
    { label: 'Factures',       href: `/dashboard/chantiers/${chantier.id}/factures`,         pro: true },
    { label: 'Devis artisans', href: `/dashboard/chantiers/${chantier.id}/devis-artisans`,   pro: true },
    { label: 'Livraisons',     href: `/dashboard/chantiers/${chantier.id}/livraisons`,       pro: false },
  ]

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '860px' }}>
      {/* Back */}
      <Link
        href="/dashboard/chantiers"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#ea580c' }}>←</span>
        Retour aux chantiers
      </Link>

      {/* Visual header */}
      <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #1E1E1C' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '28px', fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
            {chantier.nom}
          </h1>
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: colors.bg, color: colors.text, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
            {chantier.statut}
          </span>
        </div>
        {chantier.client && (
          <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>{chantier.client}</p>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', borderBottom: '1px solid #1E1E1C' }}>
        {tabItems.map(tab => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                padding: '10px 16px',
                fontSize: active ? 15 : 14,
                fontWeight: active ? 600 : 400,
                fontFamily: 'var(--font-dm-sans), sans-serif',
                color: active ? '#ea580c' : '#8A8880',
                textDecoration: 'none',
                borderBottom: active ? '2px solid #ea580c' : '2px solid transparent',
                marginBottom: -1,
                transition: 'color 0.15s',
                opacity: !isPro && tab.pro ? 0.5 : 1,
                pointerEvents: !isPro && tab.pro ? 'none' : 'auto',
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 18, fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
          Livraisons{!loading && ` (${livraisons.length})`}
        </h2>
        <Link
          href={`/dashboard/livraisons/nouveau?chantier=${chantier.id}`}
          style={{ padding: '9px 16px', backgroundColor: '#ea580c', color: '#0D0D0B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
        >
          + Nouvelle livraison
        </Link>
      </div>

      {loading ? (
        <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: 24 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 52, backgroundColor: '#1E1E1C', borderRadius: 8, marginBottom: 8 }} />
          ))}
        </div>
      ) : livraisons.length === 0 ? (
        <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 16px' }}>
            Aucune livraison pour ce chantier.
          </p>
          <Link
            href={`/dashboard/livraisons/nouveau?chantier=${chantier.id}`}
            style={{ padding: '10px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Créer la première livraison
          </Link>
        </div>
      ) : (
        <div style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Numéro', 'Date', 'Statut', 'Réserves', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7A7870', borderBottom: '1px solid #1E1E1C', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {livraisons.map(lv => {
                const s = LIVRAISON_STATUT[lv.statut]
                return (
                  <tr
                    key={lv.id}
                    style={{ transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 500, borderBottom: '1px solid #1E1E1C' }}>
                      {lv.numero ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', borderBottom: '1px solid #1E1E1C' }}>
                      {fmt(lv.date_reception)}
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #1E1E1C' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: s.bg, color: s.color, fontFamily: 'var(--font-dm-sans), sans-serif', whiteSpace: 'nowrap' }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', borderBottom: '1px solid #1E1E1C' }}>
                      {lv.statut === 'accepte' ? '—' : (
                        <span style={{ color: '#ea580c' }}>
                          {/* reserves count not loaded in list view */}
                          Voir détail
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #1E1E1C' }}>
                      <Link
                        href={`/dashboard/livraisons/${lv.id}`}
                        style={{ fontSize: 12, color: '#ea580c', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
                      >
                        Consulter →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
