'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { calcTotaux, type LigneDevis } from '@/lib/supabase/devis'
import { createClient } from '@/lib/supabase/client'

function formatMontant(val: unknown) {
  const n = parseFloat(String(val))
  return isNaN(n) ? '—' : n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'
}

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  brouillon: { bg: '#1E1E1C', text: '#8A8880' },
  envoye:    { bg: '#1a2035', text: '#60a5fa' },
  accepte:   { bg: '#1a2e1a', text: '#4ade80' },
  refuse:    { bg: '#2e1a1a', text: '#E85447' },
}

const STATUT_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  envoye:    'Envoyé',
  accepte:   'Accepté',
  refuse:    'Refusé',
}

type DevisRow = {
  id: string
  numero: string
  statut: string
  tva_pct: number
  chantier_nom: string | null
  devis_lignes: LigneDevis[]
}

function ArtisanTabs({ artisanId }: { artisanId: string }) {
  const pathname = usePathname()
  const tabs = [
    { label: 'Infos', href: `/dashboard/artisans/${artisanId}` },
    { label: 'Devis', href: `/dashboard/artisans/${artisanId}/devis` },
  ]
  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', borderBottom: '1px solid #1E1E1C' }}>
      {tabs.map(tab => {
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
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

export default function ArtisanDevisPage() {
  const params = useParams()
  const artisanId = params.id as string
  const [devis, setDevis] = useState<DevisRow[]>([])
  const [loading, setLoading] = useState(true)
  const [artisanNom, setArtisanNom] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [devisRes, artisanRes] = await Promise.all([
        supabase
          .from('devis')
          .select('id, numero, statut, tva_pct, devis_lignes(*), chantiers(nom)')
          .eq('artisan_id', artisanId)
          .order('created_at', { ascending: false }),
        supabase.from('artisans').select('nom').eq('id', artisanId).single(),
      ])
      const rows = (devisRes.data ?? []).map((d: {
        id: string
        numero: string
        statut: string
        tva_pct: number
        devis_lignes: LigneDevis[]
        chantiers: { nom: string } | { nom: string }[] | null
      }) => ({
        id: d.id,
        numero: d.numero,
        statut: d.statut,
        tva_pct: d.tva_pct,
        devis_lignes: d.devis_lignes ?? [],
        chantier_nom: d.chantiers
          ? (Array.isArray(d.chantiers) ? d.chantiers[0]?.nom : (d.chantiers as { nom: string }).nom) ?? null
          : null,
      }))
      setDevis(rows)
      setArtisanNom(artisanRes.data?.nom ?? '')
      setLoading(false)
    }
    load()
  }, [artisanId])

  return (
    <div className="page-enter" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '800px' }}>
      <Link
        href="/dashboard/artisans"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: 8, padding: '8px 14px', color: '#F0EDE6', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s ease', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: 28 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1E1E1C'; e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.color = '#ea580c' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111110'; e.currentTarget.style.borderColor = '#1E1E1C'; e.currentTarget.style.color = '#F0EDE6' }}
      >
        <span style={{ color: '#ea580c' }}>←</span>
        Retour aux artisans
      </Link>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '24px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 4px' }}>
          {artisanNom}
        </h1>
      </div>

      <ArtisanTabs artisanId={artisanId} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', margin: 0 }}>
          Devis {!loading && <span style={{ color: '#8A8880', fontSize: '14px', fontWeight: 400 }}>({devis.length})</span>}
        </h2>
        <Link
          href={`/dashboard/artisans/${artisanId}/devis/nouveau`}
          style={{ padding: '9px 18px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
        >
          + Nouveau devis
        </Link>
      </div>

      {loading && (
        <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif' }}>Chargement…</p>
      )}

      {!loading && devis.length === 0 && (
        <div style={{ backgroundColor: '#111110', border: '1px dashed #1E1E1C', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ color: '#8A8880', fontSize: '14px', fontFamily: 'var(--font-dm-sans), sans-serif', marginBottom: '16px' }}>
            Aucun devis pour cet artisan.
          </p>
          <Link
            href={`/dashboard/artisans/${artisanId}/devis/nouveau`}
            style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#ea580c', color: '#0D0D0B', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            + Créer un devis
          </Link>
        </div>
      )}

      {!loading && devis.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {devis.map(d => {
            const sc = STATUT_COLORS[d.statut] ?? STATUT_COLORS.brouillon
            const totaux = calcTotaux(d.devis_lignes, d.tva_pct)
            return (
              <Link
                key={d.id}
                href={`/dashboard/artisans/${artisanId}/devis/${d.id}`}
                style={{ backgroundColor: '#111110', border: '1px solid #1E1E1C', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', transition: 'all 0.15s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = '#1E1E1C' }}
              >
                <span style={{ padding: '2px 8px', backgroundColor: 'rgba(249,115,22,0.08)', color: '#ea580c', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}>
                  {d.numero}
                </span>
                <span style={{ flex: 1, fontSize: '14px', color: d.chantier_nom ? '#F0EDE6' : '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: d.chantier_nom ? 'normal' : 'italic' }}>
                  {d.chantier_nom || 'Sans chantier'}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif', flexShrink: 0 }}>
                  {formatMontant(totaux.ttc)}
                </span>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, fontFamily: 'var(--font-dm-sans), sans-serif', backgroundColor: sc.bg, color: sc.text, flexShrink: 0 }}>
                  {STATUT_LABELS[d.statut] ?? d.statut}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
