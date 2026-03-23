'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePlan } from '@/lib/usePlan'
import type { Chantier } from '@/lib/supabase/chantiers'

type DevisRow = {
  id: string
  numero: string
  statut: string
  total_ht: number
  total_ttc: number
  lot: string | null
  fichier_url: string | null
  created_at: string
  artisan_id: string | null
  artisan_nom: string | null
}

const DEVIS_STATUT: Record<string, { label: string; bg: string; color: string }> = {
  brouillon:  { label: 'Brouillon',  bg: 'rgba(138,136,128,0.15)', color: '#8A8880' },
  envoye:     { label: 'Envoyé',     bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  accepte:    { label: 'Accepté',    bg: 'rgba(74,222,128,0.15)',  color: '#4ade80' },
  refuse:     { label: 'Refusé',     bg: 'rgba(232,84,71,0.15)',   color: '#E85447' },
  expire:     { label: 'Expiré',     bg: 'rgba(249,115,22,0.15)',  color: '#ea580c' },
}

function Badge({ statut }: { statut: string }) {
  const s = DEVIS_STATUT[statut] ?? { label: statut, bg: 'rgba(138,136,128,0.15)', color: '#8A8880' }
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: s.bg, color: s.color, fontFamily: 'var(--font-dm-sans), sans-serif', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function fmtEur(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#8A8880',
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

export default function LotsDevis({ chantier }: { chantier: Chantier }) {
  const pathname = usePathname()
  const { isComplet } = usePlan()
  const [devis, setDevis] = useState<DevisRow[]>([])
  const [loading, setLoading] = useState(true)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('devis')
        .select('id, numero, statut, total_ht, total_ttc, lot, fichier_url, created_at, artisan_id, artisans(nom)')
        .eq('chantier_id', chantier.id)
        .order('created_at', { ascending: true })

      const rows = (data ?? []).map((r: {
        id: string; numero: string; statut: string; total_ht: number; total_ttc: number;
        lot: string | null; fichier_url: string | null; created_at: string; artisan_id: string | null;
        artisans: { nom: string } | { nom: string }[] | null
      }) => ({
        ...r,
        artisan_nom: r.artisans
          ? (Array.isArray(r.artisans) ? r.artisans[0]?.nom : (r.artisans as { nom: string }).nom) ?? null
          : null,
      })) as DevisRow[]

      setDevis(rows)

      // Open all groups by default
      const groups: Record<string, boolean> = {}
      rows.forEach(d => {
        const key = d.artisan_id ?? '__none__'
        groups[key] = true
      })
      setOpenGroups(groups)
      setLoading(false)
    }
    load()
  }, [chantier.id])

  const STATUTS_CHANTIER = ['En cours', 'En pause', 'Terminé'] as const
  type StatutChantier = typeof STATUTS_CHANTIER[number]
  const STATUT_COLORS: Record<StatutChantier, { bg: string; text: string }> = {
    'En cours': { bg: '#1a2e1a', text: '#4ade80' },
    'Terminé':  { bg: '#1a1a2e', text: '#818cf8' },
    'En pause': { bg: '#2e2a1a', text: '#fbbf24' },
  }
  const colors = STATUT_COLORS[chantier.statut as StatutChantier] ?? STATUT_COLORS['En cours']
  const progression = chantier.statut === 'Terminé' ? 100 : chantier.statut === 'En pause' ? 30 : 65

  const tabItems = [
    { label: 'Infos', href: `/dashboard/chantiers/${chantier.id}`, pro: false },
    { label: 'Lots & Devis', href: `/dashboard/chantiers/${chantier.id}/lots`, pro: true },
    { label: 'Devis', href: `/dashboard/chantiers/${chantier.id}/devis`, pro: true },
    { label: 'Factures', href: `/dashboard/chantiers/${chantier.id}/factures`, pro: true },
  ]

  // Group by artisan
  type Group = { artisan_id: string | null; artisan_nom: string | null; rows: DevisRow[] }
  const groups: Group[] = []
  const seen = new Set<string>()
  for (const d of devis) {
    const key = d.artisan_id ?? '__none__'
    if (!seen.has(key)) {
      seen.add(key)
      groups.push({ artisan_id: d.artisan_id, artisan_nom: d.artisan_nom, rows: [] })
    }
    groups.find(g => (g.artisan_id ?? '__none__') === key)!.rows.push(d)
  }
  // Sort groups by artisan_nom
  groups.sort((a, b) => {
    if (!a.artisan_nom && !b.artisan_nom) return 0
    if (!a.artisan_nom) return 1
    if (!b.artisan_nom) return -1
    return a.artisan_nom.localeCompare(b.artisan_nom, 'fr')
  })

  const grandTotalHt = devis.reduce((s, d) => s + d.total_ht, 0)
  const grandTotalTtc = devis.reduce((s, d) => s + d.total_ttc, 0)

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '900px' }}>
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
          <span style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', backgroundColor: colors.bg, color: colors.text, flexShrink: 0 }}>
            {chantier.statut}
          </span>
        </div>
        <p style={{ color: '#8A8880', fontSize: '13px', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '0 0 16px' }}>
          {chantier.adresse}
        </p>
        <div style={{ width: '100%', height: '4px', backgroundColor: '#1E1E1C', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progression}%`, backgroundColor: '#ea580c', borderRadius: '999px', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
        <p style={{ fontSize: '11px', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '6px 0 0', textAlign: 'right' }}>
          {progression}%
        </p>
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
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'var(--font-dm-sans), sans-serif',
                textDecoration: 'none',
                color: active ? '#ea580c' : '#8A8880',
                borderBottom: active ? '2px solid #ea580c' : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#F0EDE6' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#8A8880' }}
            >
              {tab.label}
              {tab.pro && !isComplet && (
                <span style={{ marginLeft: 5, background: '#1E1E1C', color: '#ea580c', fontSize: '9px', fontWeight: 600, padding: '2px 5px', borderRadius: '4px' }}>Pro</span>
              )}
            </Link>
          )
        })}
      </div>

      <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 18, fontWeight: 700, color: '#F0EDE6', margin: '0 0 24px' }}>
        Lots & Devis par artisan
      </h2>

      {loading && (
        <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      )}

      {!loading && devis.length === 0 && (
        <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: 12, padding: '60px 24px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <p style={{ color: '#8A8880', fontSize: 14, fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
            Aucun devis pour ce chantier.{' '}
            <Link href="/dashboard/comptabilite/devis/nouveau" style={{ color: '#ea580c' }}>Créer un devis</Link>
          </p>
        </div>
      )}

      {!loading && devis.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groups.map(group => {
            const key = group.artisan_id ?? '__none__'
            const open = openGroups[key] !== false
            const groupHt = group.rows.reduce((s, d) => s + d.total_ht, 0)
            const groupTtc = group.rows.reduce((s, d) => s + d.total_ttc, 0)

            return (
              <div key={key} style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 12, overflow: 'hidden', position: 'relative', zIndex: 2 }}>
                {/* Group header */}
                <button
                  onClick={() => setOpenGroups(p => ({ ...p, [key]: !open }))}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(234,88,12,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 13, color: '#ea580c' }}>
                        {group.artisan_nom ? group.artisan_nom.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?'}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 14, fontWeight: 600, color: '#F0EDE6', margin: 0 }}>
                        {group.artisan_nom ?? 'Artisan non assigné'}
                      </p>
                      <p style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', margin: '2px 0 0' }}>
                        {group.rows.length} devis · HT : {fmtEur(groupHt)} · TTC : {fmtEur(groupTtc)}
                      </p>
                    </div>
                  </div>
                  <span style={{ color: '#8A8880', fontSize: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                </button>

                {/* Rows */}
                {open && (
                  <div style={{ borderTop: '1px solid #1E1E1C' }}>
                    {/* Table header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 110px 110px 100px 80px', gap: 8, padding: '10px 20px', borderBottom: '1px solid #1E1E1C' }}>
                      {['Lot / N° devis', 'Montant HT', 'Montant TTC', 'Statut', 'PDF', ''].map(h => (
                        <span key={h} style={{ ...labelStyle, fontSize: 10 }}>{h}</span>
                      ))}
                    </div>
                    {group.rows.map(d => (
                      <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 110px 110px 100px 80px', gap: 8, padding: '12px 20px', borderBottom: '1px solid #0D0D0B', alignItems: 'center' }}>
                        <div>
                          {d.lot && (
                            <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#ea580c', fontFamily: 'var(--font-dm-sans), sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{d.lot}</span>
                          )}
                          <span style={{ fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>{d.numero}</span>
                        </div>
                        <span style={{ fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', textAlign: 'right' }}>{fmtEur(d.total_ht)}</span>
                        <span style={{ fontSize: 13, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', textAlign: 'right' }}>{fmtEur(d.total_ttc)}</span>
                        <div><Badge statut={d.statut} /></div>
                        <div>
                          {d.fichier_url ? (
                            <a href={d.fichier_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#60a5fa', fontFamily: 'var(--font-dm-sans), sans-serif', textDecoration: 'underline' }}>PDF</a>
                          ) : (
                            <span style={{ fontSize: 12, color: '#4A4A48', fontFamily: 'var(--font-dm-sans), sans-serif' }}>—</span>
                          )}
                        </div>
                        <Link href={`/dashboard/comptabilite/devis/${d.id}`} style={{ fontSize: 12, color: '#ea580c', fontFamily: 'var(--font-dm-sans), sans-serif', textDecoration: 'none' }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >Voir →</Link>
                      </div>
                    ))}

                    {/* Group subtotal */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 32, padding: '12px 20px', backgroundColor: '#0D0D0B' }}>
                      <span style={{ fontSize: 12, color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Total artisan</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', minWidth: 100, textAlign: 'right' }}>HT {fmtEur(groupHt)}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#ea580c', fontFamily: 'var(--font-dm-sans), sans-serif', minWidth: 100, textAlign: 'right' }}>TTC {fmtEur(groupTtc)}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Grand total */}
          <div style={{ backgroundColor: '#111110', border: '1px solid #ea580c', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: 32, position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#F0EDE6', fontFamily: 'var(--font-syne), sans-serif' }}>Total chantier</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', minWidth: 120, textAlign: 'right' }}>HT {fmtEur(grandTotalHt)}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#ea580c', fontFamily: 'var(--font-syne), sans-serif', minWidth: 120, textAlign: 'right' }}>TTC {fmtEur(grandTotalTtc)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
